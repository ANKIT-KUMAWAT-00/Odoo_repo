import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { getNextDocumentNumber, validateInternalTransfer } from "@/lib/inventory/inventory-service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim();

    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (search) {
      where.transferNumber = { contains: search };
    }

    const transfers = await prisma.internalTransfer.findMany({
      where,
      include: {
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = await Promise.all(
      transfers.map(async (t) => {
        const sourceWh = await prisma.warehouse.findUnique({ where: { id: t.sourceWarehouseId } });
        const sourceLoc = await prisma.location.findUnique({ where: { id: t.sourceLocationId } });
        const destWh = await prisma.warehouse.findUnique({ where: { id: t.destinationWarehouseId } });
        const destLoc = await prisma.location.findUnique({ where: { id: t.destinationLocationId } });

        const totalQty = t.items.reduce((sum, item) => sum + item.quantity, 0);

        return {
          id: t.id,
          transferNumber: t.transferNumber,
          sourceWarehouse: sourceWh?.name || "Warehouse",
          sourceLocation: sourceLoc?.name || "Rack",
          destWarehouse: destWh?.name || "Warehouse",
          destLocation: destLoc?.name || "Rack",
          scheduledDate: t.scheduledDate,
          status: t.status,
          itemCount: t.items.length,
          totalQuantity: totalQty,
          items: t.items,
          createdAt: t.createdAt,
          validatedAt: t.validatedAt,
        };
      })
    );

    return NextResponse.json({ transfers: formatted });
  } catch (error) {
    console.error("Fetch transfers error:", error);
    return NextResponse.json({ error: "Failed to fetch transfers" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      sourceWarehouseId,
      sourceLocationId,
      destinationWarehouseId,
      destinationLocationId,
      scheduledDate,
      notes,
      items,
      action,
    } = body;

    if (!sourceWarehouseId || !sourceLocationId || !destinationWarehouseId || !destinationLocationId) {
      return NextResponse.json(
        { error: "Source and Destination Warehouses and Locations are required" },
        { status: 400 }
      );
    }

    if (sourceLocationId === destinationLocationId) {
      return NextResponse.json(
        { error: "Source location and Destination location cannot be the same" },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "At least one product item is required" }, { status: 400 });
    }

    // Verify stock availability at source location
    for (const item of items) {
      const stock = await prisma.stock.findUnique({
        where: {
          productId_locationId: {
            productId: item.productId,
            locationId: sourceLocationId,
          },
        },
        include: { product: true },
      });

      const currentQty = stock?.quantity ?? 0;
      if (currentQty < parseInt(item.quantity, 10)) {
        return NextResponse.json(
          {
            error: `Insufficient stock for "${stock?.product.name || "Item"}". Available in source rack: ${currentQty}, Requested: ${item.quantity}`,
          },
          { status: 400 }
        );
      }
    }

    const transferNumber = await getNextDocumentNumber("TRF");
    const initialStatus = action === "CONFIRM" ? "READY" : "DRAFT";

    const transfer = await prisma.internalTransfer.create({
      data: {
        transferNumber,
        sourceWarehouseId,
        sourceLocationId,
        destinationWarehouseId,
        destinationLocationId,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        assignedUserId: user.id,
        notes: notes?.trim() || null,
        status: initialStatus,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: parseInt(item.quantity, 10),
            unit: item.unit || "units",
          })),
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: "CREATE_TRANSFER",
        entity: "InternalTransfer",
        entityId: transfer.id,
        newValue: `${transfer.transferNumber} - Status: ${initialStatus}`,
      },
    });

    // If direct validation requested
    if (action === "VALIDATE") {
      const validated = await validateInternalTransfer(transfer.id, user.id, user.name);
      return NextResponse.json({ success: true, transfer: validated });
    }

    return NextResponse.json({ success: true, transfer });
  } catch (error) {
    console.error("Create transfer error:", error);
    return NextResponse.json({ error: "Failed to create internal transfer" }, { status: 500 });
  }
}
