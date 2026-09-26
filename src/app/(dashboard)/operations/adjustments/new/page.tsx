"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  SlidersHorizontal,
  CheckCircle2,
  Building2,
  MapPin,
  Package,
  ArrowDown,
  ArrowUp,
  Equal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useToast } from "@/components/ui/toast";

export default function NewAdjustmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedProductId = searchParams.get("productId");

  const toast = useToast();

  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string; code?: string; warehouseId: string }[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Step fields
  const [warehouseId, setWarehouseId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [productId, setProductId] = useState(preSelectedProductId || "");
  const [systemQuantity, setSystemQuantity] = useState(0);
  const [countedQuantity, setCountedQuantity] = useState("0");
  const [reason, setReason] = useState<"DAMAGED" | "LOST" | "FOUND" | "COUNTING_ERROR" | "EXPIRED" | "OTHER">("DAMAGED");
  const [notes, setNotes] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
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
          if (whData.warehouses?.length > 0) setWarehouseId(whData.warehouses[0].id);
        }
        if (locRes.ok) {
          const locData = await locRes.json();
          setLocations(locData.locations || []);
        }
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          setProducts(prodData.products || []);
          if (!productId && prodData.products?.length > 0) {
            setProductId(prodData.products[0].id);
          }
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
    if (filteredLocations.length > 0 && !filteredLocations.some((l) => l.id === locationId)) {
      setLocationId(filteredLocations[0].id);
    }
  }, [warehouseId, filteredLocations, locationId]);

  // Fetch current system quantity at selected location
  useEffect(() => {
    async function fetchCurrentStock() {
      if (!productId || !locationId) return;
      try {
        const res = await fetch(`/api/products/${productId}`);
        if (res.ok) {
          const data = await res.json();
          const matchLoc = data.product?.stockSummary?.byLocation.find(
            (l: any) => l.locationId === locationId
          );
          const current = matchLoc ? matchLoc.quantity : 0;
          setSystemQuantity(current);
          setCountedQuantity(current.toString());
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchCurrentStock();
  }, [productId, locationId]);

  const parsedCounted = parseInt(countedQuantity, 10) || 0;
  const difference = parsedCounted - systemQuantity;

  const selectedProduct = products.find((p) => p.id === productId);
  const selectedWarehouse = warehouses.find((w) => w.id === warehouseId);
  const selectedLocation = locations.find((l) => l.id === locationId);

  const handleSubmit = async () => {
    setIsConfirmOpen(false);
    setError("");

    if (!warehouseId || !locationId || !productId) {
      setError("Please select warehouse, location, and product");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/operations/adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouseId,
          locationId,
          productId,
          countedQuantity: parsedCounted,
          reason,
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to adjust stock");
        toast.error("Error", data.error);
      } else {
        toast.success(
          "Stock Adjusted",
          `Adjusted ${selectedProduct?.name || "product"} to ${parsedCounted}. Ledger movement logged.`
        );
        router.push("/operations/adjustments");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
        <div className="flex items-center space-x-3">
          <Link href="/operations/adjustments">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">New Stock Adjustment</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Reconcile physical inventory counts against system records
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={() => setIsConfirmOpen(true)}
          isLoading={isLoading}
          size="sm"
        >
          <CheckCircle2 className="w-4 h-4 mr-1.5" />
          Confirm Adjustment
        </Button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
          {error}
        </div>
      )}

      {/* Workflow Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center space-x-2">
            <SlidersHorizontal className="w-4 h-4 text-amber-600" />
            <span>Cycle Count & Physical Discrepancy Correction</span>
          </CardTitle>
          <CardDescription>Follow the 8-step verification process to adjust on-hand quantities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* 1. Warehouse & Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Step 1: Select Warehouse <span className="text-rose-500">*</span>
              </label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-300 px-3 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
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
                Step 2: Select Shelf / Location <span className="text-rose-500">*</span>
              </label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-300 px-3 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              >
                {filteredLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} {loc.code ? `(${loc.code})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Product */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Step 3: Select Product to Count <span className="text-rose-500">*</span>
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full h-9 rounded-lg border border-slate-300 px-3 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          {/* 4, 5, 6: Counts Comparison Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            {/* Step 4: System Qty */}
            <div className="text-center sm:text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Step 4: System Stock
              </span>
              <div className="text-2xl font-bold text-slate-800 mt-1">
                {systemQuantity} <span className="text-xs text-slate-500 font-normal">{selectedProduct?.uom}</span>
              </div>
              <span className="text-[10px] text-slate-400">Current software balance</span>
            </div>

            {/* Step 5: Physical Count Input */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-700 block mb-1">
                Step 5: Physical Counted Qty <span className="text-rose-500">*</span>
              </label>
              <Input
                type="number"
                min="0"
                value={countedQuantity}
                onChange={(e) => setCountedQuantity(e.target.value)}
                className="h-10 text-center text-lg font-bold text-slate-900 border-brand-300 ring-brand-100"
              />
            </div>

            {/* Step 6: Calculated Difference */}
            <div className="text-center sm:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Step 6: Difference
              </span>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-base font-bold ${
                    difference < 0
                      ? "bg-rose-100 text-rose-700 border border-rose-200"
                      : difference > 0
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      : "bg-slate-200 text-slate-700 border border-slate-300"
                  }`}
                >
                  {difference < 0 ? (
                    <ArrowDown className="w-4 h-4 mr-1 text-rose-600" />
                  ) : difference > 0 ? (
                    <ArrowUp className="w-4 h-4 mr-1 text-emerald-600" />
                  ) : (
                    <Equal className="w-4 h-4 mr-1 text-slate-500" />
                  )}
                  {difference > 0 ? `+${difference}` : difference} {selectedProduct?.uom}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {difference < 0 ? "Inventory loss" : difference > 0 ? "Inventory gain" : "Exact match"}
              </span>
            </div>
          </div>

          {/* 7. Reason & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Step 7: Adjustment Reason <span className="text-rose-500">*</span>
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as any)}
                className="w-full h-9 rounded-lg border border-slate-300 px-3 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              >
                <option value="DAMAGED">Damaged stock</option>
                <option value="LOST">Lost / Missing items</option>
                <option value="FOUND">Found / Unlogged bundle</option>
                <option value="COUNTING_ERROR">Counting Error during intake</option>
                <option value="EXPIRED">Expired / Quality rejection</option>
                <option value="OTHER">Other / Audit reconciliation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Step 8: Audit Notes / Explanation
              </label>
              <Input
                placeholder="e.g. Broken casing during transit, write-off requested"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Confirm Inventory Adjustment"
        description={`Adjust physical stock for "${selectedProduct?.name}" in "${selectedWarehouse?.name} / ${selectedLocation?.name}" from ${systemQuantity} to ${parsedCounted} (Variance: ${difference > 0 ? "+" : ""}${difference} ${selectedProduct?.uom})? This will update the stock record and create an immutable stock ledger audit entry.`}
        confirmLabel="Confirm & Update Stock"
        variant={difference < 0 ? "warning" : "primary"}
        onConfirm={handleSubmit}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
}
