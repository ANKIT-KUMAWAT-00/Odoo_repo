import prisma from "@/lib/db/prisma";

export interface StockSummary {
  productId: string;
  totalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  incomingQuantity: number;
  outgoingQuantity: number;
  status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  byLocation: {
    warehouseId: string;
    warehouseName: string;
    locationId: string;
    locationName: string;
    locationType: string;
    quantity: number;
    reservedQuantity: number;
    availableQuantity: number;
  }[];
}

export async function getNextDocumentNumber(type: "REC" | "DEL" | "TRF" | "ADJ"): Promise<string> {
  let count = 0;
  switch (type) {
    case "REC":
      count = await prisma.receipt.count();
      break;
    case "DEL":
      count = await prisma.deliveryOrder.count();
      break;
    case "TRF":
      count = await prisma.internalTransfer.count();
      break;
    case "ADJ":
      count = await prisma.inventoryAdjustment.count();
      break;
  }
  const nextNum = count + 1;
  return `${type}-${String(nextNum).padStart(5, "0")}`;
}

export async function getStock(productId: string): Promise<StockSummary> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      stocks: {
        include: {
          warehouse: true,
          location: true,
        },
      },
    },
  });

  if (!product) {
    throw new Error(`Product not found with id: ${productId}`);
  }

  // Calculate location sums
  let totalQuantity = 0;
  let reservedQuantity = 0;

  const byLocation = product.stocks.map((s) => {
    totalQuantity += s.quantity;
    reservedQuantity += s.reservedQuantity;
    return {
      warehouseId: s.warehouseId,
      warehouseName: s.warehouse.name,
      locationId: s.locationId,
      locationName: s.location.name,
      locationType: s.location.type,
      quantity: s.quantity,
      reservedQuantity: s.reservedQuantity,
      availableQuantity: Math.max(0, s.quantity - s.reservedQuantity),
    };
  });

  const availableQuantity = Math.max(0, totalQuantity - reservedQuantity);

  // Incoming stock (from pending receipts: WAITING, READY, IN_PROGRESS)
  const pendingReceiptItems = await prisma.receiptItem.findMany({
    where: {
      productId,
      receipt: {
        status: { in: ["WAITING", "READY", "IN_PROGRESS"] },
      },
    },
  });
  const incomingQuantity = pendingReceiptItems.reduce(
    (sum, item) => sum + (item.expectedQuantity - item.receivedQuantity),
    0
  );

  // Outgoing stock (from pending deliveries: WAITING, READY, PICKING, PACKING)
  const pendingDeliveryItems = await prisma.deliveryItem.findMany({
    where: {
      productId,
      delivery: {
        status: { in: ["WAITING", "READY", "PICKING", "PACKING"] },
      },
    },
  });
  const outgoingQuantity = pendingDeliveryItems.reduce(
    (sum, item) => sum + item.requestedQuantity,
    0
  );

  let status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" = "IN_STOCK";
  if (availableQuantity === 0) {
    status = "OUT_OF_STOCK";
  } else if (availableQuantity <= product.reorderLevel) {
    status = "LOW_STOCK";
  }

  return {
    productId,
    totalQuantity,
    reservedQuantity,
    availableQuantity,
    incomingQuantity,
    outgoingQuantity,
    status,
    byLocation,
  };
}

export async function getAvailableStock(productId: string, locationId: string): Promise<number> {
  const stock = await prisma.stock.findUnique({
    where: {
      productId_locationId: { productId, locationId },
    },
  });
  if (!stock) return 0;
  return Math.max(0, stock.quantity - stock.reservedQuantity);
}

export async function checkLowStockAlerts(productId: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        stocks: {
          include: { warehouse: true },
        },
      },
    });
    if (!product) return;

    const totalAvailable = product.stocks.reduce(
      (sum, s) => sum + Math.max(0, s.quantity - s.reservedQuantity),
      0
    );

    if (totalAvailable === 0) {
      await prisma.notification.create({
        data: {
          title: `Out of Stock: ${product.name}`,
          message: `Product ${product.name} (${product.sku}) has reached 0 available stock.`,
          type: "OUT_OF_STOCK",
          link: `/products/${product.id}`,
        },
      });
    } else if (totalAvailable <= product.reorderLevel) {
      await prisma.notification.create({
        data: {
          title: `Low Stock Alert: ${product.name}`,
          message: `Stock is low (${totalAvailable} ${product.uom} left, reorder level is ${product.reorderLevel}).`,
          type: "LOW_STOCK",
          link: `/products/${product.id}`,
        },
      });
    }
  } catch (err) {
    console.error("Failed to check low stock alert:", err);
  }
}

/**
 * RECEIPT VALIDATION:
 * Atomically:
 * 1. Validates not already done
 * 2. Increases stock at destination location
 * 3. Creates StockMovement (+qty)
 * 4. Updates Receipt to DONE
 * 5. Creates AuditLog
 */
export async function validateReceipt(receiptId: string, userId: string, userName: string) {
  return await prisma.$transaction(async (tx) => {
    const receipt = await tx.receipt.findUnique({
      where: { id: receiptId },
      include: {
        warehouse: true,
        destinationLocation: true,
        items: {
          include: { product: true },
        },
      },
    });

    if (!receipt) {
      throw new Error("Receipt not found");
    }

    if (receipt.status === "DONE") {
      throw new Error("Receipt has already been validated and processed");
    }

    if (receipt.status === "CANCELED") {
      throw new Error("Cannot validate a canceled receipt");
    }

    if (receipt.items.length === 0) {
      throw new Error("Cannot validate receipt with no line items");
    }

    for (const item of receipt.items) {
      const quantityToAdd = item.receivedQuantity > 0 ? item.receivedQuantity : item.expectedQuantity;

      // Update receivedQuantity on item if not already set
      if (item.receivedQuantity === 0) {
        await tx.receiptItem.update({
          where: { id: item.id },
          data: { receivedQuantity: quantityToAdd },
        });
      }

      // Upsert location stock
      const existingStock = await tx.stock.findUnique({
        where: {
          productId_locationId: {
            productId: item.productId,
            locationId: receipt.destinationLocationId,
          },
        },
      });

      if (existingStock) {
        await tx.stock.update({
          where: { id: existingStock.id },
          data: {
            quantity: { increment: quantityToAdd },
          },
        });
      } else {
        await tx.stock.create({
          data: {
            productId: item.productId,
            warehouseId: receipt.warehouseId,
            locationId: receipt.destinationLocationId,
            quantity: quantityToAdd,
            reservedQuantity: 0,
          },
        });
      }

      // Create Stock Ledger entry
      await tx.stockMovement.create({
        data: {
          reference: receipt.receiptNumber,
          operationType: "RECEIPT",
          productId: item.productId,
          sku: item.product.sku,
          productName: item.product.name,
          quantity: quantityToAdd,
          destinationWarehouseName: receipt.warehouse.name,
          destinationLocationName: receipt.destinationLocation.name,
          warehouseId: receipt.warehouseId,
          locationId: receipt.destinationLocationId,
          userId,
          userName,
          status: "COMPLETED",
          notes: receipt.notes || `Received ${quantityToAdd} ${item.unit} from ${receipt.supplier}`,
        },
      });
    }

    // Update receipt status
    const updatedReceipt = await tx.receipt.update({
      where: { id: receipt.id },
      data: {
        status: "DONE",
        validatedAt: new Date(),
      },
    });

    // Audit Log
    await tx.auditLog.create({
      data: {
        userId,
        userName,
        action: "VALIDATE_RECEIPT",
        entity: "Receipt",
        entityId: receipt.id,
        oldValue: receipt.status,
        newValue: `DONE (Received ${receipt.items.length} items)`,
      },
    });

    return updatedReceipt;
  });
}

/**
 * DELIVERY VALIDATION:
 * Atomically:
 * 1. Checks available stock >= requestedQuantity (unless allowNegativeStock)
 * 2. Decrements source location stock
 * 3. Creates StockMovement (-qty)
 * 4. Updates Delivery to DONE
 * 5. Creates AuditLog
 */
export async function validateDelivery(deliveryId: string, userId: string, userName: string) {
  return await prisma.$transaction(async (tx) => {
    const delivery = await tx.deliveryOrder.findUnique({
      where: { id: deliveryId },
      include: {
        warehouse: true,
        sourceLocation: true,
        items: {
          include: { product: true },
        },
      },
    });

    if (!delivery) {
      throw new Error("Delivery order not found");
    }

    if (delivery.status === "DONE") {
      throw new Error("Delivery order has already been validated and shipped");
    }

    if (delivery.status === "CANCELED") {
      throw new Error("Cannot validate a canceled delivery order");
    }

    if (delivery.items.length === 0) {
      throw new Error("Cannot validate delivery with no line items");
    }

    const setting = await tx.setting.findUnique({ where: { id: "global" } });
    const allowNegativeStock = setting?.allowNegativeStock ?? false;

    for (const item of delivery.items) {
      const quantityToDeliver = item.pickedQuantity > 0 ? item.pickedQuantity : item.requestedQuantity;

      const currentStock = await tx.stock.findUnique({
        where: {
          productId_locationId: {
            productId: item.productId,
            locationId: delivery.sourceLocationId,
          },
        },
      });

      const currentQty = currentStock?.quantity ?? 0;
      if (!allowNegativeStock && currentQty < quantityToDeliver) {
        throw new Error(
          `Insufficient stock for "${item.product.name}" (${item.product.sku}) in ${delivery.sourceLocation.name}. Available: ${currentQty}, Requested: ${quantityToDeliver}`
        );
      }

      if (currentStock) {
        await tx.stock.update({
          where: { id: currentStock.id },
          data: {
            quantity: { decrement: quantityToDeliver },
            reservedQuantity: Math.max(0, currentStock.reservedQuantity - quantityToDeliver),
          },
        });
      } else {
        await tx.stock.create({
          data: {
            productId: item.productId,
            warehouseId: delivery.warehouseId,
            locationId: delivery.sourceLocationId,
            quantity: -quantityToDeliver,
            reservedQuantity: 0,
          },
        });
      }

      // Update picked quantity on item if needed
      await tx.deliveryItem.update({
        where: { id: item.id },
        data: { pickedQuantity: quantityToDeliver },
      });

      // Create Stock Movement Ledger entry (- quantity)
      await tx.stockMovement.create({
        data: {
          reference: delivery.deliveryNumber,
          operationType: "DELIVERY",
          productId: item.productId,
          sku: item.product.sku,
          productName: item.product.name,
          quantity: -quantityToDeliver,
          sourceWarehouseName: delivery.warehouse.name,
          sourceLocationName: delivery.sourceLocation.name,
          warehouseId: delivery.warehouseId,
          locationId: delivery.sourceLocationId,
          userId,
          userName,
          status: "COMPLETED",
          notes: delivery.notes || `Delivered ${quantityToDeliver} ${item.unit} to ${delivery.customer}`,
        },
      });
    }

    // Update status to DONE
    const updatedDelivery = await tx.deliveryOrder.update({
      where: { id: delivery.id },
      data: {
        status: "DONE",
        validatedAt: new Date(),
      },
    });

    // Audit log
    await tx.auditLog.create({
      data: {
        userId,
        userName,
        action: "VALIDATE_DELIVERY",
        entity: "DeliveryOrder",
        entityId: delivery.id,
        oldValue: delivery.status,
        newValue: `DONE (Shipped to ${delivery.customer})`,
      },
    });

    return updatedDelivery;
  });
}

/**
 * INTERNAL TRANSFER VALIDATION:
 * Atomically:
 * 1. Checks source location stock >= transfer quantity
 * 2. Decrements source location stock
 * 3. Increments destination location stock
 * 4. Company total remains completely UNCHANGED!
 * 5. Creates StockMovement with both source & destination recorded
 * 6. Updates InternalTransfer to DONE
 * 7. Creates AuditLog
 */
export async function validateInternalTransfer(transferId: string, userId: string, userName: string) {
  return await prisma.$transaction(async (tx) => {
    const transfer = await tx.internalTransfer.findUnique({
      where: { id: transferId },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!transfer) {
      throw new Error("Internal transfer not found");
    }

    if (transfer.status === "DONE") {
      throw new Error("Transfer has already been validated and executed");
    }

    if (transfer.status === "CANCELED") {
      throw new Error("Cannot validate a canceled transfer");
    }

    if (transfer.items.length === 0) {
      throw new Error("Cannot validate transfer with no line items");
    }

    const sourceWarehouse = await tx.warehouse.findUnique({ where: { id: transfer.sourceWarehouseId } });
    const sourceLocation = await tx.location.findUnique({ where: { id: transfer.sourceLocationId } });
    const destWarehouse = await tx.warehouse.findUnique({ where: { id: transfer.destinationWarehouseId } });
    const destLocation = await tx.location.findUnique({ where: { id: transfer.destinationLocationId } });

    if (!sourceWarehouse || !sourceLocation || !destWarehouse || !destLocation) {
      throw new Error("Invalid source or destination warehouse/location configuration");
    }

    if (transfer.sourceLocationId === transfer.destinationLocationId) {
      throw new Error("Source location and destination location cannot be identical");
    }

    const setting = await tx.setting.findUnique({ where: { id: "global" } });
    const allowNegativeStock = setting?.allowNegativeStock ?? false;

    for (const item of transfer.items) {
      const sourceStock = await tx.stock.findUnique({
        where: {
          productId_locationId: {
            productId: item.productId,
            locationId: transfer.sourceLocationId,
          },
        },
      });

      const availableSource = (sourceStock?.quantity ?? 0) - (sourceStock?.reservedQuantity ?? 0);
      if (!allowNegativeStock && availableSource < item.quantity) {
        throw new Error(
          `Insufficient stock for "${item.product.name}" in source location (${sourceLocation.name}). Available: ${availableSource}, Required: ${item.quantity}`
        );
      }

      // Decrement source stock
      if (sourceStock) {
        await tx.stock.update({
          where: { id: sourceStock.id },
          data: { quantity: { decrement: item.quantity } },
        });
      }

      // Increment destination stock
      const destStock = await tx.stock.findUnique({
        where: {
          productId_locationId: {
            productId: item.productId,
            locationId: transfer.destinationLocationId,
          },
        },
      });

      if (destStock) {
        await tx.stock.update({
          where: { id: destStock.id },
          data: { quantity: { increment: item.quantity } },
        });
      } else {
        await tx.stock.create({
          data: {
            productId: item.productId,
            warehouseId: transfer.destinationWarehouseId,
            locationId: transfer.destinationLocationId,
            quantity: item.quantity,
            reservedQuantity: 0,
          },
        });
      }

      // Ledger Movement: records transfer from source to destination
      await tx.stockMovement.create({
        data: {
          reference: transfer.transferNumber,
          operationType: "TRANSFER",
          productId: item.productId,
          sku: item.product.sku,
          productName: item.product.name,
          quantity: item.quantity,
          sourceWarehouseName: sourceWarehouse.name,
          sourceLocationName: sourceLocation.name,
          destinationWarehouseName: destWarehouse.name,
          destinationLocationName: destLocation.name,
          warehouseId: destWarehouse.id,
          locationId: destLocation.id,
          userId,
          userName,
          status: "COMPLETED",
          notes: transfer.notes || `Transferred ${item.quantity} ${item.unit} from ${sourceLocation.name} to ${destLocation.name}`,
        },
      });
    }

    // Update transfer status
    const updatedTransfer = await tx.internalTransfer.update({
      where: { id: transfer.id },
      data: {
        status: "DONE",
        validatedAt: new Date(),
      },
    });

    // Audit log
    await tx.auditLog.create({
      data: {
        userId,
        userName,
        action: "VALIDATE_TRANSFER",
        entity: "InternalTransfer",
        entityId: transfer.id,
        oldValue: transfer.status,
        newValue: `DONE (${sourceLocation.name} -> ${destLocation.name})`,
      },
    });

    return updatedTransfer;
  });
}

/**
 * INVENTORY ADJUSTMENT:
 * Corrects differences between system stock and physical count.
 * Atomically:
 * 1. Sets stock at location = countedQuantity
 * 2. Creates InventoryAdjustment record
 * 3. Creates StockMovement with difference (+ or -)
 * 4. Creates AuditLog
 */
export async function adjustStock(params: {
  warehouseId: string;
  locationId: string;
  productId: string;
  countedQuantity: number;
  reason: "DAMAGED" | "LOST" | "FOUND" | "COUNTING_ERROR" | "EXPIRED" | "OTHER";
  notes?: string;
  userId: string;
  userName: string;
}) {
  return await prisma.$transaction(async (tx) => {
    const warehouse = await tx.warehouse.findUnique({ where: { id: params.warehouseId } });
    const location = await tx.location.findUnique({ where: { id: params.locationId } });
    const product = await tx.product.findUnique({ where: { id: params.productId } });

    if (!warehouse || !location || !product) {
      throw new Error("Invalid warehouse, location, or product");
    }

    const currentStock = await tx.stock.findUnique({
      where: {
        productId_locationId: {
          productId: params.productId,
          locationId: params.locationId,
        },
      },
    });

    const systemQuantity = currentStock?.quantity ?? 0;
    const difference = params.countedQuantity - systemQuantity;

    // Update or create stock
    if (currentStock) {
      await tx.stock.update({
        where: { id: currentStock.id },
        data: { quantity: params.countedQuantity },
      });
    } else {
      await tx.stock.create({
        data: {
          productId: params.productId,
          warehouseId: params.warehouseId,
          locationId: params.locationId,
          quantity: params.countedQuantity,
          reservedQuantity: 0,
        },
      });
    }

    // Sequential adjustment number
    const count = await tx.inventoryAdjustment.count();
    const adjustmentNumber = `ADJ-${String(count + 1).padStart(5, "0")}`;

    const adjustment = await tx.inventoryAdjustment.create({
      data: {
        adjustmentNumber,
        warehouseId: params.warehouseId,
        locationId: params.locationId,
        productId: params.productId,
        systemQuantity,
        countedQuantity: params.countedQuantity,
        difference,
        reason: params.reason,
        notes: params.notes,
        status: "DONE",
        userId: params.userId,
      },
    });

    // Stock Movement Ledger
    await tx.stockMovement.create({
      data: {
        reference: adjustmentNumber,
        operationType: "ADJUSTMENT",
        productId: product.id,
        sku: product.sku,
        productName: product.name,
        quantity: difference,
        sourceWarehouseName: difference < 0 ? warehouse.name : undefined,
        sourceLocationName: difference < 0 ? location.name : undefined,
        destinationWarehouseName: difference > 0 ? warehouse.name : undefined,
        destinationLocationName: difference > 0 ? location.name : undefined,
        warehouseId: warehouse.id,
        locationId: location.id,
        userId: params.userId,
        userName: params.userName,
        status: "COMPLETED",
        notes: `${params.reason}: ${params.notes || `Adjusted stock by ${difference >= 0 ? "+" : ""}${difference}`}`,
      },
    });

    // Audit log
    await tx.auditLog.create({
      data: {
        userId: params.userId,
        userName: params.userName,
        action: "INVENTORY_ADJUSTMENT",
        entity: "InventoryAdjustment",
        entityId: adjustment.id,
        oldValue: `System: ${systemQuantity}`,
        newValue: `Counted: ${params.countedQuantity} (Diff: ${difference})`,
      },
    });

    return adjustment;
  });
}
