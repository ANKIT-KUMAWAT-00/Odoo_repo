"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, FileDown, CheckCircle2, Clock, Calendar, ArrowRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useWarehouse } from "@/components/layout/WarehouseContext";
import { formatDate } from "@/lib/utils/format";

interface ReceiptRow {
  id: string;
  receiptNumber: string;
  supplier: string;
  warehouseName: string;
  warehouseId: string;
  locationName: string;
  expectedDate?: string;
  status: string;
  itemCount: number;
  totalExpected: number;
  totalReceived: number;
  createdAt: string;
}

export default function ReceiptsPage() {
  const { selectedWarehouseId } = useWarehouse();
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);

  const fetchReceipts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (selectedWarehouseId !== "ALL") params.append("warehouseId", selectedWarehouseId);

      const res = await fetch(`/api/operations/receipts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReceipts(data.receipts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, [search, statusFilter, selectedWarehouseId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DONE":
        return <Badge variant="success">Done</Badge>;
      case "READY":
        return <Badge variant="info">Ready to Receive</Badge>;
      case "WAITING":
        return <Badge variant="warning">Waiting Shipment</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="warning">In Progress</Badge>;
      case "DRAFT":
        return <Badge variant="secondary">Draft</Badge>;
      case "CANCELED":
        return <Badge variant="destructive">Canceled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Inbound Receipts</h1>
          <p className="text-xs text-slate-500 mt-1">
            Receive incoming vendor shipments and automatically update location inventory ledgers
          </p>
        </div>
        <Link href="/operations/receipts/new">
          <Button className="h-9 text-xs">
            <Plus className="w-4 h-4 mr-1.5" />
            New Receipt
          </Button>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <Input
              placeholder="Search receipt #, supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8 text-xs"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="WAITING">Waiting</option>
            <option value="READY">Ready</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
            <option value="CANCELED">Canceled</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-900">{receipts.length}</span> receipts
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Receipt Number</th>
                  <th className="py-3 px-3">Supplier / Vendor</th>
                  <th className="py-3 px-3">Warehouse & Dest Rack</th>
                  <th className="py-3 px-3">Expected Date</th>
                  <th className="py-3 px-3 text-right">Items</th>
                  <th className="py-3 px-3 text-right">Expected Qty</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-24" /></td>
                      <td className="py-4 px-3"><div className="h-4 bg-slate-200 rounded w-32" /></td>
                      <td className="py-4 px-3"><div className="h-4 bg-slate-100 rounded w-28" /></td>
                      <td className="py-4 px-3"><div className="h-4 bg-slate-100 rounded w-20" /></td>
                      <td className="py-4 px-3 text-right"><div className="h-4 bg-slate-100 rounded w-8 ml-auto" /></td>
                      <td className="py-4 px-3 text-right"><div className="h-4 bg-slate-200 rounded w-12 ml-auto" /></td>
                      <td className="py-4 px-3 text-center"><div className="h-4 bg-slate-100 rounded w-16 mx-auto" /></td>
                      <td className="py-4 px-4 text-right"><div className="h-4 bg-slate-100 rounded w-16 ml-auto" /></td>
                    </tr>
                  ))
                ) : receipts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No receipts found matching your criteria. Click &quot;New Receipt&quot; to receive goods.
                    </td>
                  </tr>
                ) : (
                  receipts.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 flex items-center space-x-2">
                        <FileDown className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <Link href={`/operations/receipts/${r.id}`} className="hover:text-brand-600 hover:underline">
                          {r.receiptNumber}
                        </Link>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-slate-800">{r.supplier}</td>
                      <td className="py-3.5 px-3 text-slate-600">
                        <div>{r.warehouseName}</div>
                        <div className="text-[10px] text-slate-400">→ {r.locationName}</div>
                      </td>
                      <td className="py-3.5 px-3 text-slate-500">{formatDate(r.expectedDate)}</td>
                      <td className="py-3.5 px-3 text-right font-medium text-slate-700">{r.itemCount}</td>
                      <td className="py-3.5 px-3 text-right font-bold text-slate-900">
                        {r.totalExpected.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3 text-center">{getStatusBadge(r.status)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <Link href={`/operations/receipts/${r.id}`}>
                          <Button size="sm" variant="outline" className="h-7 text-xs px-2.5">
                            Details
                          </Button>
                        </Link>
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
