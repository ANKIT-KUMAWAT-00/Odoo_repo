"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Building2,
  MapPin,
  User,
  Phone,
  Package,
  Layers,
  FileDown,
  Truck,
  ArrowRightLeft,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils/format";

export default function WarehouseDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/warehouses/${id}`);
        if (res.ok) {
          const json = await res.json();
          setData(json.warehouse);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-64" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-slate-500">
        Warehouse not found. <Link href="/warehouses" className="text-brand-600 underline">Return</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div className="flex items-center space-x-3">
          <Link href="/warehouses">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{data.name}</h1>
              <Badge variant="outline" className="font-mono font-bold">{data.code}</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{data.address || "No physical address provided"}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Link href={`/operations/receipts/new?warehouseId=${data.id}`}>
            <Button size="sm" variant="outline" className="text-xs">
              <FileDown className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Inbound Receipt
            </Button>
          </Link>
          <Link href={`/operations/deliveries/new?warehouseId=${data.id}`}>
            <Button size="sm" className="text-xs">
              <Truck className="w-3.5 h-3.5 mr-1" /> Outbound Delivery
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Stock</span>
          <div className="text-2xl font-bold text-brand-600 mt-1">{data.totalStock.toLocaleString()}</div>
          <span className="text-[10px] text-slate-500">Stored units</span>
        </Card>
        <Card className="p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Products</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{data.totalProducts}</div>
          <span className="text-[10px] text-slate-500">Unique SKUs</span>
        </Card>
        <Card className="p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Locations</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{data.locations?.length || 0}</div>
          <span className="text-[10px] text-slate-500">Racks & zones</span>
        </Card>
        <Card className="p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Inbound Receipts</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{data.receipts?.length || 0}</div>
          <span className="text-[10px] text-slate-500">Recent shipments</span>
        </Card>
        <Card className="p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Deliveries</span>
          <div className="text-2xl font-bold text-blue-600 mt-1">{data.deliveries?.length || 0}</div>
          <span className="text-[10px] text-slate-500">Dispatches</span>
        </Card>
      </div>

      {/* Locations & Racks Table */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle>Storage Locations & Functional Zones</CardTitle>
            <span className="text-xs text-slate-500">Physical zones and racks configured inside this warehouse</span>
          </div>
          <Link href="/locations">
            <Button size="sm" variant="outline" className="text-xs">
              Manage All Locations
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-y border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Location Name</th>
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Zone Type</th>
                  <th className="py-2.5 px-3 text-right">Capacity</th>
                  <th className="py-2.5 px-3 text-right">Stored Units</th>
                  <th className="py-2.5 px-3">Utilization</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.locations?.map((loc: any) => (
                  <tr key={loc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">{loc.name}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{loc.code}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {loc.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600 font-medium">
                      {loc.capacity.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      {loc.currentStock.toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              loc.occupancyPercent > 85 ? "bg-rose-500" : "bg-brand-600"
                            }`}
                            style={{ width: `${loc.occupancyPercent}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-500 font-semibold">{loc.occupancyPercent}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Badge variant="success">Active</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
