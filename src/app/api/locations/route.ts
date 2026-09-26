import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser, isManager } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const warehouseId = searchParams.get("warehouseId");

    const where: any = {};
    if (warehouseId && warehouseId !== "ALL") {
      where.warehouseId = warehouseId;
    }

    const locations = await prisma.location.findMany({
      where,
      include: {
        warehouse: true,
        stocks: {
          include: { product: true },
        },
      },
      orderBy: [{ warehouse: { name: "asc" } }, { name: "asc" }],
    });

    const formatted = locations.map((loc) => {
      let totalStock = 0;
      let totalReserved = 0;
      const productCount = loc.stocks.length;

      loc.stocks.forEach((s) => {
        totalStock += s.quantity;
        totalReserved += s.reservedQuantity;
      });

      return {
        id: loc.id,
        name: loc.name,
        code: loc.code,
        warehouseId: loc.warehouseId,
        warehouseName: loc.warehouse.name,
        warehouseCode: loc.warehouse.code,
        type: loc.type,
        capacity: loc.capacity,
        status: loc.status,
        productCount,
        totalStock,
        totalReserved,
        availableStock: Math.max(0, totalStock - totalReserved),
        occupancyPercent: Math.min(100, Math.round((totalStock / (loc.capacity || 1000)) * 100)),
      };
    });

    return NextResponse.json({ locations: formatted });
  } catch (error) {
    console.error("Locations fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch locations" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isManager(user)) {
      return NextResponse.json({ error: "Unauthorized. Manager access required." }, { status: 403 });
    }

    const { name, code, warehouseId, type, capacity, status } = await req.json();

    if (!name || !code || !warehouseId) {
      return NextResponse.json({ error: "Name, Code, and Warehouse are required" }, { status: 400 });
    }

    const cleanCode = code.toUpperCase().trim();
    const existing = await prisma.location.findFirst({
      where: {
        warehouseId,
        code: cleanCode,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Location code "${cleanCode}" already exists in this warehouse` },
        { status: 409 }
      );
    }

    const location = await prisma.location.create({
      data: {
        name: name.trim(),
        code: cleanCode,
        warehouseId,
        type: type || "STORAGE",
        capacity: capacity ? parseInt(capacity, 10) : 1000,
        status: status || "ACTIVE",
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: "CREATE_LOCATION",
        entity: "Location",
        entityId: location.id,
        newValue: `${location.name} (${location.code})`,
      },
    });

    return NextResponse.json({ success: true, location });
  } catch (error) {
    console.error("Create location error:", error);
    return NextResponse.json({ error: "Failed to create location" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isManager(user)) {
      return NextResponse.json({ error: "Unauthorized. Manager access required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing location ID" }, { status: 400 });

    const stockSum = await prisma.stock.aggregate({
      where: { locationId: id },
      _sum: { quantity: true },
    });

    if ((stockSum._sum.quantity || 0) > 0) {
      return NextResponse.json(
        { error: `Cannot delete location: ${stockSum._sum.quantity} units are currently stored here. Move or adjust stock to 0 first.` },
        { status: 400 }
      );
    }

    await prisma.location.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: "DELETE_LOCATION",
        entity: "Location",
        entityId: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete location error:", error);
    return NextResponse.json({ error: "Failed to delete location" }, { status: 500 });
  }
}
