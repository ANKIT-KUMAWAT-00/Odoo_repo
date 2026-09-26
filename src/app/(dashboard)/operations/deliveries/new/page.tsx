"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Save, Truck, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

interface DeliveryLineItem {
  productId: string;
  sku: string;
  name: string;
  requestedQuantity: number;
  availableQuantity: number;
  unit: string;
}

export default function NewDeliveryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedProductId = searchParams.get("productId");
  const preSelectedWarehouseId = searchParams.get("warehouseId");

  const toast = useToast();

  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string; code?: string; warehouseId: string }[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);

  // Form State
  const [customer, setCustomer] = useState("");
  const [warehouseId, setWarehouseId] = useState(preSelectedWarehouseId || "");
  const [sourceLocationId, setSourceLocationId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<DeliveryLineItem[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMeta() {
      try {
        const [whRes, locRes, prodRes] = await Promise.all([
          fetch("/api/warehouses"),
          fetch("/api/locations"),
          fetch("/api/products?limit=100"),
        ]);
        if (whRes.ok) {
          const whData = await whRes.json();
          setWarehouses(whData.warehouses || []);
          if (!warehouseId && whData.warehouses?.length > 0) {
            setWarehouseId(whData.warehouses[0].id);
          }
        }
        if (locRes.ok) {
          const locData = await locRes.json();
          setLocations(locData.locations || []);
        }
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          setAllProducts(prodData.products || []);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadMeta();
  }, []);

  const filteredLocations = warehouseId
    ? locations.filter((l) => l.warehouseId === warehouseId)
    : locations;

  useEffect(() => {
    if (filteredLocations.length > 0 && !filteredLocations.some((l) => l.id === sourceLocationId)) {
      setSourceLocationId(filteredLocations[0].id);
    }
  }, [warehouseId, filteredLocations, sourceLocationId]);

  // Recalculate available quantities when sourceLocation changes
  useEffect(() => {
    if (!sourceLocationId || allProducts.length === 0) return;

    if (items.length === 0 && preSelectedProductId) {
      const match = allProducts.find((p) => p.id === preSelectedProductId);
      if (match) {
        setItems([
          {
            productId: match.id,
            sku: match.sku,
            name: match.name,
            requestedQuantity: 5,
            availableQuantity: match.available || 0,
            unit: match.uom || "units",
          },
        ]);
      }
    }
  }, [sourceLocationId, allProducts, preSelectedProductId, items.length]);

  const handleAddProduct = () => {
    if (allProducts.length === 0) return;
    const first = allProducts[0];
    setItems((prev) => [
      ...prev,
      {
        productId: first.id,
        sku: first.sku,
        name: first.name,
        requestedQuantity: 1,
        availableQuantity: first.available || 0,
        unit: first.uom || "units",
      },
    ]);
  };

  const handleProductChange = (index: number, newProductId: string) => {
    const selected = allProducts.find((p) => p.id === newProductId);
    if (!selected) return;

    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        productId: selected.id,
        sku: selected.sku,
        name: selected.name,
        availableQuantity: selected.available || 0,
        unit: selected.uom || "units",
      };
      return copy;
    });
  };

  const handleItemChange = (index: number, field: keyof DeliveryLineItem, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (action: "DRAFT" | "CONFIRM") => {
    setError("");

    if (!customer.trim()) {
      setError("Customer name is required");
      return;
    }
    if (!warehouseId || !sourceLocationId) {
      setError("Please select the Source Warehouse and Source Location");
      return;
    }
    if (items.length === 0) {
      setError("Please add at least one line item to ship");
      return;
    }

    // Check if any requested qty > available qty
    const invalidItem = items.find((i) => i.requestedQuantity > i.availableQuantity);
    if (invalidItem) {
      setError(
        `Requested quantity for "${invalidItem.name}" (${invalidItem.requestedQuantity}) exceeds available stock (${invalidItem.availableQuantity})`
      );
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/operations/deliveries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: customer.trim(),
          warehouseId,
          sourceLocationId,
          deliveryDate: deliveryDate || null,
          notes: notes.trim(),
          items,
          action,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create delivery order");
        toast.error("Error", data.error);
      } else {
        toast.success(
          "Delivery Order Created",
          `Order ${data.delivery.deliveryNumber} initialized for picking and packing.`
        );
        router.push(`/operations/deliveries/${data.delivery.id}`);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
        <div className="flex items-center space-x-3">
          <Link href="/operations/deliveries">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">New Outbound Delivery</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Create customer shipping order with live stock availability verification
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleSubmit("DRAFT")}
            disabled={isLoading}
          >
            Save Draft
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => handleSubmit("CONFIRM")}
            isLoading={isLoading}
          >
            <Truck className="w-4 h-4 mr-1.5" />
            Confirm for Picking
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
          {error}
        </div>
      )}

      {/* Main Details Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center space-x-2">
            <Truck className="w-4 h-4 text-blue-600" />
            <span>Customer & Dispatch Location</span>
          </CardTitle>
          <CardDescription>Recipient client and originating shelf rack</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Customer / Client <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="e.g. Acme Global Logistics Corp"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Target Shipping Date
              </label>
              <Input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Source Warehouse <span className="text-rose-500">*</span>
              </label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-300 px-3 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
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
                Source Location / Rack <span className="text-rose-500">*</span>
              </label>
              <select
                value={sourceLocationId}
                onChange={(e) => setSourceLocationId(e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-300 px-3 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              >
                {filteredLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} {loc.code ? `(${loc.code})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Shipping Notes / Instructions
            </label>
            <textarea
              placeholder="Packaging requirements, delivery dock gate, carrier bill of lading..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-16 rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Product Rows Card with Available Stock Validation */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Outbound Line Items</CardTitle>
            <CardDescription>Select products and verify available on-hand stock</CardDescription>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={handleAddProduct} className="text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Product
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Product</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3 w-32 text-right">Available Stock</th>
                  <th className="py-2.5 px-3 w-32 text-right">Requested Qty</th>
                  <th className="py-2.5 px-3 w-20 text-center">Unit</th>
                  <th className="py-2.5 px-4 w-12 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No items added to this delivery order yet. Click &quot;Add Product&quot;.
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => {
                    const isExceeded = item.requestedQuantity > item.availableQuantity;
                    return (
                      <tr key={index} className={`hover:bg-slate-50/50 ${isExceeded ? "bg-rose-50/40" : ""}`}>
                        <td className="py-2.5 px-4 min-w-[220px]">
                          <select
                            value={item.productId}
                            onChange={(e) => handleProductChange(index, e.target.value)}
                            className="w-full h-8 rounded-lg border border-slate-200 px-2 text-xs font-semibold text-slate-800 bg-white"
                          >
                            {allProducts.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.sku})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500 font-medium">{item.sku}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                          {item.availableQuantity} <span className="font-normal text-slate-500">{item.unit}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Input
                            type="number"
                            min="1"
                            max={item.availableQuantity}
                            value={item.requestedQuantity}
                            onChange={(e) =>
                              handleItemChange(index, "requestedQuantity", parseInt(e.target.value, 10) || 0)
                            }
                            className={`h-8 text-xs text-right font-bold ${
                              isExceeded ? "border-rose-500 text-rose-600 bg-rose-50" : ""
                            }`}
                          />
                          {isExceeded && (
                            <span className="text-[10px] text-rose-600 block mt-0.5 font-semibold">
                              Exceeds stock!
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-500 font-mono">{item.unit}</td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
