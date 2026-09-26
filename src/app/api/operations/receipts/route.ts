import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { getNextDocumentNumber, validateReceipt } from "@/lib/inventory/inventory-service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const warehouseId = searchParams.get("warehouseId");
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim();

    const where: any = {};
    if (warehouseId && warehouseId !== "ALL") where.warehouseId = warehouseId;
    if (status && status !== "ALL") where.status = status;
    if (search) {
      where.OR = [
        { receiptNumber: { contains: search } },
        { supplier: { contains: search } },
      ];
    }

    const receipts = await prisma.receipt.findMany({
      where,
      include: {
        warehouse: true,
        destinationLocation: true,
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = receipts.map((r) => {
      const totalExpected = r.items.reduce((sum, item) => sum + item.expectedQuantity, 0);
      const totalReceived = r.items.reduce((sum, item) => sum + item.receivedQuantity, 0);
      return {
        id: r.id,
        receiptNumber: r.receiptNumber,
        supplier: r.supplier,
        warehouseName: r.warehouse.name,
        warehouseId: r.warehouseId,
        locationName: r.destinationLocation.name,
        expectedDate: r.expectedDate,
        status: r.status,
        itemCount: r.items.length,
        totalExpected,
        totalReceived,
        createdAt: r.createdAt,
        validatedAt: r.validatedAt,
      };
    });

    return NextResponse.json({ receipts: formatted });
  } catch (error) {
    console.error("Fetch receipts error:", error);
    return NextResponse.json({ error: "Failed to fetch receipts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { supplier, warehouseId, destinationLocationId, expectedDate, notes, items, action } = body;

    if (!supplier || !warehouseId || !destinationLocationId) {
      return NextResponse.json({ error: "Supplier, Warehouse, and Destination Location are required" }, { status: 400 });
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "At least one product item is required" }, { status: 400 });
    }

    const receiptNumber = await getNextDocumentNumber("REC");
    const initialStatus = action === "CONFIRM" ? "READY" : "DRAFT";

    const receipt = await prisma.receipt.create({
      data: {
        receiptNumber,
        supplier: supplier.trim(),
        warehouseId,
        destinationLocationId,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        notes: notes?.trim() || null,
        status: initialStatus,
        createdByUserId: user.id,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            expectedQuantity: parseInt(item.expectedQuantity, 10),
            receivedQuantity: parseInt(item.receivedQuantity || "0", 10),
            unit: item.unit || "units",
            batchLot: item.batchLot || null,
          })),
        },
      },
      include: {
        items: { include: { product: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: "CREATE_RECEIPT",
        entity: "Receipt",
        entityId: receipt.id,
        newValue: `${receipt.receiptNumber} (${receipt.supplier}) - Status: ${initialStatus}`,
      },
    });

    // If direct validation requested
    if (action === "VALIDATE") {
      const validated = await validateReceipt(receipt.id, user.id, user.name);
      return NextResponse.json({ success: true, receipt: validated });
    }

    return NextResponse.json({ success: true, receipt });
  } catch (error) {
    console.error("Create receipt error:", error);
    return NextResponse.json({ error: "Failed to create receipt" }, { status: 500 });
  }
}
