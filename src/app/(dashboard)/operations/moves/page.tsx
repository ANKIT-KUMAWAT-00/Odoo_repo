"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  History,
  Search,
  Download,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils/format";
import { useWarehouse } from "@/components/layout/WarehouseContext";

interface MovementRecord {
  id: string;
  timestamp: string;
  reference: string;
  operationType: "RECEIPT" | "DELIVERY" | "TRANSFER" | "ADJUSTMENT";
  productId: string;
  sku: string;
  productName: string;
  quantity: number;
  sourceWarehouseName?: string;
  sourceLocationName?: string;
  destinationWarehouseName?: string;
  destinationLocationName?: string;
  userName?: string;
  status: string;
  notes?: string;
}

export default function MoveHistoryPage() {
  const { selectedWarehouseId } = useWarehouse();
  const [movements, setMovements] = useState<MovementRecord[]>([]);
  const [search, setSearch] = useState("");
  const [operationFilter, setOperationFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);

  const fetchMovements = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (operationFilter !== "ALL") params.append("operation", operationFilter);
      if (selectedWarehouseId !== "ALL") params.append("warehouseId", selectedWarehouseId);

      const res = await fetch(`/api/operations/moves?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMovements(data.movements || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [search, operationFilter, selectedWarehouseId]);

  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (operationFilter !== "ALL") params.append("operation", operationFilter);
    if (selectedWarehouseId !== "ALL") params.append("warehouseId", selectedWarehouseId);
    params.append("format", "csv");

    window.open(`/api/operations/moves?${params.toString()}`, "_blank");
  };

  const getOperationBadge = (op: string) => {
    switch (op) {
      case "RECEIPT":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ArrowDownLeft className="w-3 h-3 mr-1 text-emerald-600" />
            Receipt
          </span>
        );
      case "DELIVERY":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <ArrowUpRight className="w-3 h-3 mr-1 text-blue-600" />
            Delivery
          </span>
        );
      case "TRANSFER":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <ArrowRightLeft className="w-3 h-3 mr-1 text-purple-600" />
            Transfer
          </span>
        );
      case "ADJUSTMENT":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <SlidersHorizontal className="w-3 h-3 mr-1 text-amber-600" />
            Adjustment
          </span>
        );
      default:
        return <Badge variant="secondary">{op}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Stock Ledger / Move History</h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete, immutable audit trail of every stock mutation, receipt, shipment, and physical adjustment
          </p>
        </div>
        <Button onClick={handleExportCsv} variant="outline" size="sm" className="h-9 text-xs">
          <Download className="w-4 h-4 mr-1.5" />
          Export to CSV
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <Input
              placeholder="Search reference, product, user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8 text-xs"
            />
          </div>

          <select
            value={operationFilter}
            onChange={(e) => setOperationFilter(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Operations</option>
            <option value="RECEIPT">Receipts (+ Inbound)</option>
            <option value="DELIVERY">Deliveries (- Outbound)</option>
            <option value="TRANSFER">Internal Transfers</option>
            <option value="ADJUSTMENT">Adjustments (+/- Count)</option>
          </select>

          {(search !== "" || operationFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearch("");
                setOperationFilter("ALL");
              }}
              className="h-8 px-2.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center transition-colors font-medium"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-900">{movements.length}</span> ledger movements
        </div>
      </div>

      {/* Ledger Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider sticky top-0">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-3">Reference</th>
                  <th className="py-3 px-3">Operation</th>
                  <th className="py-3 px-3">Product Name</th>
                  <th className="py-3 px-3">SKU</th>
                  <th className="py-3 px-3 text-right">Quantity</th>
                  <th className="py-3 px-3">Source Location</th>
                  <th className="py-3 px-3">Destination Location</th>
                  <th className="py-3 px-3">Staff / User</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-28" /></td>
                      <td className="py-4 px-3"><div className="h-4 bg-slate-100 rounded w-20" /></td>
                      <td className="py-4 px-3"><div className="h-4 bg-slate-100 rounded w-16" /></td>
                      <td className="py-4 px-3"><div className="h-4 bg-slate-200 rounded w-32" /></td>
                      <td className="py-4 px-3"><div className="h-4 bg-slate-100 rounded w-16" /></td>
                      <td className="py-4 px-3 text-right"><div className="h-4 bg-slate-200 rounded w-12 ml-auto" /></td>
                      <td className="py-4 px-3"><div className="h-4 bg-slate-100 rounded w-24" /></td>
                      <td className="py-4 px-3"><div className="h-4 bg-slate-100 rounded w-24" /></td>
                      <td className="py-4 px-3"><div className="h-4 bg-slate-100 rounded w-20" /></td>
                      <td className="py-4 px-4"><div className="h-4 bg-slate-100 rounded w-36" /></td>
                    </tr>
                  ))
                ) : movements.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400 font-sans">
                      No stock movement entries found.
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-500 font-sans whitespace-nowrap">
                        {formatDateTime(m.timestamp)}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                        {m.reference}
                      </td>
                      <td className="py-3 px-3 font-sans">
                        {getOperationBadge(m.operationType)}
                      </td>
                      <td className="py-3 px-3 font-sans font-bold text-slate-900 truncate max-w-[160px]">
                        <Link href={`/products/${m.productId}`} className="hover:underline hover:text-brand-600">
                          {m.productName}
                        </Link>
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-[11px]">{m.sku}</td>
                      <td className="py-3 px-3 text-right font-bold text-xs whitespace-nowrap">
                        <span
                          className={
                            m.quantity > 0
                              ? "text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md"
                              : m.quantity < 0
                              ? "text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md"
                              : "text-slate-600"
                          }
                        >
                          {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-600 truncate max-w-[140px]">
                        {m.sourceWarehouseName ? `${m.sourceWarehouseName} / ${m.sourceLocationName}` : "—"}
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-600 truncate max-w-[140px]">
                        {m.destinationWarehouseName
                          ? `${m.destinationWarehouseName} / ${m.destinationLocationName}`
                          : "—"}
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-700 font-medium truncate max-w-[120px]">
                        {m.userName || "System"}
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-500 text-[11px] truncate max-w-[180px]">
                        {m.notes || "—"}
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
