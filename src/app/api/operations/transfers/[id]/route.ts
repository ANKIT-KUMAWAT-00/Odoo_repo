import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { validateInternalTransfer } from "@/lib/inventory/inventory-service";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const transfer = await prisma.internalTransfer.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: { stocks: true },
            },
          },
        },
      },
    });

    if (!transfer) {
      return NextResponse.json({ error: "Transfer not found" }, { status: 404 });
    }

    const sourceWh = await prisma.warehouse.findUnique({ where: { id: transfer.sourceWarehouseId } });
    const sourceLoc = await prisma.location.findUnique({ where: { id: transfer.sourceLocationId } });
    const destWh = await prisma.warehouse.findUnique({ where: { id: transfer.destinationWarehouseId } });
    const destLoc = await prisma.location.findUnique({ where: { id: transfer.destinationLocationId } });

    return NextResponse.json({
      transfer: {
        ...transfer,
        sourceWarehouse: sourceWh,
        sourceLocation: sourceLoc,
        destinationWarehouse: destWh,
        destinationLocation: destLoc,
      },
    });
  } catch (error) {
    console.error("Transfer detail error:", error);
    return NextResponse.json({ error: "Failed to fetch transfer" }, { status: 500 });
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
    const { action } = body;

    if (action === "VALIDATE") {
      const validated = await validateInternalTransfer(id, user.id, user.name);
      return NextResponse.json({ success: true, transfer: validated });
    }

    if (body.status) {
      const updated = await prisma.internalTransfer.update({
        where: { id },
        data: { status: body.status },
      });
      return NextResponse.json({ success: true, transfer: updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Update transfer error:", error);
    return NextResponse.json({ error: error.message || "Failed to update transfer" }, { status: 500 });
  }
}
