import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const warehouseId = searchParams.get("warehouseId");
    const locationId = searchParams.get("locationId");
    const categoryId = searchParams.get("categoryId");
    const daysParam = parseInt(searchParams.get("days") || "30", 10);
    const docType = searchParams.get("docType");
    const statusFilter = searchParams.get("status");

    // Stock query where clause
    const stockWhere: any = {};
    if (warehouseId && warehouseId !== "ALL") {
      stockWhere.warehouseId = warehouseId;
    }
    if (locationId && locationId !== "ALL") {
      stockWhere.locationId = locationId;
    }
    if (categoryId && categoryId !== "ALL") {
      stockWhere.product = { categoryId };
    }

    // 1. Fetch Stocks
    const stocks = await prisma.stock.findMany({
      where: stockWhere,
      include: {
        product: {
          include: { category: true },
        },
        warehouse: true,
        location: true,
      },
    });

    // Compute total quantity and available quantity
    let totalStockQuantity = 0;
    stocks.forEach((s) => {
      totalStockQuantity += s.quantity;
    });

    // Active products count
    const productWhere: any = { status: "ACTIVE" };
    if (categoryId && categoryId !== "ALL") {
      productWhere.categoryId = categoryId;
    }
    const activeProductsCount = await prisma.product.count({ where: productWhere });

    // Compute Low Stock & Out of Stock products
    const allProducts = await prisma.product.findMany({
      where: categoryId && categoryId !== "ALL" ? { categoryId } : {},
      include: {
        stocks: {
          where: warehouseId && warehouseId !== "ALL" ? { warehouseId } : {},
          include: { warehouse: true },
        },
        category: true,
      },
    });

    let lowStockCount = 0;
    let outOfStockCount = 0;
    const lowStockProducts: any[] = [];

    for (const prod of allProducts) {
      const totalAvailable = prod.stocks.reduce(
        (sum, s) => sum + Math.max(0, s.quantity - s.reservedQuantity),
        0
      );
      const primaryWh = prod.stocks[0]?.warehouse?.name || "Multiple Warehouses";

      if (totalAvailable === 0) {
        outOfStockCount++;
        lowStockProducts.push({
          id: prod.id,
          name: prod.name,
          sku: prod.sku,
          warehouse: primaryWh,
          availableQuantity: 0,
          reorderLevel: prod.reorderLevel,
          unit: prod.uom,
          status: "OUT_OF_STOCK",
        });
      } else if (totalAvailable <= prod.reorderLevel) {
        lowStockCount++;
        lowStockProducts.push({
          id: prod.id,
          name: prod.name,
          sku: prod.sku,
          warehouse: primaryWh,
          availableQuantity: totalAvailable,
          reorderLevel: prod.reorderLevel,
          unit: prod.uom,
          status: "LOW_STOCK",
        });
      }
    }

    // 2. Pending Operations counts
    const receiptWhere: any = {
      status: { in: ["WAITING", "READY", "IN_PROGRESS", "DRAFT"] },
    };
    if (warehouseId && warehouseId !== "ALL") receiptWhere.warehouseId = warehouseId;
    const pendingReceiptsCount = await prisma.receipt.count({ where: receiptWhere });

    const deliveryWhere: any = {
      status: { in: ["WAITING", "READY", "PICKING", "PACKING", "DRAFT"] },
    };
    if (warehouseId && warehouseId !== "ALL") deliveryWhere.warehouseId = warehouseId;
    const pendingDeliveriesCount = await prisma.deliveryOrder.count({ where: deliveryWhere });

    const transferWhere: any = {
      status: { in: ["DRAFT", "READY", "IN_PROGRESS"] },
    };
    if (warehouseId && warehouseId !== "ALL") {
      transferWhere.OR = [
        { sourceWarehouseId: warehouseId },
        { destinationWarehouseId: warehouseId },
      ];
    }
    const activeTransfersCount = await prisma.internalTransfer.count({ where: transferWhere });

    // 3. Stock Movement Chart Data (7, 30, or 90 days)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysParam);

    const movements = await prisma.stockMovement.findMany({
      where: {
        timestamp: { gte: startDate },
        ...(warehouseId && warehouseId !== "ALL" ? { warehouseId } : {}),
      },
      orderBy: { timestamp: "asc" },
    });

    // Group by Day
    const dayMap = new Map<string, { date: string; incoming: number; outgoing: number; adjustments: number }>();
    for (let i = daysParam; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dayMap.set(key, { date: key, incoming: 0, outgoing: 0, adjustments: 0 });
    }

    movements.forEach((m) => {
      const key = new Date(m.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (dayMap.has(key)) {
        const item = dayMap.get(key)!;
        if (m.operationType === "RECEIPT") {
          item.incoming += Math.max(0, m.quantity);
        } else if (m.operationType === "DELIVERY") {
          item.outgoing += Math.abs(m.quantity);
        } else if (m.operationType === "ADJUSTMENT") {
          item.adjustments += Math.abs(m.quantity);
        }
      }
    });

    const stockMovementSeries = Array.from(dayMap.values());

    // 4. Inventory by Category
    const categoryMap = new Map<string, number>();
    stocks.forEach((s) => {
      const cat = s.product.category?.name || "Uncategorized";
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + s.quantity);
    });
    const categoryDistribution = Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));

    // 5. Warehouse Stock Distribution
    const warehouseMap = new Map<string, number>();
    stocks.forEach((s) => {
      const wh = s.warehouse?.name || "Unknown";
      warehouseMap.set(wh, (warehouseMap.get(wh) || 0) + s.quantity);
    });
    const warehouseDistribution = Array.from(warehouseMap.entries()).map(([name, quantity]) => ({
      name,
      quantity,
    }));

    // 6. Recent Operations (Unified list)
    const recentOps: any[] = [];

    if (!docType || docType === "ALL" || docType === "RECEIPTS") {
      const receipts = await prisma.receipt.findMany({
        where: {
          ...(warehouseId && warehouseId !== "ALL" ? { warehouseId } : {}),
          ...(statusFilter && statusFilter !== "ALL" ? { status: statusFilter } : {}),
        },
        include: { warehouse: true, destinationLocation: true },
        orderBy: { createdAt: "desc" },
        take: 6,
      });
      receipts.forEach((r) =>
        recentOps.push({
          id: r.id,
          reference: r.receiptNumber,
          type: "Receipt",
          date: r.createdAt,
          user: r.supplier,
          location: `${r.warehouse.name} / ${r.destinationLocation.name}`,
          status: r.status,
          link: `/operations/receipts/${r.id}`,
        })
      );
    }

    if (!docType || docType === "ALL" || docType === "DELIVERIES") {
      const deliveries = await prisma.deliveryOrder.findMany({
        where: {
          ...(warehouseId && warehouseId !== "ALL" ? { warehouseId } : {}),
          ...(statusFilter && statusFilter !== "ALL" ? { status: statusFilter } : {}),
        },
        include: { warehouse: true, sourceLocation: true },
        orderBy: { createdAt: "desc" },
        take: 6,
      });
      deliveries.forEach((d) =>
        recentOps.push({
          id: d.id,
          reference: d.deliveryNumber,
          type: "Delivery",
          date: d.createdAt,
          user: d.customer,
          location: `${d.warehouse.name} / ${d.sourceLocation.name}`,
          status: d.status,
          link: `/operations/deliveries/${d.id}`,
        })
      );
    }

    if (!docType || docType === "ALL" || docType === "TRANSFERS") {
      const transfers = await prisma.internalTransfer.findMany({
        where: {
          ...(statusFilter && statusFilter !== "ALL" ? { status: statusFilter } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 6,
      });
      for (const t of transfers) {
        const sw = await prisma.warehouse.findUnique({ where: { id: t.sourceWarehouseId } });
        const dw = await prisma.warehouse.findUnique({ where: { id: t.destinationWarehouseId } });
        recentOps.push({
          id: t.id,
          reference: t.transferNumber,
          type: "Transfer",
          date: t.createdAt,
          user: "Internal Move",
          location: `${sw?.name || "WH"} → ${dw?.name || "WH"}`,
          status: t.status,
          link: `/operations/transfers/${t.id}`,
        });
      }
    }

    if (!docType || docType === "ALL" || docType === "ADJUSTMENTS") {
      const adjustments = await prisma.inventoryAdjustment.findMany({
        where: {
          ...(warehouseId && warehouseId !== "ALL" ? { warehouseId } : {}),
        },
        include: { warehouse: true, location: true, product: true },
        orderBy: { createdAt: "desc" },
        take: 6,
      });
      adjustments.forEach((a) =>
        recentOps.push({
          id: a.id,
          reference: a.adjustmentNumber,
          type: "Adjustment",
          date: a.createdAt,
          user: `${a.reason} (${a.difference > 0 ? "+" : ""}${a.difference})`,
          location: `${a.warehouse.name} / ${a.location.name}`,
          status: a.status,
          link: `/operations/adjustments`,
        })
      );
    }

    recentOps.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const finalRecentOps = recentOps.slice(0, 8);

    return NextResponse.json({
      kpis: {
        totalStockQuantity,
        activeProductsCount,
        lowStockCount,
        outOfStockCount,
        pendingReceiptsCount,
        pendingDeliveriesCount,
        activeTransfersCount,
      },
      stockMovementSeries,
      categoryDistribution,
      warehouseDistribution,
      lowStockProducts: lowStockProducts.slice(0, 6),
      recentOperations: finalRecentOps,
    });
  } catch (error) {
    console.error("Dashboard metrics error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard metrics" }, { status: 500 });
  }
}
