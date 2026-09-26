import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { adjustStock } from "@/lib/inventory/inventory-service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const warehouseId = searchParams.get("warehouseId");
    const reason = searchParams.get("reason");
    const search = searchParams.get("search")?.trim();

    const where: any = {};
    if (warehouseId && warehouseId !== "ALL") where.warehouseId = warehouseId;
    if (reason && reason !== "ALL") where.reason = reason;
    if (search) {
      where.OR = [
        { adjustmentNumber: { contains: search } },
        { product: { name: { contains: search } } },
        { product: { sku: { contains: search } } },
      ];
    }

    const adjustments = await prisma.inventoryAdjustment.findMany({
      where,
      include: {
        warehouse: true,
        location: true,
        product: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = adjustments.map((a) => ({
      id: a.id,
      adjustmentNumber: a.adjustmentNumber,
      productName: a.product.name,
      sku: a.product.sku,
      unit: a.product.uom,
      warehouseName: a.warehouse.name,
      locationName: a.location.name,
      systemQuantity: a.systemQuantity,
      countedQuantity: a.countedQuantity,
      difference: a.difference,
      reason: a.reason,
      notes: a.notes,
      status: a.status,
      createdAt: a.createdAt,
    }));

    return NextResponse.json({ adjustments: formatted });
  } catch (error) {
    console.error("Fetch adjustments error:", error);
    return NextResponse.json({ error: "Failed to fetch adjustments" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { warehouseId, locationId, productId, countedQuantity, reason, notes } = body;

    if (!warehouseId || !locationId || !productId || countedQuantity === undefined || !reason) {
      return NextResponse.json(
        { error: "Warehouse, Location, Product, Counted Quantity, and Reason are required" },
        { status: 400 }
      );
    }

    const parsedCounted = parseInt(countedQuantity, 10);
    if (isNaN(parsedCounted) || parsedCounted < 0) {
      return NextResponse.json(
        { error: "Counted physical quantity must be a non-negative number" },
        { status: 400 }
      );
    }

    const adjustment = await adjustStock({
      warehouseId,
      locationId,
      productId,
      countedQuantity: parsedCounted,
      reason,
      notes: notes?.trim() || undefined,
      userId: user.id,
      userName: user.name,
    });

    return NextResponse.json({ success: true, adjustment });
  } catch (error: any) {
    console.error("Create adjustment error:", error);
    return NextResponse.json({ error: error.message || "Failed to adjust stock" }, { status: 500 });
  }
}
