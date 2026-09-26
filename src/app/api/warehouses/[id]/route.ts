import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        locations: {
          include: {
            stocks: {
              include: { product: true },
            },
          },
        },
        stocks: {
          include: {
            product: {
              include: { category: true },
            },
            location: true,
          },
        },
        receipts: {
          where: { status: { in: ["WAITING", "READY", "IN_PROGRESS", "DONE"] } },
          include: { items: true },
          take: 10,
          orderBy: { createdAt: "desc" },
        },
        deliveries: {
          where: { status: { in: ["WAITING", "READY", "PICKING", "PACKING", "DONE"] } },
          include: { items: true },
          take: 10,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!warehouse) {
      return NextResponse.json({ error: "Warehouse not found" }, { status: 404 });
    }

    // Transfers involving this warehouse
    const transfers = await prisma.internalTransfer.findMany({
      where: {
        OR: [{ sourceWarehouseId: id }, { destinationWarehouseId: id }],
      },
      include: { items: { include: { product: true } } },
      take: 10,
      orderBy: { createdAt: "desc" },
    });

    let totalStock = 0;
    const uniqueProducts = new Map<string, any>();

    warehouse.stocks.forEach((s) => {
      totalStock += s.quantity;
      if (!uniqueProducts.has(s.productId)) {
        uniqueProducts.set(s.productId, {
          id: s.product.id,
          name: s.product.name,
          sku: s.product.sku,
          category: s.product.category?.name,
          quantity: 0,
          uom: s.product.uom,
        });
      }
      uniqueProducts.get(s.productId).quantity += s.quantity;
    });

    const locationsFormatted = warehouse.locations.map((loc) => {
      let locStock = 0;
      loc.stocks.forEach((s) => (locStock += s.quantity));
      return {
        id: loc.id,
        name: loc.name,
        code: loc.code,
        type: loc.type,
        capacity: loc.capacity,
        status: loc.status,
        currentStock: locStock,
        occupancyPercent: Math.min(100, Math.round((locStock / loc.capacity) * 100)),
      };
    });

    return NextResponse.json({
      warehouse: {
        id: warehouse.id,
        name: warehouse.name,
        code: warehouse.code,
        address: warehouse.address,
        manager: warehouse.manager,
        contact: warehouse.contact,
        status: warehouse.status,
        totalStock,
        totalProducts: uniqueProducts.size,
        locations: locationsFormatted,
        products: Array.from(uniqueProducts.values()),
        receipts: warehouse.receipts,
        deliveries: warehouse.deliveries,
        transfers,
      },
    });
  } catch (error) {
    console.error("Warehouse detail fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch warehouse details" }, { status: 500 });
  }
}
