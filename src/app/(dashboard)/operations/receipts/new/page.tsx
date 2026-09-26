"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Save, CheckCircle2, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

interface LineItem {
  productId: string;
  sku: string;
  name: string;
  expectedQuantity: number;
  receivedQuantity: number;
  unit: string;
  batchLot?: string;
}

export default function NewReceiptPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedProductId = searchParams.get("productId");
  const preSelectedWarehouseId = searchParams.get("warehouseId");

  const toast = useToast();

  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string; code?: string; warehouseId: string }[]>([]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);

  // Form State
  const [supplier, setSupplier] = useState("");
  const [warehouseId, setWarehouseId] = useState(preSelectedWarehouseId || "");
  const [destinationLocationId, setDestinationLocationId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);

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
          setAvailableProducts(prodData.products || []);

          // If productId passed in query, auto-add line
          if (preSelectedProductId && prodData.products?.length > 0) {
            const match = prodData.products.find((p: any) => p.id === preSelectedProductId);
            if (match) {
              setItems([
                {
                  productId: match.id,
                  sku: match.sku,
                  name: match.name,
                  expectedQuantity: match.reorderQuantity || 50,
                  receivedQuantity: match.reorderQuantity || 50,
                  unit: match.uom || "units",
                  batchLot: "",
                },
              ]);
            }
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadMeta();
  }, [preSelectedProductId]);

  const filteredLocations = warehouseId
    ? locations.filter((l) => l.warehouseId === warehouseId)
    : locations;

  useEffect(() => {
    if (filteredLocations.length > 0 && !filteredLocations.some((l) => l.id === destinationLocationId)) {
      setDestinationLocationId(filteredLocations[0].id);
    }
  }, [warehouseId, filteredLocations, destinationLocationId]);

  const handleAddProduct = () => {
    if (availableProducts.length === 0) return;
    const first = availableProducts[0];
    setItems((prev) => [
      ...prev,
      {
        productId: first.id,
        sku: first.sku,
        name: first.name,
        expectedQuantity: 50,
        receivedQuantity: 50,
        unit: first.uom || "units",
        batchLot: "",
      },
    ]);
  };

  const handleProductChange = (index: number, newProductId: string) => {
    const selected = availableProducts.find((p) => p.id === newProductId);
    if (!selected) return;

    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        productId: selected.id,
        sku: selected.sku,
        name: selected.name,
        unit: selected.uom || "units",
      };
      return copy;
    });
  };

  const handleItemChange = (index: number, field: keyof LineItem, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (action: "DRAFT" | "CONFIRM" | "VALIDATE") => {
    setError("");
    if (!supplier.trim()) {
      setError("Please provide a Supplier/Vendor name");
      return;
    }
    if (!warehouseId || !destinationLocationId) {
      setError("Please select a target Warehouse and Destination Location");
      return;
    }
    if (items.length === 0) {
      setError("Please add at least one line item to receive");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/operations/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplier: supplier.trim(),
          warehouseId,
          destinationLocationId,
          expectedDate: expectedDate || null,
          notes: notes.trim(),
          items,
          action,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to process receipt");
        toast.error("Error", data.error);
      } else {
        if (action === "VALIDATE") {
          toast.success(
            "Receipt Validated!",
            `Stock increased immediately and recorded in ledger.`
          );
        } else if (action === "CONFIRM") {
          toast.success("Receipt Confirmed", "Status updated to Ready for receiving");
        } else {
          toast.success("Receipt Saved", "Saved as draft");
        }
        router.push(`/operations/receipts/${data.receipt.id}`);
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
          <Link href="/operations/receipts">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">New Inbound Receipt</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Record incoming goods, track vendor orders, and update shelf inventory
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleSave("DRAFT")}
            disabled={isLoading}
          >
            Save Draft
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleSave("CONFIRM")}
            disabled={isLoading}
          >
            Confirm Order
          </Button>
          <Button
            type="button"
            variant="success"
            size="sm"
            onClick={() => handleSave("VALIDATE")}
            isLoading={isLoading}
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Validate & Increase Stock
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
            <FileDown className="w-4 h-4 text-emerald-600" />
            <span>Receipt Information</span>
          </CardTitle>
          <CardDescription>Supplier details and target warehouse storage location</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Supplier / Vendor <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="e.g. Apex Steel & Alloys Ltd."
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Expected Delivery Date
              </label>
              <Input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Destination Warehouse <span className="text-rose-500">*</span>
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
                Target Rack / Location <span className="text-rose-500">*</span>
              </label>
              <select
                value={destinationLocationId}
                onChange={(e) => setDestinationLocationId(e.target.value)}
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
              Receiving Notes
            </label>
            <textarea
              placeholder="PO reference, carrier details, quality inspection instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-16 rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Product Rows Card */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Inbound Line Items</CardTitle>
            <CardDescription>Select products, expected quantities, and received counts</CardDescription>
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
                  <th className="py-2.5 px-3 w-28 text-right">Expected Qty</th>
                  <th className="py-2.5 px-3 w-28 text-right">Received Qty</th>
                  <th className="py-2.5 px-3 w-20 text-center">Unit</th>
                  <th className="py-2.5 px-3 w-32">Batch / Lot</th>
                  <th className="py-2.5 px-4 w-12 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No products added yet. Click &quot;Add Product&quot; to begin.
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 min-w-[200px]">
                        <select
                          value={item.productId}
                          onChange={(e) => handleProductChange(index, e.target.value)}
                          className="w-full h-8 rounded-lg border border-slate-200 px-2 text-xs font-semibold text-slate-800 bg-white"
                        >
                          {availableProducts.map((p) => (
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
                          value={item.expectedQuantity}
                          onChange={(e) =>
                            handleItemChange(index, "expectedQuantity", parseInt(e.target.value, 10) || 0)
                          }
                          className="h-8 text-xs text-right"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Input
                          type="number"
                          min="0"
                          value={item.receivedQuantity}
                          onChange={(e) =>
                            handleItemChange(index, "receivedQuantity", parseInt(e.target.value, 10) || 0)
                          }
                          className="h-8 text-xs text-right font-bold text-emerald-700"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-500 font-mono">{item.unit}</td>
                      <td className="py-2.5 px-3">
                        <Input
                          placeholder="e.g. LOT-A"
                          value={item.batchLot || ""}
                          onChange={(e) => handleItemChange(index, "batchLot", e.target.value)}
                          className="h-8 text-xs"
                        />
                      </td>
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
