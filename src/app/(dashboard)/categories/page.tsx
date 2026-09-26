"use client";

import React, { useState, useEffect } from "react";
import { Plus, Tag, Search, Trash2, Edit2, Package, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useToast } from "@/components/ui/toast";
import { useUser } from "@/components/layout/UserContext";

interface CategoryItem {
  id: string;
  name: string;
  description?: string;
  status: string;
  productCount: number;
  totalStock: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CategoryItem | null>(null);

  const { isManager } = useUser();
  const toast = useToast();

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: categoryName.trim(),
          description: categoryDescription.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error("Error", data.error || "Failed to create category");
      } else {
        toast.success("Category Created", `Category "${categoryName}" is now available`);
        setIsModalOpen(false);
        setCategoryName("");
        setCategoryDescription("");
        fetchCategories();
      }
    } catch {
      toast.error("Error", "Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/categories?id=${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Failed to delete", data.error);
      } else {
        toast.success("Deleted", `Category "${deleteTarget.name}" was removed`);
        setDeleteTarget(null);
        fetchCategories();
      }
    } catch {
      toast.error("Error", "Failed to delete category");
    }
  };

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Categories</h1>
          <p className="text-xs text-slate-500 mt-1">
            Organize products and materials into structured operational hierarchies
          </p>
        </div>
        {isManager && (
          <Button onClick={() => setIsModalOpen(true)} className="h-9 text-xs">
            <Plus className="w-4 h-4 mr-1.5" />
            Add Category
          </Button>
        )}
      </div>

      {/* Search & Stats */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <Input
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-900">{filtered.length}</span> categories
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Category Name</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Products</th>
                  <th className="py-3 px-4 text-right">Total In-Stock Units</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  {isManager && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-28" /></td>
                      <td className="py-4 px-4"><div className="h-4 bg-slate-100 rounded w-48" /></td>
                      <td className="py-4 px-4 text-right"><div className="h-4 bg-slate-200 rounded w-10 ml-auto" /></td>
                      <td className="py-4 px-4 text-right"><div className="h-4 bg-slate-200 rounded w-16 ml-auto" /></td>
                      <td className="py-4 px-4 text-center"><div className="h-4 bg-slate-100 rounded w-12 mx-auto" /></td>
                      {isManager && <td className="py-4 px-4 text-right"><div className="h-4 bg-slate-100 rounded w-8 ml-auto" /></td>}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No categories found matching your query
                    </td>
                  </tr>
                ) : (
                  filtered.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="p-1.5 rounded-lg bg-brand-50 text-brand-600">
                            <Tag className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-semibold text-slate-900 text-sm">{cat.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 max-w-sm truncate">
                        {cat.description || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-800">
                        {cat.productCount}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {cat.totalStock.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant="success">Active</Badge>
                      </td>
                      {isManager && (
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setDeleteTarget(cat)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* New Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Add Product Category</h3>
            <p className="text-xs text-slate-500 mb-5">
              Categories group materials and finished goods across reporting and stock flows.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="e.g. Raw Materials"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Description
                </label>
                <textarea
                  placeholder="Optional brief description of materials in this category"
                  value={categoryDescription}
                  onChange={(e) => setCategoryDescription(e.target.value)}
                  className="w-full h-20 rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                  Create Category
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Category"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
