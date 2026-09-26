import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { getNextDocumentNumber, validateDelivery } from "@/lib/inventory/inventory-service";

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
        { deliveryNumber: { contains: search } },
        { customer: { contains: search } },
      ];
    }

    const deliveries = await prisma.deliveryOrder.findMany({
      where,
      include: {
        warehouse: true,
        sourceLocation: true,
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = deliveries.map((d) => {
      const totalRequested = d.items.reduce((sum, item) => sum + item.requestedQuantity, 0);
      const totalPicked = d.items.reduce((sum, item) => sum + item.pickedQuantity, 0);
      return {
        id: d.id,
        deliveryNumber: d.deliveryNumber,
        customer: d.customer,
        warehouseName: d.warehouse.name,
        warehouseId: d.warehouseId,
        locationName: d.sourceLocation.name,
        deliveryDate: d.deliveryDate,
        status: d.status,
        itemCount: d.items.length,
        totalRequested,
        totalPicked,
        createdAt: d.createdAt,
        validatedAt: d.validatedAt,
      };
    });

    return NextResponse.json({ deliveries: formatted });
  } catch (error) {
    console.error("Fetch deliveries error:", error);
    return NextResponse.json({ error: "Failed to fetch deliveries" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { customer, warehouseId, sourceLocationId, deliveryDate, notes, items, action } = body;

    if (!customer || !warehouseId || !sourceLocationId) {
      return NextResponse.json({ error: "Customer, Warehouse, and Source Location are required" }, { status: 400 });
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "At least one product item is required" }, { status: 400 });
    }

    // Verify stock availability
    const setting = await prisma.setting.findUnique({ where: { id: "global" } });
    const allowNegativeStock = setting?.allowNegativeStock ?? false;

    if (!allowNegativeStock) {
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

        const available = (stock?.quantity ?? 0) - (stock?.reservedQuantity ?? 0);
        if (available < parseInt(item.requestedQuantity, 10)) {
          return NextResponse.json(
            {
              error: `Insufficient stock for "${stock?.product.name || "Item"}". Available in selected location: ${available}, Requested: ${item.requestedQuantity}`,
            },
            { status: 400 }
          );
        }
      }
    }

    const deliveryNumber = await getNextDocumentNumber("DEL");
    const initialStatus = action === "CONFIRM" ? "READY" : "DRAFT";

    const delivery = await prisma.$transaction(async (tx) => {
      const order = await tx.deliveryOrder.create({
        data: {
          deliveryNumber,
          customer: customer.trim(),
          warehouseId,
          sourceLocationId,
          deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
          notes: notes?.trim() || null,
          status: initialStatus,
          createdByUserId: user.id,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              requestedQuantity: parseInt(item.requestedQuantity, 10),
              pickedQuantity: 0,
              unit: item.unit || "units",
            })),
          },
        },
        include: { items: true },
      });

      // Reserve stock if confirmed
      if (action === "CONFIRM") {
        for (const item of items) {
          await tx.stock.updateMany({
            where: {
              productId: item.productId,
              locationId: sourceLocationId,
            },
            data: {
              reservedQuantity: { increment: parseInt(item.requestedQuantity, 10) },
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          action: "CREATE_DELIVERY",
          entity: "DeliveryOrder",
          entityId: order.id,
          newValue: `${order.deliveryNumber} to ${order.customer}`,
        },
      });

      return order;
    });

    return NextResponse.json({ success: true, delivery });
  } catch (error) {
    console.error("Create delivery error:", error);
    return NextResponse.json({ error: "Failed to create delivery order" }, { status: 500 });
  }
}
