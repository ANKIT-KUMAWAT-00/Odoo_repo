"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Package,
  Search,
  Filter,
  SlidersHorizontal,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Boxes,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useWarehouse } from "@/components/layout/WarehouseContext";
import { useUser } from "@/components/layout/UserContext";

interface ProductRow {
  id: string;
  name: string;
  sku: string;
  category: string;
  categoryId: string;
  uom: string;
  totalStock: number;
  available: number;
  reserved: number;
  reorderLevel: number;
  status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  productStatus: string;
  imageUrl?: string;
}

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const initialStockFilter = searchParams.get("stockFilter") || "ALL";

  const { selectedWarehouseId } = useWarehouse();
  const { isManager } = useUser();

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [stockFilter, setStockFilter] = useState(initialStockFilter);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Fetch Categories for filter
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
        }
      } catch {
        // ignore
      }
    }
    loadCategories();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (categoryFilter !== "ALL") params.append("categoryId", categoryFilter);
      if (stockFilter !== "ALL") params.append("stockFilter", stockFilter);
      if (selectedWarehouseId !== "ALL") params.append("warehouseId", selectedWarehouseId);
      params.append("page", page.toString());
      params.append("limit", "10");

      const res = await fetch(`/api/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, categoryFilter, stockFilter, selectedWarehouseId, page]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(products.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleClearFilters = () => {
    setSearch("");
    setCategoryFilter("ALL");
    setStockFilter("ALL");
    setPage(1);
  };

  const isFiltered = search !== "" || categoryFilter !== "ALL" || stockFilter !== "ALL";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Products Catalog</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage product metadata, SKUs, units of measure, and multi-location physical inventory
          </p>
        </div>
        {isManager && (
          <Link href="/products/new">
            <Button className="h-9 text-xs">
              <Plus className="w-4 h-4 mr-1.5" />
              Add Product
            </Button>
          </Link>
        )}
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <Input
              placeholder="Search product, SKU..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-8 text-xs"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(e) => {
              setStockFilter(e.target.value);
              setPage(1);
            }}
            className="h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Stock Levels</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock Alert</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>

          {isFiltered && (
            <button
              onClick={handleClearFilters}
              className="h-8 px-2.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center transition-colors font-medium"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Total items: <span className="font-bold text-slate-900">{totalCount}</span>
        </div>
      </div>

      {/* Bulk action toolbar if items selected */}
      {selectedIds.length > 0 && (
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-3 flex items-center justify-between text-xs text-brand-900 animate-in fade-in">
          <div className="flex items-center space-x-2 font-semibold">
            <span>{selectedIds.length} products selected</span>
          </div>
          <div className="flex items-center space-x-2">
            <Link href={`/operations/adjustments/new?productId=${selectedIds[0]}`}>
              <Button size="sm" variant="outline" className="h-7 text-xs bg-white">
                Adjust Selected
              </Button>
            </Link>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds([])}
              className="h-7 text-xs text-slate-600"
            >
              Deselect All
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === products.length && products.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3">Product Name</th>
                  <th className="py-3 px-3">SKU</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-center">Unit</th>
                  <th className="py-3 px-3 text-right">Total Stock</th>
                  <th className="py-3 px-3 text-right">Available</th>
                  <th className="py-3 px-3 text-right">Reserved</th>
                  <th className="py-3 px-3 text-right">Reorder Pt</th>
                  <th className="py-3 px-3 text-center">Stock Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-3.5 px-4"><div className="h-4 w-4 bg-slate-200 rounded" /></td>
                      <td className="py-3.5 px-3"><div className="h-4 bg-slate-200 rounded w-32" /></td>
                      <td className="py-3.5 px-3"><div className="h-4 bg-slate-100 rounded w-20" /></td>
                      <td className="py-3.5 px-3"><div className="h-4 bg-slate-100 rounded w-20" /></td>
                      <td className="py-3.5 px-3 text-center"><div className="h-4 bg-slate-100 rounded w-8 mx-auto" /></td>
                      <td className="py-3.5 px-3 text-right"><div className="h-4 bg-slate-200 rounded w-12 ml-auto" /></td>
                      <td className="py-3.5 px-3 text-right"><div className="h-4 bg-slate-200 rounded w-12 ml-auto" /></td>
                      <td className="py-3.5 px-3 text-right"><div className="h-4 bg-slate-100 rounded w-10 ml-auto" /></td>
                      <td className="py-3.5 px-3 text-right"><div className="h-4 bg-slate-100 rounded w-10 ml-auto" /></td>
                      <td className="py-3.5 px-3 text-center"><div className="h-4 bg-slate-200 rounded w-16 mx-auto" /></td>
                      <td className="py-3.5 px-4 text-right"><div className="h-4 bg-slate-100 rounded w-12 ml-auto" /></td>
                    </tr>
                  ))
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400">
                      No products found matching your filter criteria
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        selectedIds.includes(p.id) ? "bg-brand-50/30" : ""
                      }`}
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(p.id)}
                          onChange={() => toggleSelectOne(p.id)}
                          className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center text-slate-400">
                            {p.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <Link
                              href={`/products/${p.id}`}
                              className="font-bold text-slate-900 hover:text-brand-600 transition-colors block text-xs"
                            >
                              {p.name}
                            </Link>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-slate-600 text-[11px]">{p.sku}</td>
                      <td className="py-3 px-3 text-slate-700 font-medium">{p.category}</td>
                      <td className="py-3 px-3 text-center text-slate-500 font-mono">{p.uom}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {p.totalStock.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-700">
                        {p.available.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-500 font-medium">
                        {p.reserved > 0 ? (
                          <span className="text-amber-600 font-semibold">{p.reserved}</span>
                        ) : (
                          "0"
                        )}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-500 font-medium">
                        {p.reorderLevel}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {p.status === "OUT_OF_STOCK" && (
                          <Badge variant="destructive">Out of Stock</Badge>
                        )}
                        {p.status === "LOW_STOCK" && (
                          <Badge variant="warning">Low Stock</Badge>
                        )}
                        {p.status === "IN_STOCK" && (
                          <Badge variant="success">In Stock</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <Link href={`/operations/adjustments/new?productId=${p.id}`}>
                            <button
                              className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                              title="Adjust stock"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                            </button>
                          </Link>
                          <Link href={`/products/${p.id}`}>
                            <Button size="sm" variant="outline" className="h-7 text-xs px-2">
                              View
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50">
              <span className="text-xs text-slate-500">
                Page <strong className="text-slate-900">{page}</strong> of{" "}
                <strong className="text-slate-900">{totalPages}</strong>
              </span>
              <div className="flex items-center space-x-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="h-7 px-2"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="h-7 px-2"
                >
                  Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
