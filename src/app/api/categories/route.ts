import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser, isManager } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        products: {
          include: {
            stocks: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const formatted = categories.map((c) => {
      const productCount = c.products.length;
      let totalStock = 0;
      c.products.forEach((p) => {
        p.stocks.forEach((s) => {
          totalStock += s.quantity;
        });
      });

      return {
        id: c.id,
        name: c.name,
        description: c.description,
        status: c.status,
        productCount,
        totalStock,
        createdAt: c.createdAt,
      };
    });

    return NextResponse.json({ categories: formatted });
  } catch (error) {
    console.error("Categories fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isManager(user)) {
      return NextResponse.json({ error: "Unauthorized. Manager access required." }, { status: 403 });
    }

    const { name, description, status } = await req.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const existing = await prisma.category.findUnique({
      where: { name: name.trim() },
    });
    if (existing) {
      return NextResponse.json({ error: "A category with this name already exists" }, { status: 409 });
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        status: status || "ACTIVE",
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: "CREATE_CATEGORY",
        entity: "Category",
        entityId: category.id,
        newValue: category.name,
      },
    });

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
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
    if (!id) return NextResponse.json({ error: "Missing category ID" }, { status: 400 });

    const productsCount = await prisma.product.count({ where: { categoryId: id } });
    if (productsCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete category: ${productsCount} products are linked to this category.` },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: "DELETE_CATEGORY",
        entity: "Category",
        entityId: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete category error:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
