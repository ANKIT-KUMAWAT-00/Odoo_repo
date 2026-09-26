import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { validateReceipt } from "@/lib/inventory/inventory-service";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const receipt = await prisma.receipt.findUnique({
      where: { id },
      include: {
        warehouse: true,
        destinationLocation: true,
        items: {
          include: {
            product: {
              include: { stocks: true },
            },
          },
        },
      },
    });

    if (!receipt) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    return NextResponse.json({ receipt });
  } catch (error) {
    console.error("Receipt detail error:", error);
    return NextResponse.json({ error: "Failed to fetch receipt" }, { status: 500 });
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
    const { action, status, items } = body;

    // Validate receipt action
    if (action === "VALIDATE") {
      const validated = await validateReceipt(id, user.id, user.name);
      return NextResponse.json({ success: true, receipt: validated });
    }

    if (status) {
      const updated = await prisma.receipt.update({
        where: { id },
        data: { status },
      });
      return NextResponse.json({ success: true, receipt: updated });
    }

    return NextResponse.json({ error: "No valid action provided" }, { status: 400 });
  } catch (error: any) {
    console.error("Update receipt error:", error);
    return NextResponse.json({ error: error.message || "Failed to update receipt" }, { status: 500 });
  }
}
