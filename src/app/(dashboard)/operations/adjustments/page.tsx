"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, SlidersHorizontal, ArrowDown, ArrowUp, Equal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useWarehouse } from "@/components/layout/WarehouseContext";
import { formatDateTime } from "@/lib/utils/format";

interface AdjustmentRow {
  id: string;
  adjustmentNumber: string;
  productName: string;
  sku: string;
  unit: string;
  warehouseName: string;
  locationName: string;
  systemQuantity: number;
  countedQuantity: number;
  difference: number;
  reason: string;
  notes?: string;
  status: string;
  createdAt: string;
}

export default function AdjustmentsPage() {
  const { selectedWarehouseId } = useWarehouse();
  const [adjustments, setAdjustments] = useState<AdjustmentRow[]>([]);
  const [search, setSearch] = useState("");
  const [reasonFilter, setReasonFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdjustments = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (reasonFilter !== "ALL") params.append("reason", reasonFilter);
      if (selectedWarehouseId !== "ALL") params.append("warehouseId", selectedWarehouseId);

      const res = await fetch(`/api/operations/adjustments?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAdjustments(data.adjustments || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdjustments();
  }, [search, reasonFilter, selectedWarehouseId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Inventory Adjustments</h1>
          <p className="text-xs text-slate-500 mt-1">
            Reconcile physical stock counts with system records and write audit variances
          </p>
        </div>
        <Link href="/operations/adjustments/new">
          <Button className="h-9 text-xs">
            <Plus className="w-4 h-4 mr-1.5" />
            New Stock Adjustment
          </Button>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <Input
              placeholder="Search adjustment #, product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8 text-xs"
            />
          </div>

          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Reasons</option>
            <option value="DAMAGED">Damaged</option>
            <option value="LOST">Lost</option>
            <option value="FOUND">Found</option>
            <option value="COUNTING_ERROR">Counting Error</option>
            <option value="EXPIRED">Expired</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-900">{adjustments.length}</span> adjustments
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Adjustment #</th>
                  <th className="py-3 px-3">Product Name</th>
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-3 text-right">System Stock</th>
                  <th className="py-3 px-3 text-right">Physical Count</th>
                  <th className="py-3 px-3 text-center">Variance (Diff)</th>
                  <th className="py-3 px-3 text-center">Reason</th>
                  <th className="py-3 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-24" /></td>
                      <td className="py-4 px-3"><div className="h-4 bg-slate-200 rounded w-32" /></td>
                      <td className="py-4 px-3"><div className="h-4 bg-slate-100 rounded w-28" /></td>
                      <td className="py-4 px-3 text-right"><div className="h-4 bg-slate-100 rounded w-12 ml-auto" /></td>
                      <td className="py-4 px-3 text-right"><div className="h-4 bg-slate-200 rounded w-12 ml-auto" /></td>
                      <td className="py-4 px-3 text-center"><div className="h-4 bg-slate-100 rounded w-16 mx-auto" /></td>
                      <td className="py-4 px-3 text-center"><div className="h-4 bg-slate-100 rounded w-16 mx-auto" /></td>
                      <td className="py-4 px-3"><div className="h-4 bg-slate-100 rounded w-24" /></td>
                    </tr>
                  ))
                ) : adjustments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No stock adjustments found. Click &quot;New Stock Adjustment&quot; to correct counts.
                    </td>
                  </tr>
                ) : (
                  adjustments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 flex items-center space-x-2">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                        <span>{a.adjustmentNumber}</span>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-900">{a.productName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{a.sku}</div>
                      </td>
                      <td className="py-3.5 px-3 text-slate-700">
                        <div>{a.warehouseName}</div>
                        <div className="text-[10px] text-slate-400">Rack: {a.locationName}</div>
                      </td>
                      <td className="py-3.5 px-3 text-right text-slate-500 font-medium">
                        {a.systemQuantity} {a.unit}
                      </td>
                      <td className="py-3.5 px-3 text-right font-bold text-slate-900">
                        {a.countedQuantity} {a.unit}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                            a.difference < 0
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : a.difference > 0
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-50 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {a.difference < 0 ? (
                            <ArrowDown className="w-3 h-3 mr-0.5 text-rose-600" />
                          ) : a.difference > 0 ? (
                            <ArrowUp className="w-3 h-3 mr-0.5 text-emerald-600" />
                          ) : (
                            <Equal className="w-3 h-3 mr-0.5 text-slate-500" />
                          )}
                          {a.difference > 0 ? `+${a.difference}` : a.difference}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <Badge variant="outline" className="font-semibold text-[10px]">
                          {a.reason}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-3 text-slate-500 text-[11px]">
                        {formatDateTime(a.createdAt)}
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
