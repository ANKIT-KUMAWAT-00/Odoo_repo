import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser, isManager } from "@/lib/auth/session";

export async function GET() {
  try {
    const warehouses = await prisma.warehouse.findMany({
      include: {
        locations: true,
        stocks: {
          include: { product: true },
        },
        receipts: {
          where: { status: { in: ["WAITING", "READY", "IN_PROGRESS"] } },
        },
        deliveries: {
          where: { status: { in: ["WAITING", "READY", "PICKING", "PACKING"] } },
        },
      },
      orderBy: { name: "asc" },
    });

    const formatted = warehouses.map((wh) => {
      const locationCount = wh.locations.length;
      let totalStock = 0;
      const uniqueProductIds = new Set<string>();

      wh.stocks.forEach((s) => {
        totalStock += s.quantity;
        uniqueProductIds.add(s.productId);
      });

      return {
        id: wh.id,
        name: wh.name,
        code: wh.code,
        address: wh.address,
        manager: wh.manager,
        contact: wh.contact,
        status: wh.status,
        locationCount,
        productCount: uniqueProductIds.size,
        totalStock,
        pendingIncoming: wh.receipts.length,
        pendingOutgoing: wh.deliveries.length,
      };
    });

    return NextResponse.json({ warehouses: formatted });
  } catch (error) {
    console.error("Warehouses fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch warehouses" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isManager(user)) {
      return NextResponse.json({ error: "Unauthorized. Manager role required." }, { status: 403 });
    }

    const { name, code, address, manager, contact, status } = await req.json();

    if (!name || !code) {
      return NextResponse.json({ error: "Warehouse Name and Code are required" }, { status: 400 });
    }

    const cleanCode = code.toUpperCase().trim();
    const existing = await prisma.warehouse.findUnique({
      where: { code: cleanCode },
    });
    if (existing) {
      return NextResponse.json({ error: `Warehouse code "${cleanCode}" is already taken` }, { status: 409 });
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        name: name.trim(),
        code: cleanCode,
        address: address?.trim() || null,
        manager: manager?.trim() || null,
        contact: contact?.trim() || null,
        status: status || "ACTIVE",
      },
    });

    // Auto-create standard receiving and dispatch locations for convenience
    await prisma.location.createMany({
      data: [
        { name: "Rack A", code: "LOC-RA", warehouseId: warehouse.id, type: "STORAGE", capacity: 2000 },
        { name: "Receiving Area", code: "LOC-REC", warehouseId: warehouse.id, type: "RECEIVING", capacity: 5000 },
        { name: "Dispatch Area", code: "LOC-DISP", warehouseId: warehouse.id, type: "DISPATCH", capacity: 3000 },
      ],
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: "CREATE_WAREHOUSE",
        entity: "Warehouse",
        entityId: warehouse.id,
        newValue: `${warehouse.name} (${warehouse.code})`,
      },
    });

    return NextResponse.json({ success: true, warehouse });
  } catch (error) {
    console.error("Create warehouse error:", error);
    return NextResponse.json({ error: "Failed to create warehouse" }, { status: 500 });
  }
}
