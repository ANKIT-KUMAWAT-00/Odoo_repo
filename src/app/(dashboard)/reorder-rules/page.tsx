"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Sliders, Search, Trash2, AlertTriangle, CheckCircle2, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useToast } from "@/components/ui/toast";
import { useUser } from "@/components/layout/UserContext";

interface ReorderRuleRow {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  warehouseName: string;
  locationName: string;
  minQuantity: number;
  reorderPoint: number;
  maxQuantity: number;
  reorderQuantity: number;
  preferredSupplier: string;
  currentAvailable: number;
  isTriggered: boolean;
  status: string;
}

export default function ReorderRulesPage() {
  const [rules, setRules] = useState<ReorderRuleRow[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // New Rule Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [minQty, setMinQty] = useState("10");
  const [reorderPoint, setReorderPoint] = useState("20");
  const [maxQty, setMaxQty] = useState("200");
  const [reorderQty, setReorderQty] = useState("50");
  const [supplier, setSupplier] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ReorderRuleRow | null>(null);

  const { isManager } = useUser();
  const toast = useToast();

  const fetchRules = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/reorder-rules");
      if (res.ok) {
        const data = await res.json();
        setRules(data.rules || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
    async function loadMeta() {
      try {
        const [prodRes, whRes] = await Promise.all([
          fetch("/api/products?limit=100"),
          fetch("/api/warehouses"),
        ]);
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          setProducts(prodData.products || []);
          if (prodData.products?.length > 0) setSelectedProductId(prodData.products[0].id);
        }
        if (whRes.ok) {
          const whData = await whRes.json();
          setWarehouses(whData.warehouses || []);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadMeta();
  }, []);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !reorderPoint) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/reorder-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProductId,
          warehouseId: selectedWarehouseId || null,
          minQuantity: parseInt(minQty, 10),
          reorderPoint: parseInt(reorderPoint, 10),
          maxQuantity: parseInt(maxQty, 10),
          reorderQuantity: parseInt(reorderQty, 10),
          preferredSupplier: supplier.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error("Error", data.error || "Failed to create rule");
      } else {
        toast.success("Rule Saved", "Automated stock replenishment rule active");
        setIsModalOpen(false);
        fetchRules();
      }
    } catch {
      toast.error("Error", "Network error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/reorder-rules?id=${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Deleted", "Reorder rule removed");
        setDeleteTarget(null);
        fetchRules();
      }
    } catch {
      toast.error("Error", "Failed to delete rule");
    }
  };

  const filtered = rules.filter(
    (r) =>
      r.productName.toLowerCase().includes(search.toLowerCase()) ||
      r.sku.toLowerCase().includes(search.toLowerCase()) ||
      r.warehouseName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reordering Rules</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure safety stock minimums, replenishment trigger points, and preferred vendors
          </p>
        </div>
        {isManager && (
          <Button onClick={() => setIsModalOpen(true)} className="h-9 text-xs">
            <Plus className="w-4 h-4 mr-1.5" />
            Add Reorder Rule
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <Input
            placeholder="Search rules by product, SKU, warehouse..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8 text-xs"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-900">{filtered.length}</span> active rules
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-3">SKU</th>
                  <th className="py-3 px-3">Warehouse Scope</th>
                  <th className="py-3 px-3 text-right">Min Stock</th>
                  <th className="py-3 px-3 text-right">Reorder Point</th>
                  <th className="py-3 px-3 text-right">Reorder Qty</th>
                  <th className="py-3 px-3 text-right">Current Available</th>
                  <th className="py-3 px-3 text-center">Rule State</th>
                  <th className="py-3 px-3">Preferred Vendor</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-28" /></td>
                      <td className="py-4 px-3"><div className="h-4 bg-slate-100 rounded w-16" /></td>
                      <td className="py-4 px-3"><div className="h-4 bg-slate-100 rounded w-24" /></td>
                      <td className="py-4 px-3 text-right"><div className="h-4 bg-slate-100 rounded w-8 ml-auto" /></td>
                      <td className="py-4 px-3 text-right"><div className="h-4 bg-slate-200 rounded w-8 ml-auto" /></td>
                      <td className="py-4 px-3 text-right"><div className="h-4 bg-slate-100 rounded w-8 ml-auto" /></td>
                      <td className="py-4 px-3 text-right"><div className="h-4 bg-slate-200 rounded w-8 ml-auto" /></td>
                      <td className="py-4 px-3 text-center"><div className="h-4 bg-slate-100 rounded w-16 mx-auto" /></td>
                      <td className="py-4 px-3"><div className="h-4 bg-slate-100 rounded w-24" /></td>
                      <td className="py-4 px-4 text-right"><div className="h-4 bg-slate-100 rounded w-12 ml-auto" /></td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      No reordering rules configured. Click &quot;Add Reorder Rule&quot; to define thresholds.
                    </td>
                  </tr>
                ) : (
                  filtered.map((rule) => (
                    <tr
                      key={rule.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        rule.isTriggered ? "bg-amber-50/30" : ""
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <Link href={`/products/${rule.productId}`} className="hover:text-brand-600 underline-offset-2 hover:underline">
                          {rule.productName}
                        </Link>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500 font-medium">{rule.sku}</td>
                      <td className="py-3 px-3 text-slate-700">{rule.warehouseName}</td>
                      <td className="py-3 px-3 text-right text-slate-500 font-medium">
                        {rule.minQuantity} {rule.unit}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {rule.reorderPoint} {rule.unit}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-brand-600">
                        +{rule.reorderQuantity} {rule.unit}
                      </td>
                      <td className="py-3 px-3 text-right font-bold">
                        <span className={rule.isTriggered ? "text-rose-600 font-bold" : "text-emerald-700"}>
                          {rule.currentAvailable} {rule.unit}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {rule.isTriggered ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" />
                            Triggered
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                            Optimal
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-600">{rule.preferredSupplier}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {rule.isTriggered && (
                            <Link href={`/operations/receipts/new?productId=${rule.productId}`}>
                              <Button size="sm" variant="outline" className="h-7 text-xs px-2 text-emerald-700 border-emerald-300">
                                <FileDown className="w-3 h-3 mr-1" /> Reorder
                              </Button>
                            </Link>
                          )}
                          {isManager && (
                            <button
                              onClick={() => setDeleteTarget(rule)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                              title="Delete rule"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* New Rule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Add Reorder Rule</h3>
            <p className="text-xs text-slate-500 mb-5">
              Set automated minimum safety buffers and purchase order reorder batches.
            </p>

            <form onSubmit={handleCreateRule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Select Product <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-300 px-3 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                  required
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Facility Scope (Optional)
                </label>
                <select
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-300 px-3 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                >
                  <option value="">All Warehouses (Global)</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Reorder Point <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={reorderPoint}
                    onChange={(e) => setReorderPoint(e.target.value)}
                    required
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">Triggers low-stock alert</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Reorder Batch Qty <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={reorderQty}
                    onChange={(e) => setReorderQty(e.target.value)}
                    required
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">Suggested purchase order</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Minimum Safety Stock
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={minQty}
                    onChange={(e) => setMinQty(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Maximum Capacity
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={maxQty}
                    onChange={(e) => setMaxQty(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Preferred Supplier
                </label>
                <Input
                  placeholder="e.g. Apex Fasteners Ltd"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" isLoading={isSubmitting}>
                  Create Rule
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Reorder Rule"
        description={`Remove replenishment rule for "${deleteTarget?.productName}"?`}
        confirmLabel="Delete Rule"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
