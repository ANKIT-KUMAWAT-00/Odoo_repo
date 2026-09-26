import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { validateDelivery } from "@/lib/inventory/inventory-service";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const delivery = await prisma.deliveryOrder.findUnique({
      where: { id },
      include: {
        warehouse: true,
        sourceLocation: true,
        items: {
          include: {
            product: {
              include: { stocks: true },
            },
          },
        },
      },
    });

    if (!delivery) {
      return NextResponse.json({ error: "Delivery order not found" }, { status: 404 });
    }

    // Attach current on-hand and available quantity at the source location
    const formattedItems = delivery.items.map((item) => {
      const stockAtLoc = item.product.stocks.find(
        (s) => s.locationId === delivery.sourceLocationId
      );
      const onHand = stockAtLoc?.quantity ?? 0;
      const reserved = stockAtLoc?.reservedQuantity ?? 0;
      const available = Math.max(0, onHand - reserved);

      return {
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        sku: item.product.sku,
        requestedQuantity: item.requestedQuantity,
        pickedQuantity: item.pickedQuantity,
        unit: item.unit,
        locationOnHand: onHand,
        locationAvailable: available,
      };
    });

    return NextResponse.json({
      delivery: {
        ...delivery,
        items: formattedItems,
      },
    });
  } catch (error) {
    console.error("Delivery detail error:", error);
    return NextResponse.json({ error: "Failed to fetch delivery order" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { action, pickedQuantities } = body;

    // STEP 1: PICK
    if (action === "PICK") {
      await prisma.$transaction(async (tx) => {
        if (pickedQuantities && typeof pickedQuantities === "object") {
          for (const [itemId, qty] of Object.entries(pickedQuantities)) {
            await tx.deliveryItem.update({
              where: { id: itemId },
              data: { pickedQuantity: Number(qty) },
            });
          }
        }
        await tx.deliveryOrder.update({
          where: { id },
          data: { status: "PICKING", assignedToUserId: user.id },
        });
      });
      return NextResponse.json({ success: true, status: "PICKING" });
    }

    // STEP 2: PACK
    if (action === "PACK") {
      const updated = await prisma.deliveryOrder.update({
        where: { id },
        data: { status: "PACKING" },
      });
      return NextResponse.json({ success: true, status: updated.status });
    }

    // STEP 3: VALIDATE & SHIP
    if (action === "VALIDATE") {
      const validated = await validateDelivery(id, user.id, user.name);
      return NextResponse.json({ success: true, delivery: validated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Update delivery error:", error);
    return NextResponse.json({ error: error.message || "Failed to update delivery" }, { status: 500 });
  }
}
