import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const operation = searchParams.get("operation");
    const warehouseId = searchParams.get("warehouseId");
    const locationId = searchParams.get("locationId");
    const format = searchParams.get("format");

    const where: any = {};
    if (operation && operation !== "ALL") {
      where.operationType = operation;
    }
    if (warehouseId && warehouseId !== "ALL") {
      where.warehouseId = warehouseId;
    }
    if (locationId && locationId !== "ALL") {
      where.locationId = locationId;
    }
    if (search) {
      where.OR = [
        { reference: { contains: search } },
        { productName: { contains: search } },
        { sku: { contains: search } },
        { userName: { contains: search } },
      ];
    }

    const movements = await prisma.stockMovement.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: 200,
    });

    // If CSV export requested
    if (format === "csv") {
      const headers = [
        "Timestamp",
        "Reference",
        "Operation Type",
        "Product Name",
        "SKU",
        "Quantity",
        "Source Warehouse",
        "Source Location",
        "Destination Warehouse",
        "Destination Location",
        "User",
        "Status",
        "Notes",
      ];

      const rows = movements.map((m) => [
        `"${m.timestamp.toISOString()}"`,
        `"${m.reference}"`,
        `"${m.operationType}"`,
        `"${m.productName.replace(/"/g, '""')}"`,
        `"${m.sku}"`,
        m.quantity,
        `"${m.sourceWarehouseName || ""}"`,
        `"${m.sourceLocationName || ""}"`,
        `"${m.destinationWarehouseName || ""}"`,
        `"${m.destinationLocationName || ""}"`,
        `"${m.userName || "System"}"`,
        `"${m.status}"`,
        `"${(m.notes || "").replace(/"/g, '""')}"`,
      ]);

      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="stocksense-ledger-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({ movements });
  } catch (error) {
    console.error("Ledger fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch stock ledger" }, { status: 500 });
  }
}
