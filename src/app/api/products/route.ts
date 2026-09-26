import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser, isManager } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const categoryId = searchParams.get("categoryId");
    const warehouseId = searchParams.get("warehouseId");
    const stockFilter = searchParams.get("stockFilter"); // IN_STOCK, LOW_STOCK, OUT_OF_STOCK
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { barcode: { contains: search } },
      ];
    }
    if (categoryId && categoryId !== "ALL") {
      where.categoryId = categoryId;
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        stocks: {
          include: { warehouse: true, location: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate aggregated inventory quantities for each product
    let formatted = products.map((p) => {
      let totalStock = 0;
      let totalReserved = 0;

      p.stocks.forEach((s) => {
        if (!warehouseId || warehouseId === "ALL" || s.warehouseId === warehouseId) {
          totalStock += s.quantity;
          totalReserved += s.reservedQuantity;
        }
      });

      const available = Math.max(0, totalStock - totalReserved);
      let status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" = "IN_STOCK";
      if (available === 0) {
        status = "OUT_OF_STOCK";
      } else if (available <= p.reorderLevel) {
        status = "LOW_STOCK";
      }

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category?.name || "Uncategorized",
        categoryId: p.categoryId,
        uom: p.uom,
        totalStock,
        available,
        reserved: totalReserved,
        reorderLevel: p.reorderLevel,
        reorderQuantity: p.reorderQuantity,
        status,
        productStatus: p.status,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        imageUrl: p.imageUrl,
        createdAt: p.createdAt,
      };
    });

    if (stockFilter && stockFilter !== "ALL") {
      formatted = formatted.filter((p) => p.status === stockFilter);
    }

    const total = formatted.length;
    const startIndex = (page - 1) * limit;
    const paginated = formatted.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      products: paginated,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Products fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isManager(user)) {
      return NextResponse.json({ error: "Unauthorized. Manager access required." }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      sku,
      categoryId,
      uom,
      description,
      initialStock,
      defaultWarehouseId,
      defaultLocationId,
      reorderLevel,
      reorderQuantity,
      minStock,
      maxStock,
      status,
      imageUrl,
      barcode,
      supplier,
      costPrice,
      sellingPrice,
    } = body;

    if (!name || !sku || !categoryId || !uom) {
      return NextResponse.json({ error: "Name, SKU, Category, and Unit of Measure are required" }, { status: 400 });
    }

    const cleanSku = sku.toUpperCase().trim();
    const existing = await prisma.product.findUnique({
      where: { sku: cleanSku },
    });
    if (existing) {
      return NextResponse.json({ error: `Product with SKU "${cleanSku}" already exists` }, { status: 409 });
    }

    const parsedInitialStock = Math.max(0, parseInt(initialStock || "0", 10));

    // Create product in transaction
    const product = await prisma.$transaction(async (tx) => {
      const newProd = await tx.product.create({
        data: {
          name: name.trim(),
          sku: cleanSku,
          categoryId,
          uom: uom.trim(),
          description: description?.trim() || null,
          defaultWarehouseId: defaultWarehouseId || null,
          defaultLocationId: defaultLocationId || null,
          reorderLevel: reorderLevel ? parseInt(reorderLevel, 10) : 20,
          reorderQuantity: reorderQuantity ? parseInt(reorderQuantity, 10) : 50,
          minStock: minStock ? parseInt(minStock, 10) : 10,
          maxStock: maxStock ? parseInt(maxStock, 10) : 500,
          status: status || "ACTIVE",
          imageUrl: imageUrl?.trim() || null,
          barcode: barcode?.trim() || null,
          supplier: supplier?.trim() || null,
          costPrice: costPrice ? parseFloat(costPrice) : 0,
          sellingPrice: sellingPrice ? parseFloat(sellingPrice) : 0,
        },
      });

      // If initial stock provided and default location assigned, set up initial stock record & movement
      if (parsedInitialStock > 0 && defaultWarehouseId && defaultLocationId) {
        await tx.stock.create({
          data: {
            productId: newProd.id,
            warehouseId: defaultWarehouseId,
            locationId: defaultLocationId,
            quantity: parsedInitialStock,
            reservedQuantity: 0,
          },
        });

        const wh = await tx.warehouse.findUnique({ where: { id: defaultWarehouseId } });
        const loc = await tx.location.findUnique({ where: { id: defaultLocationId } });

        await tx.stockMovement.create({
          data: {
            reference: `INIT-${newProd.sku}`,
            operationType: "RECEIPT",
            productId: newProd.id,
            sku: newProd.sku,
            productName: newProd.name,
            quantity: parsedInitialStock,
            destinationWarehouseName: wh?.name,
            destinationLocationName: loc?.name,
            warehouseId: defaultWarehouseId,
            locationId: defaultLocationId,
            userId: user.id,
            userName: user.name,
            status: "COMPLETED",
            notes: "Initial inventory setup on product creation",
          },
        });
      }

      // Automatically create a reorder rule for this product
      if (defaultWarehouseId) {
        await tx.reorderRule.create({
          data: {
            productId: newProd.id,
            warehouseId: defaultWarehouseId,
            locationId: defaultLocationId || null,
            minQuantity: newProd.minStock,
            reorderPoint: newProd.reorderLevel,
            maxQuantity: newProd.maxStock,
            reorderQuantity: newProd.reorderQuantity,
            preferredSupplier: newProd.supplier,
            status: "ACTIVE",
          },
        });
      }

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          action: "CREATE_PRODUCT",
          entity: "Product",
          entityId: newProd.id,
          newValue: `${newProd.name} (${newProd.sku})`,
        },
      });

      return newProd;
    });

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
