import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser, isManager } from "@/lib/auth/session";

export async function GET() {
  try {
    const setting = await prisma.setting.upsert({
      where: { id: "global" },
      update: {},
      create: {
        id: "global",
        companyName: "StockSense Logistics Global Inc.",
        companyEmail: "ops@stocksense.io",
        currency: "USD ($)",
        timezone: "America/New_York",
        allowNegativeStock: false,
        automaticReorderAlerts: true,
        notifyLowStock: true,
        notifyDeliveries: true,
        notifyReceipts: true,
        notifyTransfers: true,
      },
    });

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ setting, users });
  } catch (error) {
    console.error("Fetch settings error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isManager(user)) {
      return NextResponse.json({ error: "Unauthorized. Manager access required." }, { status: 403 });
    }

    const body = await req.json();

    const updated = await prisma.setting.update({
      where: { id: "global" },
      data: {
        companyName: body.companyName,
        companyEmail: body.companyEmail,
        currency: body.currency,
        timezone: body.timezone,
        defaultWarehouseId: body.defaultWarehouseId || null,
        defaultLocationId: body.defaultLocationId || null,
        allowNegativeStock: body.allowNegativeStock,
        automaticReorderAlerts: body.automaticReorderAlerts,
        notifyLowStock: body.notifyLowStock,
        notifyDeliveries: body.notifyDeliveries,
        notifyReceipts: body.notifyReceipts,
        notifyTransfers: body.notifyTransfers,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: "UPDATE_SETTINGS",
        entity: "Setting",
        entityId: "global",
        newValue: "Updated system settings",
      },
    });

    return NextResponse.json({ success: true, setting: updated });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
