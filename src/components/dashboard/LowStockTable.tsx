"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, ExternalLink } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface LowStockItem {
  id: string;
  name: string;
  sku: string;
  warehouse: string;
  availableQuantity: number;
  reorderLevel: number;
  unit: string;
  status: "LOW_STOCK" | "OUT_OF_STOCK";
}

export function LowStockTable({ products }: { products: LowStockItem[] }) {
  return (
    <Card className="col-span-full lg:col-span-6">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="flex items-center space-x-2">
            <span>Low & Depleted Stock</span>
            {products.length > 0 && (
              <span className="px-2 py-0.5 text-xs font-semibold bg-rose-50 text-rose-600 rounded-full border border-rose-200">
                {products.length} alert{products.length > 1 ? "s" : ""}
              </span>
            )}
          </CardTitle>
          <CardDescription>Items that have reached or dropped below reorder safety points</CardDescription>
        </div>
        <Link href="/reorder-rules" className="text-xs text-brand-600 hover:text-brand-800 font-semibold flex items-center">
          Rules <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Link>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-y border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Product</th>
                <th className="py-2.5 px-3">Warehouse</th>
                <th className="py-2.5 px-3 text-right">Available</th>
                <th className="py-2.5 px-3 text-right">Reorder At</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    All inventory levels are currently above reorder thresholds.
                  </td>
                </tr>
              ) : (
                products.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{item.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{item.sku}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 truncate max-w-[120px]">{item.warehouse}</td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      {item.availableQuantity} <span className="font-normal text-slate-500">{item.unit}</span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-500 font-medium">
                      {item.reorderLevel} {item.unit}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {item.status === "OUT_OF_STOCK" ? (
                        <Badge variant="destructive">Out of Stock</Badge>
                      ) : (
                        <Badge variant="warning">Low Stock</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/operations/receipts/new?productId=${item.id}`}>
                        <Button size="sm" variant="outline" className="h-7 text-xs px-2.5">
                          Reorder
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
  );
}
