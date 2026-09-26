"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Package, DollarSign, Warehouse, Barcode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

export default function NewProductPage() {
  const router = useRouter();
  const toast = useToast();

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string; code?: string; warehouseId: string }[]>([]);

  // Form State
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [uom, setUom] = useState("units");
  const [description, setDescription] = useState("");
  const [initialStock, setInitialStock] = useState("0");
  const [defaultWarehouseId, setDefaultWarehouseId] = useState("");
  const [defaultLocationId, setDefaultLocationId] = useState("");
  const [reorderLevel, setReorderLevel] = useState("20");
  const [reorderQuantity, setReorderQuantity] = useState("50");
  const [minStock, setMinStock] = useState("10");
  const [maxStock, setMaxStock] = useState("500");
  const [costPrice, setCostPrice] = useState("0");
  const [sellingPrice, setSellingPrice] = useState("0");
  const [supplier, setSupplier] = useState("");
  const [barcode, setBarcode] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMeta() {
      try {
        const [catRes, whRes, locRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/warehouses"),
          fetch("/api/locations"),
        ]);
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData.categories || []);
          if (catData.categories?.length > 0) setCategoryId(catData.categories[0].id);
        }
        if (whRes.ok) {
          const whData = await whRes.json();
          setWarehouses(whData.warehouses || []);
          if (whData.warehouses?.length > 0) setDefaultWarehouseId(whData.warehouses[0].id);
        }
        if (locRes.ok) {
          const locData = await locRes.json();
          setLocations(locData.locations || []);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadMeta();
  }, []);

  const filteredLocations = defaultWarehouseId
    ? locations.filter((l) => l.warehouseId === defaultWarehouseId)
    : locations;

  // Auto-select first location when warehouse changes
  useEffect(() => {
    if (filteredLocations.length > 0 && !filteredLocations.some((l) => l.id === defaultLocationId)) {
      setDefaultLocationId(filteredLocations[0].id);
    }
  }, [defaultWarehouseId, filteredLocations, defaultLocationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Product Name is required");
      return;
    }
    if (!sku.trim()) {
      setError("SKU code is required");
      return;
    }
    if (!categoryId) {
      setError("Please select a Category");
      return;
    }
    if (!uom.trim()) {
      setError("Unit of Measure is required");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          sku: sku.trim().toUpperCase(),
          categoryId,
          uom: uom.trim(),
          description: description.trim(),
          initialStock: parseInt(initialStock, 10) || 0,
          defaultWarehouseId: defaultWarehouseId || null,
          defaultLocationId: defaultLocationId || null,
          reorderLevel: parseInt(reorderLevel, 10) || 20,
          reorderQuantity: parseInt(reorderQuantity, 10) || 50,
          minStock: parseInt(minStock, 10) || 10,
          maxStock: parseInt(maxStock, 10) || 500,
          costPrice: parseFloat(costPrice) || 0,
          sellingPrice: parseFloat(sellingPrice) || 0,
          supplier: supplier.trim(),
          barcode: barcode.trim(),
          imageUrl: imageUrl.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create product");
        toast.error("Creation Failed", data.error);
      } else {
        toast.success("Product Created", `${name} (${sku.toUpperCase()}) added to inventory`);
        router.push(`/products/${data.product.id}`);
      }
    } catch {
      setError("Network error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
        <div className="flex items-center space-x-3">
          <Link href="/products">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Add New Product</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Register a new material, assembly, or finished merchandise item
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Link href="/products">
            <Button variant="outline" size="sm">
              Cancel
            </Button>
          </Link>
          <Button onClick={handleSubmit} size="sm" isLoading={isLoading}>
            <Save className="w-4 h-4 mr-1.5" />
            Save Product
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Product Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center space-x-2">
              <Package className="w-4 h-4 text-brand-600" />
              <span>General Information</span>
            </CardTitle>
            <CardDescription>Primary identification, code, and grouping</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="e.g. Steel Rods 20mm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  SKU / Product Code <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="e.g. RAW-STL-001"
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-300 px-3 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Unit of Measure (UOM) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={uom}
                  onChange={(e) => setUom(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-300 px-3 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                >
                  <option value="units">units</option>
                  <option value="kg">kg</option>
                  <option value="pcs">pcs</option>
                  <option value="boxes">boxes</option>
                  <option value="meters">meters</option>
                  <option value="liters">liters</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Barcode / UPC
                </label>
                <Input
                  placeholder="e.g. 890123456781"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Description
              </label>
              <textarea
                placeholder="Product specifications, grade, manufacturer notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-20 rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Product Image URL
              </label>
              <Input
                placeholder="https://images.unsplash.com/..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Initial Stock & Default Storage Location */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center space-x-2">
              <Warehouse className="w-4 h-4 text-emerald-600" />
              <span>Initial Inventory & Default Storage</span>
            </CardTitle>
            <CardDescription>
              Assign the primary stocking facility and optional opening inventory count
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Initial Stock Quantity
                </label>
                <Input
                  type="number"
                  min="0"
                  value={initialStock}
                  onChange={(e) => setInitialStock(e.target.value)}
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Opening count at creation</span>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Default Warehouse
                </label>
                <select
                  value={defaultWarehouseId}
                  onChange={(e) => setDefaultWarehouseId(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-300 px-3 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Default Storage Rack / Bin
                </label>
                <select
                  value={defaultLocationId}
                  onChange={(e) => setDefaultLocationId(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-300 px-3 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {filteredLocations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} {loc.code ? `(${loc.code})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reordering Rules & Safety Levels */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center space-x-2">
              <Barcode className="w-4 h-4 text-amber-600" />
              <span>Reorder Rules & Thresholds</span>
            </CardTitle>
            <CardDescription>
              Safety stock points that trigger automatic dashboard and notification alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Reorder Level (Point)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={reorderLevel}
                  onChange={(e) => setReorderLevel(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Reorder Quantity
                </label>
                <Input
                  type="number"
                  min="1"
                  value={reorderQuantity}
                  onChange={(e) => setReorderQuantity(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Minimum Stock
                </label>
                <Input
                  type="number"
                  min="0"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Maximum Stock
                </label>
                <Input
                  type="number"
                  min="0"
                  value={maxStock}
                  onChange={(e) => setMaxStock(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Supplier */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <span>Valuation & Supplier</span>
            </CardTitle>
            <CardDescription>Financial pricing and procurement vendor information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Cost Price ($)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Selling Price ($)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Preferred Supplier
                </label>
                <Input
                  placeholder="e.g. Apex Industrial Supplies"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
