import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getStock } from "@/lib/inventory/inventory-service";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        reorderRules: {
          include: { warehouse: true, location: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Get aggregated stock summary from inventory service
    const stockSummary = await getStock(id);

    // Get move history for this product
    const movements = await prisma.stockMovement.findMany({
      where: { productId: id },
      orderBy: { timestamp: "desc" },
      take: 25,
    });

    return NextResponse.json({
      product: {
        ...product,
        stockSummary,
        movements,
      },
    });
  } catch (error) {
    console.error("Product detail error:", error);
    return NextResponse.json({ error: "Failed to fetch product details" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        categoryId: body.categoryId,
        uom: body.uom,
        reorderLevel: body.reorderLevel ? parseInt(body.reorderLevel, 10) : undefined,
        reorderQuantity: body.reorderQuantity ? parseInt(body.reorderQuantity, 10) : undefined,
        minStock: body.minStock ? parseInt(body.minStock, 10) : undefined,
        maxStock: body.maxStock ? parseInt(body.maxStock, 10) : undefined,
        costPrice: body.costPrice !== undefined ? parseFloat(body.costPrice) : undefined,
        sellingPrice: body.sellingPrice !== undefined ? parseFloat(body.sellingPrice) : undefined,
        supplier: body.supplier,
        imageUrl: body.imageUrl,
        barcode: body.barcode,
        status: body.status,
      },
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    console.error("Product update error:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}
