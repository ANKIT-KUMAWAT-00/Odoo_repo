const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding StockSense database...");

  // Clean previous data safely
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.inventoryAdjustment.deleteMany();
  await prisma.transferItem.deleteMany();
  await prisma.internalTransfer.deleteMany();
  await prisma.deliveryItem.deleteMany();
  await prisma.deliveryOrder.deleteMany();
  await prisma.receiptItem.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.reorderRule.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.product.deleteMany();
  await prisma.location.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.otpToken.deleteMany();

  // Settings
  await prisma.setting.create({
    data: {
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

  // Users
  const managerPassword = await bcrypt.hash("manager123", 10);
  const staffPassword = await bcrypt.hash("staff123", 10);
  const ankitPassword = await bcrypt.hash("password123", 10);

  const managerUser = await prisma.user.create({
    data: {
      name: "Sarah Connor",
      email: "manager@stocksense.com",
      password: managerPassword,
      role: "INVENTORY_MANAGER",
      phone: "+1 (555) 019-2834",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    },
  });

  const staffUser = await prisma.user.create({
    data: {
      name: "John Miller",
      email: "staff@stocksense.com",
      password: staffPassword,
      role: "WAREHOUSE_STAFF",
      phone: "+1 (555) 438-9201",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
  });

  const ankitUser = await prisma.user.create({
    data: {
      name: "Ankit Kumawat",
      email: "ankit@stocksense.com",
      password: ankitPassword,
      role: "INVENTORY_MANAGER",
      phone: "+1 (555) 765-4321",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  });

  // Categories
  const rawMatCat = await prisma.category.create({
    data: { name: "Raw Materials", description: "Industrial inputs, bars, sheets, and components" },
  });
  const electronicsCat = await prisma.category.create({
    data: { name: "Electronics", description: "Circuits, panels, sensors, and semiconductors" },
  });
  const furnitureCat = await prisma.category.create({
    data: { name: "Furniture", description: "Commercial & office seating, desks, and storage" },
  });
  const packagingCat = await prisma.category.create({
    data: { name: "Packaging", description: "Corrugated boxes, strapping, and protective wrap" },
  });
  const finishedGoodsCat = await prisma.category.create({
    data: { name: "Finished Goods", description: "Ready-to-ship consumer and commercial goods" },
  });

  // Warehouses
  const whMain = await prisma.warehouse.create({
    data: {
      name: "Main Warehouse",
      code: "WH-MAIN",
      address: "100 Logistics Blvd, Secaucus, NJ 07094",
      manager: "Robert Vance",
      contact: "+1 (555) 234-5678",
      status: "ACTIVE",
    },
  });

  const whProd = await prisma.warehouse.create({
    data: {
      name: "Production Warehouse",
      code: "WH-PROD",
      address: "250 Industrial Parkway, Newark, NJ 07102",
      manager: "Elena Rostova",
      contact: "+1 (555) 876-5432",
      status: "ACTIVE",
    },
  });

  const whFg = await prisma.warehouse.create({
    data: {
      name: "Finished Goods Warehouse",
      code: "WH-FG",
      address: "80 Distribution Way, Edison, NJ 08817",
      manager: "David Chen",
      contact: "+1 (555) 345-6789",
      status: "ACTIVE",
    },
  });

  // Update default warehouse in settings
  await prisma.setting.update({
    where: { id: "global" },
    data: { defaultWarehouseId: whMain.id },
  });

  // Locations
  const locMainRackA = await prisma.location.create({
    data: { name: "Rack A", code: "LOC-MA-RA", warehouseId: whMain.id, type: "STORAGE", capacity: 2500 },
  });
  const locMainRackB = await prisma.location.create({
    data: { name: "Rack B", code: "LOC-MA-RB", warehouseId: whMain.id, type: "STORAGE", capacity: 2500 },
  });
  const locMainRackC = await prisma.location.create({
    data: { name: "Rack C", code: "LOC-MA-RC", warehouseId: whMain.id, type: "STORAGE", capacity: 2000 },
  });
  const locMainReceiving = await prisma.location.create({
    data: { name: "Receiving Area", code: "LOC-MA-REC", warehouseId: whMain.id, type: "RECEIVING", capacity: 5000 },
  });
  const locMainDispatch = await prisma.location.create({
    data: { name: "Dispatch Area", code: "LOC-MA-DISP", warehouseId: whMain.id, type: "DISPATCH", capacity: 3000 },
  });
  const locMainDamaged = await prisma.location.create({
    data: { name: "Damaged Area", code: "LOC-MA-DAM", warehouseId: whMain.id, type: "DAMAGED", capacity: 500 },
  });

  const locProdFloor = await prisma.location.create({
    data: { name: "Production Floor", code: "LOC-PR-FLR", warehouseId: whProd.id, type: "PRODUCTION", capacity: 5000 },
  });
  const locProdRackA = await prisma.location.create({
    data: { name: "Rack A", code: "LOC-PR-RA", warehouseId: whProd.id, type: "STORAGE", capacity: 1500 },
  });
  const locProdRackB = await prisma.location.create({
    data: { name: "Rack B", code: "LOC-PR-RB", warehouseId: whProd.id, type: "STORAGE", capacity: 1500 },
  });

  const locFgRackA = await prisma.location.create({
    data: { name: "Rack A", code: "LOC-FG-RA", warehouseId: whFg.id, type: "STORAGE", capacity: 3000 },
  });
  const locFgDispatch = await prisma.location.create({
    data: { name: "Dispatch Area", code: "LOC-FG-DISP", warehouseId: whFg.id, type: "DISPATCH", capacity: 2000 },
  });

  // Products
  const prodSteel = await prisma.product.create({
    data: {
      name: "Steel Rods",
      sku: "RAW-STL-001",
      barcode: "890123456781",
      categoryId: rawMatCat.id,
      uom: "kg",
      description: "High-tensile structural steel rods for fabrication and construction",
      defaultWarehouseId: whMain.id,
      defaultLocationId: locMainRackA.id,
      reorderLevel: 50,
      reorderQuantity: 100,
      minStock: 20,
      maxStock: 500,
      status: "ACTIVE",
      supplier: "Apex Steel Ltd",
      costPrice: 42.5,
      sellingPrice: 65.0,
      imageUrl: "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=300&auto=format&fit=crop&q=80",
    },
  });

  const prodAluminum = await prisma.product.create({
    data: {
      name: "Aluminum Sheets",
      sku: "RAW-ALU-002",
      barcode: "890123456782",
      categoryId: rawMatCat.id,
      uom: "pcs",
      description: "Corrosion-resistant anodized 3mm aluminum alloy sheets",
      defaultWarehouseId: whMain.id,
      defaultLocationId: locMainRackA.id,
      reorderLevel: 30,
      reorderQuantity: 60,
      minStock: 15,
      maxStock: 300,
      status: "ACTIVE",
      supplier: "Vanguard Alloy Works",
      costPrice: 85.0,
      sellingPrice: 130.0,
      imageUrl: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=300&auto=format&fit=crop&q=80",
    },
  });

  const prodChair = await prisma.product.create({
    data: {
      name: "Office Chairs",
      sku: "FUR-CHR-001",
      barcode: "890123456783",
      categoryId: furnitureCat.id,
      uom: "units",
      description: "Ergonomic mesh executive office chairs with lumbar support",
      defaultWarehouseId: whFg.id,
      defaultLocationId: locFgRackA.id,
      reorderLevel: 20,
      reorderQuantity: 40,
      minStock: 10,
      maxStock: 150,
      status: "ACTIVE",
      supplier: "ComfortTech Seating",
      costPrice: 110.0,
      sellingPrice: 189.0,
      imageUrl: "https://images.unsplash.com/photo-1580481077195-c3a821a58875?w=300&auto=format&fit=crop&q=80",
    },
  });

  const prodTable = await prisma.product.create({
    data: {
      name: "Wooden Tables",
      sku: "FUR-TBL-002",
      barcode: "890123456784",
      categoryId: furnitureCat.id,
      uom: "units",
      description: "Solid oak boardroom and collaborative conference tables",
      defaultWarehouseId: whFg.id,
      defaultLocationId: locFgRackA.id,
      reorderLevel: 15,
      reorderQuantity: 25,
      minStock: 5,
      maxStock: 80,
      status: "ACTIVE",
      supplier: "Craftsman Timber Co.",
      costPrice: 280.0,
      sellingPrice: 499.0,
      imageUrl: "https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=300&auto=format&fit=crop&q=80",
    },
  });

  const prodBox = await prisma.product.create({
    data: {
      name: "Packaging Boxes",
      sku: "PKG-BOX-001",
      barcode: "890123456785",
      categoryId: packagingCat.id,
      uom: "boxes",
      description: "Heavy-duty double-wall corrugated shipping boxes (18x12x12)",
      defaultWarehouseId: whMain.id,
      defaultLocationId: locMainRackC.id,
      reorderLevel: 150,
      reorderQuantity: 300,
      minStock: 50,
      maxStock: 1000,
      status: "ACTIVE",
      supplier: "Apex Containers",
      costPrice: 2.1,
      sellingPrice: 4.5,
      imageUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=300&auto=format&fit=crop&q=80",
    },
  });

  const prodWire = await prisma.product.create({
    data: {
      name: "Copper Wire",
      sku: "RAW-CPR-003",
      barcode: "890123456786",
      categoryId: rawMatCat.id,
      uom: "meters",
      description: "99.9% pure electrolytic industrial copper spool wire",
      defaultWarehouseId: whProd.id,
      defaultLocationId: locProdRackA.id,
      reorderLevel: 80,
      reorderQuantity: 200,
      minStock: 30,
      maxStock: 800,
      status: "ACTIVE",
      supplier: "Electra Conductors",
      costPrice: 7.2,
      sellingPrice: 12.5,
      imageUrl: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=300&auto=format&fit=crop&q=80",
    },
  });

  const prodLed = await prisma.product.create({
    data: {
      name: "LED Panels",
      sku: "ELE-LED-001",
      barcode: "890123456787",
      categoryId: electronicsCat.id,
      uom: "pcs",
      description: "600x600 ultra-thin dimmable industrial LED ceiling panels",
      defaultWarehouseId: whMain.id,
      defaultLocationId: locMainRackB.id,
      reorderLevel: 25,
      reorderQuantity: 50,
      minStock: 10,
      maxStock: 200,
      status: "ACTIVE",
      supplier: "Lumina Components",
      costPrice: 34.0,
      sellingPrice: 58.0,
      imageUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=300&auto=format&fit=crop&q=80",
    },
  });

  const prodBolts = await prisma.product.create({
    data: {
      name: "Industrial Bolts",
      sku: "RAW-BLT-004",
      barcode: "890123456788",
      categoryId: rawMatCat.id,
      uom: "units",
      description: "Grade 8.8 zinc-plated hex head structural bolts (M12x50)",
      defaultWarehouseId: whMain.id,
      defaultLocationId: locMainRackC.id,
      reorderLevel: 200,
      reorderQuantity: 500,
      minStock: 100,
      maxStock: 2000,
      status: "ACTIVE",
      supplier: "Fastener Solutions Co.",
      costPrice: 0.45,
      sellingPrice: 1.1,
      imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80",
    },
  });

  // Initial Stocks (Location-Aware!)
  // Steel Rods: 120 in Main/Rack A, 60 in Main/Rack B, 40 in Prod/Floor = Total 220
  await prisma.stock.createMany({
    data: [
      { productId: prodSteel.id, warehouseId: whMain.id, locationId: locMainRackA.id, quantity: 120, reservedQuantity: 0 },
      { productId: prodSteel.id, warehouseId: whMain.id, locationId: locMainRackB.id, quantity: 60, reservedQuantity: 0 },
      { productId: prodSteel.id, warehouseId: whProd.id, locationId: locProdFloor.id, quantity: 40, reservedQuantity: 0 },
      // Aluminum Sheets: 85 in Main/Rack A, 30 in FG/Rack A = Total 115 (25 reserved for pending delivery)
      { productId: prodAluminum.id, warehouseId: whMain.id, locationId: locMainRackA.id, quantity: 85, reservedQuantity: 25 },
      { productId: prodAluminum.id, warehouseId: whFg.id, locationId: locFgRackA.id, quantity: 30, reservedQuantity: 0 },
      // Office Chairs: 45 in FG/Rack A
      { productId: prodChair.id, warehouseId: whFg.id, locationId: locFgRackA.id, quantity: 45, reservedQuantity: 0 },
      // Wooden Tables: 18 in FG/Rack A
      { productId: prodTable.id, warehouseId: whFg.id, locationId: locFgRackA.id, quantity: 18, reservedQuantity: 0 },
      // Packaging Boxes: 450 in Main/Rack C
      { productId: prodBox.id, warehouseId: whMain.id, locationId: locMainRackC.id, quantity: 450, reservedQuantity: 0 },
      // Copper Wire: 240 in Prod/Rack A
      { productId: prodWire.id, warehouseId: whProd.id, locationId: locProdRackA.id, quantity: 240, reservedQuantity: 0 },
      // LED Panels: 15 in Main/Rack B (Low Stock alert: 15 <= 25)
      { productId: prodLed.id, warehouseId: whMain.id, locationId: locMainRackB.id, quantity: 15, reservedQuantity: 0 },
      // Industrial Bolts: 0 in Main/Rack C (Out of Stock alert: 0)
      { productId: prodBolts.id, warehouseId: whMain.id, locationId: locMainRackC.id, quantity: 0, reservedQuantity: 0 },
    ],
  });

  // Reorder Rules
  await prisma.reorderRule.createMany({
    data: [
      {
        productId: prodSteel.id,
        warehouseId: whMain.id,
        locationId: locMainRackA.id,
        minQuantity: 20,
        reorderPoint: 50,
        maxQuantity: 300,
        reorderQuantity: 100,
        preferredSupplier: "Apex Steel Ltd",
        status: "ACTIVE",
      },
      {
        productId: prodLed.id,
        warehouseId: whMain.id,
        locationId: locMainRackB.id,
        minQuantity: 10,
        reorderPoint: 25,
        maxQuantity: 100,
        reorderQuantity: 50,
        preferredSupplier: "Lumina Components",
        status: "ACTIVE",
      },
      {
        productId: prodBolts.id,
        warehouseId: whMain.id,
        locationId: locMainRackC.id,
        minQuantity: 100,
        reorderPoint: 200,
        maxQuantity: 1000,
        reorderQuantity: 500,
        preferredSupplier: "Fastener Solutions Co.",
        status: "ACTIVE",
      },
      {
        productId: prodBox.id,
        warehouseId: whMain.id,
        locationId: locMainRackC.id,
        minQuantity: 50,
        reorderPoint: 150,
        maxQuantity: 800,
        reorderQuantity: 300,
        preferredSupplier: "Apex Containers",
        status: "ACTIVE",
      },
    ],
  });

  // Receipts
  const rec1 = await prisma.receipt.create({
    data: {
      receiptNumber: "REC-00001",
      supplier: "Apex Steel Ltd",
      warehouseId: whMain.id,
      destinationLocationId: locMainRackA.id,
      expectedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      notes: "Initial bulk procurement of high-tensile structural steel rods",
      status: "DONE",
      createdByUserId: managerUser.id,
      validatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          {
            productId: prodSteel.id,
            expectedQuantity: 100,
            receivedQuantity: 100,
            unit: "kg",
            batchLot: "LOT-STL-2026-A",
          },
        ],
      },
    },
  });

  const rec2 = await prisma.receipt.create({
    data: {
      receiptNumber: "REC-00002",
      supplier: "Lumina Components",
      warehouseId: whMain.id,
      destinationLocationId: locMainRackB.id,
      expectedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      notes: "Restock of LED commercial panels",
      status: "DONE",
      createdByUserId: managerUser.id,
      validatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          {
            productId: prodLed.id,
            expectedQuantity: 50,
            receivedQuantity: 50,
            unit: "pcs",
            batchLot: "LOT-LED-88",
          },
        ],
      },
    },
  });

  const rec3 = await prisma.receipt.create({
    data: {
      receiptNumber: "REC-00003",
      supplier: "Apex Containers",
      warehouseId: whMain.id,
      destinationLocationId: locMainReceiving.id,
      expectedDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      notes: "Quarterly packaging replenishment shipment",
      status: "READY",
      createdByUserId: managerUser.id,
      items: {
        create: [
          {
            productId: prodBox.id,
            expectedQuantity: 200,
            receivedQuantity: 0,
            unit: "boxes",
          },
        ],
      },
    },
  });

  const rec4 = await prisma.receipt.create({
    data: {
      receiptNumber: "REC-00004",
      supplier: "Electra Conductors",
      warehouseId: whProd.id,
      destinationLocationId: locProdRackA.id,
      expectedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      notes: "Copper spool delivery for production line B",
      status: "WAITING",
      createdByUserId: staffUser.id,
      items: {
        create: [
          {
            productId: prodWire.id,
            expectedQuantity: 150,
            receivedQuantity: 0,
            unit: "meters",
          },
        ],
      },
    },
  });

  // Delivery Orders
  const del1 = await prisma.deliveryOrder.create({
    data: {
      deliveryNumber: "DEL-00001",
      customer: "Acme Global Corp",
      warehouseId: whFg.id,
      sourceLocationId: locFgRackA.id,
      deliveryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      notes: "Headquarters executive floor remodeling order",
      status: "DONE",
      assignedToUserId: staffUser.id,
      createdByUserId: managerUser.id,
      validatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          {
            productId: prodChair.id,
            requestedQuantity: 15,
            pickedQuantity: 15,
            unit: "units",
          },
        ],
      },
    },
  });

  const del2 = await prisma.deliveryOrder.create({
    data: {
      deliveryNumber: "DEL-00002",
      customer: "Pacific Builders LLC",
      warehouseId: whMain.id,
      sourceLocationId: locMainRackA.id,
      deliveryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      notes: "Architectural facade project materials",
      status: "PACKING",
      assignedToUserId: staffUser.id,
      createdByUserId: managerUser.id,
      items: {
        create: [
          {
            productId: prodAluminum.id,
            requestedQuantity: 25,
            pickedQuantity: 25,
            unit: "pcs",
          },
        ],
      },
    },
  });

  const del3 = await prisma.deliveryOrder.create({
    data: {
      deliveryNumber: "DEL-00003",
      customer: "Apex Heavy Fabrication",
      warehouseId: whMain.id,
      sourceLocationId: locMainRackC.id,
      deliveryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      notes: "Contract assembly hardware delivery",
      status: "WAITING",
      assignedToUserId: staffUser.id,
      createdByUserId: managerUser.id,
      items: {
        create: [
          {
            productId: prodBolts.id,
            requestedQuantity: 100,
            pickedQuantity: 0,
            unit: "units",
          },
        ],
      },
    },
  });

  // Internal Transfers
  const trf1 = await prisma.internalTransfer.create({
    data: {
      transferNumber: "TRF-00001",
      sourceWarehouseId: whMain.id,
      sourceLocationId: locMainRackA.id,
      destinationWarehouseId: whProd.id,
      destinationLocationId: locProdFloor.id,
      scheduledDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      assignedUserId: staffUser.id,
      status: "DONE",
      notes: "Stock transfer of steel rods to active production floor",
      validatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          {
            productId: prodSteel.id,
            quantity: 30,
            unit: "kg",
          },
        ],
      },
    },
  });

  const trf2 = await prisma.internalTransfer.create({
    data: {
      transferNumber: "TRF-00002",
      sourceWarehouseId: whMain.id,
      sourceLocationId: locMainRackA.id,
      destinationWarehouseId: whFg.id,
      destinationLocationId: locFgRackA.id,
      scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      assignedUserId: staffUser.id,
      status: "IN_PROGRESS",
      notes: "Pre-staging sheets for finished goods packaging",
      items: {
        create: [
          {
            productId: prodAluminum.id,
            quantity: 20,
            unit: "pcs",
          },
        ],
      },
    },
  });

  // Adjustments
  const adj1 = await prisma.inventoryAdjustment.create({
    data: {
      adjustmentNumber: "ADJ-00001",
      warehouseId: whMain.id,
      locationId: locMainRackA.id,
      productId: prodSteel.id,
      systemQuantity: 123,
      countedQuantity: 120,
      difference: -3,
      reason: "DAMAGED",
      notes: "Slight bending on 3 rods during forklift transit; written off to scrap",
      status: "DONE",
      userId: staffUser.id,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  const adj2 = await prisma.inventoryAdjustment.create({
    data: {
      adjustmentNumber: "ADJ-00002",
      warehouseId: whMain.id,
      locationId: locMainRackC.id,
      productId: prodBox.id,
      systemQuantity: 440,
      countedQuantity: 450,
      difference: 10,
      reason: "FOUND",
      notes: "Additional unlogged sealed bundle identified during physical cycle count",
      status: "DONE",
      userId: managerUser.id,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  // Stock Ledger Movements
  await prisma.stockMovement.createMany({
    data: [
      {
        reference: "REC-00001",
        operationType: "RECEIPT",
        productId: prodSteel.id,
        sku: prodSteel.sku,
        productName: prodSteel.name,
        quantity: 100,
        destinationWarehouseName: "Main Warehouse",
        destinationLocationName: "Rack A",
        warehouseId: whMain.id,
        locationId: locMainRackA.id,
        userName: managerUser.name,
        userId: managerUser.id,
        status: "COMPLETED",
        notes: "Goods receipt confirmed from Apex Steel Ltd",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        reference: "REC-00002",
        operationType: "RECEIPT",
        productId: prodLed.id,
        sku: prodLed.sku,
        productName: prodLed.name,
        quantity: 50,
        destinationWarehouseName: "Main Warehouse",
        destinationLocationName: "Rack B",
        warehouseId: whMain.id,
        locationId: locMainRackB.id,
        userName: managerUser.name,
        userId: managerUser.id,
        status: "COMPLETED",
        notes: "Goods receipt confirmed from Lumina Components",
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
      {
        reference: "DEL-00001",
        operationType: "DELIVERY",
        productId: prodChair.id,
        sku: prodChair.sku,
        productName: prodChair.name,
        quantity: -15,
        sourceWarehouseName: "Finished Goods Warehouse",
        sourceLocationName: "Rack A",
        warehouseId: whFg.id,
        locationId: locFgRackA.id,
        userName: staffUser.name,
        userId: staffUser.id,
        status: "COMPLETED",
        notes: "Dispatched to Acme Global Corp",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        reference: "TRF-00001",
        operationType: "TRANSFER",
        productId: prodSteel.id,
        sku: prodSteel.sku,
        productName: prodSteel.name,
        quantity: 30,
        sourceWarehouseName: "Main Warehouse",
        sourceLocationName: "Rack A",
        destinationWarehouseName: "Production Warehouse",
        destinationLocationName: "Production Floor",
        warehouseId: whProd.id,
        locationId: locProdFloor.id,
        userName: staffUser.name,
        userId: staffUser.id,
        status: "COMPLETED",
        notes: "Moved 30 kg from Main/Rack A to Production/Floor",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        reference: "ADJ-00001",
        operationType: "ADJUSTMENT",
        productId: prodSteel.id,
        sku: prodSteel.sku,
        productName: prodSteel.name,
        quantity: -3,
        sourceWarehouseName: "Main Warehouse",
        sourceLocationName: "Rack A",
        warehouseId: whMain.id,
        locationId: locMainRackA.id,
        userName: staffUser.name,
        userId: staffUser.id,
        status: "COMPLETED",
        notes: "DAMAGED: Slight bending on 3 rods during forklift transit",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        reference: "ADJ-00002",
        operationType: "ADJUSTMENT",
        productId: prodBox.id,
        sku: prodBox.sku,
        productName: prodBox.name,
        quantity: 10,
        destinationWarehouseName: "Main Warehouse",
        destinationLocationName: "Rack C",
        warehouseId: whMain.id,
        locationId: locMainRackC.id,
        userName: managerUser.name,
        userId: managerUser.id,
        status: "COMPLETED",
        notes: "FOUND: Additional unlogged sealed bundle identified during physical cycle count",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // Notifications
  await prisma.notification.createMany({
    data: [
      {
        title: "Low Stock Alert: LED Panels",
        message: "Current available quantity (15 pcs) is at or below reorder level (25 pcs) in Main Warehouse.",
        type: "LOW_STOCK",
        link: `/products/${prodLed.id}`,
        isRead: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        title: "Out of Stock Alert: Industrial Bolts",
        message: "Available quantity is 0 units in Main Warehouse. Reorder immediately.",
        type: "OUT_OF_STOCK",
        link: `/products/${prodBolts.id}`,
        isRead: false,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      },
      {
        title: "Receipt Ready for Validation",
        message: "Receipt REC-00003 from Apex Containers has arrived and is ready for shelving inspection.",
        type: "PENDING_RECEIPT",
        link: `/operations/receipts/${rec3.id}`,
        isRead: false,
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
      {
        title: "Delivery Order in Packing",
        message: "Delivery DEL-00002 for Pacific Builders LLC is currently in packing stage.",
        type: "PENDING_DELIVERY",
        link: `/operations/deliveries/${del2.id}`,
        isRead: true,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      },
    ],
  });

  // Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userName: managerUser.name,
        userId: managerUser.id,
        action: "VALIDATE_RECEIPT",
        entity: "Receipt",
        entityId: rec1.id,
        oldValue: "READY",
        newValue: "DONE (Stock +100 Steel Rods)",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        userName: staffUser.name,
        userId: staffUser.id,
        action: "VALIDATE_DELIVERY",
        entity: "DeliveryOrder",
        entityId: del1.id,
        oldValue: "PACKING",
        newValue: "DONE (Stock -15 Office Chairs)",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        userName: staffUser.name,
        userId: staffUser.id,
        action: "VALIDATE_TRANSFER",
        entity: "InternalTransfer",
        entityId: trf1.id,
        oldValue: "IN_PROGRESS",
        newValue: "DONE (Transferred 30 kg Steel Rods)",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        userName: staffUser.name,
        userId: staffUser.id,
        action: "INVENTORY_ADJUSTMENT",
        entity: "InventoryAdjustment",
        entityId: adj1.id,
        oldValue: "System: 123",
        newValue: "Counted: 120 (Diff: -3 DAMAGED)",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  console.log("✅ StockSense database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
