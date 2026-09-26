import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser, isManager } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rules = await prisma.reorderRule.findMany({
      include: {
        product: {
          include: {
            stocks: true,
          },
        },
        warehouse: true,
        location: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = rules.map((r) => {
      // Calculate current available stock for this rule's scope
      let onHand = 0;
      let reserved = 0;

      r.product.stocks.forEach((s) => {
        if (!r.warehouseId || s.warehouseId === r.warehouseId) {
          if (!r.locationId || s.locationId === r.locationId) {
            onHand += s.quantity;
            reserved += s.reservedQuantity;
          }
        }
      });

      const available = Math.max(0, onHand - reserved);
      const isTriggered = available <= r.reorderPoint;

      return {
        id: r.id,
        productId: r.productId,
        productName: r.product.name,
        sku: r.product.sku,
        unit: r.product.uom,
        warehouseName: r.warehouse?.name || "All Warehouses",
        locationName: r.location?.name || "All Locations",
        minQuantity: r.minQuantity,
        reorderPoint: r.reorderPoint,
        maxQuantity: r.maxQuantity,
        reorderQuantity: r.reorderQuantity,
        preferredSupplier: r.preferredSupplier || r.product.supplier || "—",
        currentAvailable: available,
        isTriggered,
        status: r.status,
      };
    });

    return NextResponse.json({ rules: formatted });
  } catch (error) {
    console.error("Fetch reorder rules error:", error);
    return NextResponse.json({ error: "Failed to fetch reorder rules" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isManager(user)) {
      return NextResponse.json({ error: "Unauthorized. Manager role required." }, { status: 403 });
    }

    const body = await req.json();
    const {
      productId,
      warehouseId,
      locationId,
      minQuantity,
      reorderPoint,
      maxQuantity,
      reorderQuantity,
      preferredSupplier,
      status,
    } = body;

    if (!productId || reorderPoint === undefined) {
      return NextResponse.json({ error: "Product and Reorder Point are required" }, { status: 400 });
    }

    const rule = await prisma.reorderRule.create({
      data: {
        productId,
        warehouseId: warehouseId || null,
        locationId: locationId || null,
        minQuantity: parseInt(minQuantity, 10) || 10,
        reorderPoint: parseInt(reorderPoint, 10),
        maxQuantity: parseInt(maxQuantity, 10) || 500,
        reorderQuantity: parseInt(reorderQuantity, 10) || 50,
        preferredSupplier: preferredSupplier?.trim() || null,
        status: status || "ACTIVE",
      },
    });

    return NextResponse.json({ success: true, rule });
  } catch (error) {
    console.error("Create reorder rule error:", error);
    return NextResponse.json({ error: "Failed to create reorder rule" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isManager(user)) {
      return NextResponse.json({ error: "Unauthorized. Manager role required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing rule ID" }, { status: 400 });

    await prisma.reorderRule.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete reorder rule error:", error);
    return NextResponse.json({ error: "Failed to delete reorder rule" }, { status: 500 });
  }
}
