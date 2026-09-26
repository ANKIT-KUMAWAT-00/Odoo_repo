"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, ArrowRightLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

interface TransferLineItem {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  availableQuantity: number;
  unit: string;
}

export default function NewTransferPage() {
  const router = useRouter();
  const toast = useToast();

  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string; code?: string; warehouseId: string }[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);

  // Form State
  const [sourceWarehouseId, setSourceWarehouseId] = useState("");
  const [sourceLocationId, setSourceLocationId] = useState("");
  const [destinationWarehouseId, setDestinationWarehouseId] = useState("");
  const [destinationLocationId, setDestinationLocationId] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<TransferLineItem[]>([]);

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
          if (whData.warehouses?.length > 0) {
            setSourceWarehouseId(whData.warehouses[0].id);
            setDestinationWarehouseId(whData.warehouses[1]?.id || whData.warehouses[0].id);
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

  const sourceLocations = sourceWarehouseId
    ? locations.filter((l) => l.warehouseId === sourceWarehouseId)
    : locations;

  const destLocations = destinationWarehouseId
    ? locations.filter((l) => l.warehouseId === destinationWarehouseId)
    : locations;

  useEffect(() => {
    if (sourceLocations.length > 0 && !sourceLocations.some((l) => l.id === sourceLocationId)) {
      setSourceLocationId(sourceLocations[0].id);
    }
  }, [sourceWarehouseId, sourceLocations, sourceLocationId]);

  useEffect(() => {
    if (destLocations.length > 0 && !destLocations.some((l) => l.id === destinationLocationId)) {
      setDestinationLocationId(destLocations[0].id);
    }
  }, [destinationWarehouseId, destLocations, destinationLocationId]);

  const handleAddProduct = () => {
    if (allProducts.length === 0) return;
    const first = allProducts[0];
    setItems((prev) => [
      ...prev,
      {
        productId: first.id,
        sku: first.sku,
        name: first.name,
        quantity: 10,
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

  const handleItemChange = (index: number, field: keyof TransferLineItem, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (action: "DRAFT" | "CONFIRM" | "VALIDATE") => {
    setError("");

    if (!sourceWarehouseId || !sourceLocationId) {
      setError("Please select the Source Warehouse and Location");
      return;
    }
    if (!destinationWarehouseId || !destinationLocationId) {
      setError("Please select the Destination Warehouse and Location");
      return;
    }
    if (sourceLocationId === destinationLocationId) {
      setError("Source location and destination location cannot be the same shelf");
      return;
    }
    if (items.length === 0) {
      setError("Please add at least one line item to transfer");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/operations/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceWarehouseId,
          sourceLocationId,
          destinationWarehouseId,
          destinationLocationId,
          scheduledDate: scheduledDate || null,
          notes: notes.trim(),
          items,
          action,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create transfer");
        toast.error("Error", data.error);
      } else {
        if (action === "VALIDATE") {
          toast.success(
            "Transfer Executed Successfully",
            "Relocated stock between locations. Company total stock unchanged."
          );
        } else {
          toast.success("Transfer Scheduled", `Transfer ${data.transfer.transferNumber} registered.`);
        }
        router.push(`/operations/transfers/${data.transfer.id}`);
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
          <Link href="/operations/transfers">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">New Internal Transfer</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Move inventory between facilities or racks without affecting company balance
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
            variant="secondary"
            size="sm"
            onClick={() => handleSubmit("CONFIRM")}
            disabled={isLoading}
          >
            Schedule Move
          </Button>
          <Button
            type="button"
            variant="success"
            size="sm"
            onClick={() => handleSubmit("VALIDATE")}
            isLoading={isLoading}
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Execute Immediately
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
          {error}
        </div>
      )}

      {/* Origin & Destination Locations Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Origin */}
        <Card className="border-l-4 border-l-slate-400">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-900">1. Originating Location (Source)</CardTitle>
            <CardDescription>Where goods are currently stored</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Source Warehouse <span className="text-rose-500">*</span>
              </label>
              <select
                value={sourceWarehouseId}
                onChange={(e) => setSourceWarehouseId(e.target.value)}
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
                Source Rack / Shelf <span className="text-rose-500">*</span>
              </label>
              <select
                value={sourceLocationId}
                onChange={(e) => setSourceLocationId(e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-300 px-3 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              >
                {sourceLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} {loc.code ? `(${loc.code})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Destination */}
        <Card className="border-l-4 border-l-brand-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-900">2. Destination Location (Target)</CardTitle>
            <CardDescription>Where goods will be relocated</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Destination Warehouse <span className="text-rose-500">*</span>
              </label>
              <select
                value={destinationWarehouseId}
                onChange={(e) => setDestinationWarehouseId(e.target.value)}
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
                Destination Rack / Shelf <span className="text-rose-500">*</span>
              </label>
              <select
                value={destinationLocationId}
                onChange={(e) => setDestinationLocationId(e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-300 px-3 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              >
                {destLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} {loc.code ? `(${loc.code})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Date & Notes Card */}
      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Scheduled Transfer Date
            </label>
            <Input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Internal Move Notes / Reason
            </label>
            <Input
              placeholder="e.g. Replenishing assembly line staging area"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Line Items Card */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Products to Relocate</CardTitle>
            <CardDescription>Specify the products and quantities to transfer</CardDescription>
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
                  <th className="py-2.5 px-3 w-32 text-right">Transfer Quantity</th>
                  <th className="py-2.5 px-3 w-20 text-center">Unit</th>
                  <th className="py-2.5 px-4 w-12 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No products added to transfer. Click &quot;Add Product&quot; to begin.
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50/50">
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
                      <td className="py-2.5 px-3 text-right">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(index, "quantity", parseInt(e.target.value, 10) || 0)
                          }
                          className="h-8 text-xs text-right font-bold text-slate-900"
                        />
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
