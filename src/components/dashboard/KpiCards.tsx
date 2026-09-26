"use client";

import React from "react";
import Link from "next/link";
import { Package, AlertTriangle, XCircle, FileDown, Truck, ArrowRightLeft, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";

export interface KpiData {
  totalStockQuantity: number;
  activeProductsCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  pendingReceiptsCount: number;
  pendingDeliveriesCount: number;
  activeTransfersCount: number;
}

export function KpiCards({ kpis, isLoading }: { kpis: KpiData; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-20 mb-3" />
            <div className="h-7 bg-slate-200 rounded w-16 mb-2" />
            <div className="h-3 bg-slate-100 rounded w-24" />
          </Card>
        ))}
      </div>
    );
  }

  const items = [
    {
      title: "Total In Stock",
      value: kpis.totalStockQuantity.toLocaleString(),
      subtitle: `${kpis.activeProductsCount} active products`,
      icon: Package,
      color: "text-brand-600 bg-brand-50 border-brand-200",
      href: "/products",
    },
    {
      title: "Low Stock Alert",
      value: kpis.lowStockCount.toString(),
      subtitle: kpis.lowStockCount > 0 ? "Requires reordering" : "Levels optimal",
      icon: AlertTriangle,
      color: kpis.lowStockCount > 0 ? "text-amber-600 bg-amber-50 border-amber-200" : "text-slate-600 bg-slate-50 border-slate-200",
      alert: kpis.lowStockCount > 0,
      href: "/products?stockFilter=LOW_STOCK",
    },
    {
      title: "Out of Stock",
      value: kpis.outOfStockCount.toString(),
      subtitle: kpis.outOfStockCount > 0 ? "Zero inventory" : "None out of stock",
      icon: XCircle,
      color: kpis.outOfStockCount > 0 ? "text-rose-600 bg-rose-50 border-rose-200" : "text-slate-600 bg-slate-50 border-slate-200",
      alert: kpis.outOfStockCount > 0,
      href: "/products?stockFilter=OUT_OF_STOCK",
    },
    {
      title: "Pending Receipts",
      value: kpis.pendingReceiptsCount.toString(),
      subtitle: "Inbound vendor goods",
      icon: FileDown,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
      href: "/operations/receipts",
    },
    {
      title: "Pending Deliveries",
      value: kpis.pendingDeliveriesCount.toString(),
      subtitle: "Outbound customer orders",
      icon: Truck,
      color: "text-blue-600 bg-blue-50 border-blue-200",
      href: "/operations/deliveries",
    },
    {
      title: "Internal Transfers",
      value: kpis.activeTransfersCount.toString(),
      subtitle: "In-flight location moves",
      icon: ArrowRightLeft,
      color: "text-purple-600 bg-purple-50 border-purple-200",
      href: "/operations/transfers",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {items.map((item) => (
        <Link key={item.title} href={item.href} className="group">
          <Card className="p-4 transition-all duration-200 hover:shadow-md hover:border-slate-300 relative overflow-hidden h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
                  {item.title}
                </span>
                <div className={`p-1.5 rounded-lg border ${item.color}`}>
                  <item.icon className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="mt-2.5 flex items-baseline">
                <span className="text-2xl font-bold tracking-tight text-slate-900 group-hover:text-brand-600 transition-colors">
                  {item.value}
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
              <span className={`truncate font-medium ${item.alert ? "text-rose-600 font-semibold" : ""}`}>
                {item.subtitle}
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all flex-shrink-0" />
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
