import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const lower = query.toLowerCase();

    // 1. Search Products by name or sku
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { sku: { contains: query } },
          { barcode: { contains: query } },
        ],
      },
      take: 5,
      include: {
        stocks: true,
      },
    });

    // 2. Search Receipts by receiptNumber or supplier
    const receipts = await prisma.receipt.findMany({
      where: {
        OR: [
          { receiptNumber: { contains: query } },
          { supplier: { contains: query } },
        ],
      },
      take: 4,
      include: {
        warehouse: true,
      },
    });

    // 3. Search Deliveries by deliveryNumber or customer
    const deliveries = await prisma.deliveryOrder.findMany({
      where: {
        OR: [
          { deliveryNumber: { contains: query } },
          { customer: { contains: query } },
        ],
      },
      take: 4,
      include: {
        warehouse: true,
      },
    });

    // 4. Search Transfers by transferNumber
    const transfers = await prisma.internalTransfer.findMany({
      where: {
        transferNumber: { contains: query },
      },
      take: 4,
    });

    // 5. Search Adjustments by adjustmentNumber
    const adjustments = await prisma.inventoryAdjustment.findMany({
      where: {
        OR: [
          { adjustmentNumber: { contains: query } },
          { reason: { contains: query } },
        ],
      },
      take: 4,
      include: {
        product: true,
      },
    });

    const results = [
      ...products.map((p) => {
        const total = p.stocks.reduce((acc, s) => acc + s.quantity, 0);
        return {
          id: p.id,
          title: p.name,
          subtitle: `SKU: ${p.sku} • Stock: ${total} ${p.uom}`,
          type: "PRODUCT" as const,
          url: `/products/${p.id}`,
          badge: p.status,
        };
      }),
      ...receipts.map((r) => ({
        id: r.id,
        title: r.receiptNumber,
        subtitle: `Vendor: ${r.supplier} • Warehouse: ${r.warehouse.name}`,
        type: "RECEIPT" as const,
        url: `/operations/receipts/${r.id}`,
        badge: r.status,
      })),
      ...deliveries.map((d) => ({
        id: d.id,
        title: d.deliveryNumber,
        subtitle: `Customer: ${d.customer} • Warehouse: ${d.warehouse.name}`,
        type: "DELIVERY" as const,
        url: `/operations/deliveries/${d.id}`,
        badge: d.status,
      })),
      ...transfers.map((t) => ({
        id: t.id,
        title: t.transferNumber,
        subtitle: `Scheduled Internal Transfer`,
        type: "TRANSFER" as const,
        url: `/operations/transfers/${t.id}`,
        badge: t.status,
      })),
      ...adjustments.map((a) => ({
        id: a.id,
        title: a.adjustmentNumber,
        subtitle: `${a.product.name} • ${a.reason} (${a.difference > 0 ? "+" : ""}${a.difference})`,
        type: "ADJUSTMENT" as const,
        url: `/operations/adjustments`,
        badge: a.reason,
      })),
    ];

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Global search error:", error);
    return NextResponse.json({ error: "Failed to perform search" }, { status: 500 });
  }
}
