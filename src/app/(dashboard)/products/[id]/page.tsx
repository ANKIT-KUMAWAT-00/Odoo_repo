"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Package,
  MapPin,
  History,
  Sliders,
  SlidersHorizontal,
  FileDown,
  Truck,
  ArrowRightLeft,
  AlertTriangle,
  Building2,
  Calendar,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatCurrency } from "@/lib/utils/format";

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "locations" | "movements" | "reordering">("overview");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/products/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data.product);
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
        <div className="h-8 bg-slate-200 rounded w-48" />
        <div className="h-40 bg-slate-200 rounded-2xl" />
        <div className="h-64 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-8 text-center text-slate-500">
        Product not found. <Link href="/products" className="text-brand-600 underline">Back to catalog</Link>
      </div>
    );
  }

  const { stockSummary } = product;

  return (
    <div className="space-y-6">
      {/* Header Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div className="flex items-center space-x-3">
          <Link href="/products">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{product.name}</h1>
              <Badge variant="outline" className="font-mono">{product.sku}</Badge>
              {stockSummary?.status === "OUT_OF_STOCK" && (
                <Badge variant="destructive">Out of Stock</Badge>
              )}
              {stockSummary?.status === "LOW_STOCK" && (
                <Badge variant="warning">Low Stock</Badge>
              )}
              {stockSummary?.status === "IN_STOCK" && (
                <Badge variant="success">In Stock</Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Category: <strong className="text-slate-700">{product.category?.name}</strong> • Unit: <strong className="text-slate-700">{product.uom}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Link href={`/operations/adjustments/new?productId=${product.id}`}>
            <Button size="sm" variant="outline" className="text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
              Adjust Stock
            </Button>
          </Link>
          <Link href={`/operations/receipts/new?productId=${product.id}`}>
            <Button size="sm" variant="outline" className="text-xs">
              <FileDown className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              Order Receipt
            </Button>
          </Link>
          <Link href={`/operations/deliveries/new?productId=${product.id}`}>
            <Button size="sm" className="text-xs">
              <Truck className="w-3.5 h-3.5 mr-1.5" />
              Dispatch Delivery
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero Banner with Product Image & Core Stats */}
      <Card className="overflow-hidden">
        <div className="flex flex-col md:flex-row items-center p-6 gap-6 bg-gradient-to-r from-slate-50 via-white to-brand-50/20">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-md">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <Package className="w-12 h-12 text-slate-400" />
            )}
          </div>

          <div className="flex-1 grid grid-cols-2 sm:grid-cols-5 gap-4 w-full">
            <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Physical</span>
              <span className="text-2xl font-bold text-slate-900 block mt-1">
                {stockSummary?.totalQuantity.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">{product.uom} on hand</span>
            </div>

            <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 shadow-2xs">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Available</span>
              <span className="text-2xl font-bold text-emerald-800 block mt-1">
                {stockSummary?.availableQuantity.toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-600 font-mono">Unreserved</span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reserved</span>
              <span className="text-2xl font-bold text-amber-600 block mt-1">
                {stockSummary?.reservedQuantity.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Committed orders</span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Incoming</span>
              <span className="text-2xl font-bold text-blue-600 block mt-1">
                +{stockSummary?.incomingQuantity.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Pending vendor</span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Outgoing</span>
              <span className="text-2xl font-bold text-purple-600 block mt-1">
                -{stockSummary?.outgoingQuantity.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Pending dispatch</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-t border-slate-200 bg-slate-50 px-6 gap-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === "overview"
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Overview & Pricing</span>
          </button>

          <button
            onClick={() => setActiveTab("locations")}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === "locations"
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Stock by Location ({stockSummary?.byLocation.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("movements")}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === "movements"
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Movement Ledger ({product.movements?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("reordering")}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === "reordering"
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Reordering Rules</span>
          </button>
        </div>
      </Card>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-900">Product Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Product Name</span>
                <span className="font-semibold text-slate-900">{product.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">SKU Code</span>
                <span className="font-mono font-bold text-slate-900">{product.sku}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Category</span>
                <span className="font-semibold text-slate-900">{product.category?.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Unit of Measure</span>
                <span className="font-semibold text-slate-900">{product.uom}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Barcode / UPC</span>
                <span className="font-mono text-slate-700">{product.barcode || "—"}</span>
              </div>
              <div className="pt-2">
                <span className="text-slate-500 block mb-1">Description</span>
                <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {product.description || "No detailed description provided."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-900">Valuation & Procurement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Preferred Supplier</span>
                <span className="font-semibold text-slate-900">{product.supplier || "—"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Cost Price</span>
                <span className="font-bold text-slate-900">{formatCurrency(product.costPrice)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Selling Price</span>
                <span className="font-bold text-slate-900">{formatCurrency(product.sellingPrice)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Gross Margin</span>
                <span className="font-bold text-emerald-600">
                  {product.sellingPrice > 0
                    ? `${Math.round(((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100)}%`
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Total Inventory Valuation</span>
                <span className="font-bold text-brand-600 text-sm">
                  {formatCurrency((stockSummary?.totalQuantity || 0) * product.costPrice)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: STOCK BY LOCATION */}
      {activeTab === "locations" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-900">
              Location-Aware Stock Distribution
            </CardTitle>
            <span className="text-xs text-slate-500">
              Physical inventory breakdown across warehouses and storage racks
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-y border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4">Warehouse</th>
                    <th className="py-2.5 px-3">Location / Rack</th>
                    <th className="py-2.5 px-3">Zone Type</th>
                    <th className="py-2.5 px-3 text-right">On-Hand Quantity</th>
                    <th className="py-2.5 px-3 text-right">Reserved Quantity</th>
                    <th className="py-2.5 px-3 text-right">Available Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockSummary?.byLocation.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No inventory currently recorded at any location for this product.
                      </td>
                    </tr>
                  ) : (
                    stockSummary?.byLocation.map((loc: any) => (
                      <tr key={loc.locationId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900 flex items-center space-x-2">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{loc.warehouseName}</span>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-700">{loc.locationName}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                            {loc.locationType}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900">
                          {loc.quantity.toLocaleString()} {product.uom}
                        </td>
                        <td className="py-3 px-3 text-right text-amber-600 font-medium">
                          {loc.reservedQuantity.toLocaleString()} {product.uom}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-700">
                          {loc.availableQuantity.toLocaleString()} {product.uom}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: MOVEMENT HISTORY */}
      {activeTab === "movements" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-900">
              Audit Stock Movements
            </CardTitle>
            <span className="text-xs text-slate-500">
              Historical ledger entries tracking every receipt, delivery, transfer, and adjustment
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-y border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4">Date & Time</th>
                    <th className="py-2.5 px-3">Reference</th>
                    <th className="py-2.5 px-3">Operation</th>
                    <th className="py-2.5 px-3">From</th>
                    <th className="py-2.5 px-3">To</th>
                    <th className="py-2.5 px-3 text-right">Quantity</th>
                    <th className="py-2.5 px-3">Staff / User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {product.movements?.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No movement records for this product yet.
                      </td>
                    </tr>
                  ) : (
                    product.movements?.map((m: any) => (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 text-slate-500">{formatDateTime(m.timestamp)}</td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">{m.reference}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                            {m.operationType}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {m.sourceWarehouseName ? `${m.sourceWarehouseName} / ${m.sourceLocationName}` : "—"}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {m.destinationWarehouseName ? `${m.destinationWarehouseName} / ${m.destinationLocationName}` : "—"}
                        </td>
                        <td className="py-3 px-3 text-right font-bold">
                          <span className={m.quantity >= 0 ? "text-emerald-600" : "text-rose-600"}>
                            {m.quantity >= 0 ? `+${m.quantity}` : m.quantity} {product.uom}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-700 font-medium">{m.userName || "System"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 4: REORDERING RULES */}
      {activeTab === "reordering" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-900">
              Configured Reorder Rules
            </CardTitle>
            <span className="text-xs text-slate-500">
              Automatic replenishment threshold policies
            </span>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Minimum Stock</span>
                <div className="text-xl font-bold text-slate-900 mt-1">{product.minStock} {product.uom}</div>
              </div>
              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200">
                <span className="text-[10px] uppercase font-semibold text-amber-700">Reorder Point (Trigger)</span>
                <div className="text-xl font-bold text-amber-900 mt-1">{product.reorderLevel} {product.uom}</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Reorder Quantity</span>
                <div className="text-xl font-bold text-slate-900 mt-1">{product.reorderQuantity} {product.uom}</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Current Status</span>
                <div className="mt-1">
                  {stockSummary?.status === "OUT_OF_STOCK" && (
                    <Badge variant="destructive">Out of Stock</Badge>
                  )}
                  {stockSummary?.status === "LOW_STOCK" && (
                    <Badge variant="warning">Low Stock Alert</Badge>
                  )}
                  {stockSummary?.status === "IN_STOCK" && (
                    <Badge variant="success">Normal (In Stock)</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
