"use client";

import React, { useState, useEffect } from "react";
import { Plus, MapPin, Search, Trash2, Building2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useToast } from "@/components/ui/toast";
import { useUser } from "@/components/layout/UserContext";

interface LocationItem {
  id: string;
  name: string;
  code: string;
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  type: string;
  capacity: number;
  status: string;
  productCount: number;
  totalStock: number;
  totalReserved: number;
  availableStock: number;
  occupancyPercent: number;
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [warehouses, setWarehouses] = useState<{ id: string; name: string; code: string }[]>([]);
  const [search, setSearch] = useState("");
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState("ALL");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [type, setType] = useState("STORAGE");
  const [capacity, setCapacity] = useState("1000");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LocationItem | null>(null);

  const { isManager } = useUser();
  const toast = useToast();

  const fetchLocations = async () => {
    try {
      const res = await fetch("/api/locations");
      if (res.ok) {
        const data = await res.json();
        setLocations(data.locations || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const res = await fetch("/api/warehouses");
      if (res.ok) {
        const data = await res.json();
        setWarehouses(data.warehouses || []);
        if (data.warehouses?.length > 0 && !warehouseId) {
          setWarehouseId(data.warehouses[0].id);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchLocations();
    fetchWarehouses();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !warehouseId) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim(),
          warehouseId,
          type,
          capacity: parseInt(capacity, 10) || 1000,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error("Error", data.error || "Failed to create location");
      } else {
        toast.success("Location Created", `Storage zone "${name}" ready`);
        setIsModalOpen(false);
        setName("");
        setCode("");
        fetchLocations();
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
      const res = await fetch(`/api/locations?id=${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Cannot Delete", data.error);
      } else {
        toast.success("Deleted", `Location "${deleteTarget.name}" was removed`);
        setDeleteTarget(null);
        fetchLocations();
      }
    } catch {
      toast.error("Error", "Failed to delete location");
    }
  };

  const filtered = locations.filter((loc) => {
    const matchesSearch =
      loc.name.toLowerCase().includes(search.toLowerCase()) ||
      loc.code.toLowerCase().includes(search.toLowerCase()) ||
      loc.warehouseName.toLowerCase().includes(search.toLowerCase());
    const matchesWarehouse = selectedWarehouseFilter === "ALL" || loc.warehouseId === selectedWarehouseFilter;
    const matchesType = selectedTypeFilter === "ALL" || loc.type === selectedTypeFilter;
    return matchesSearch && matchesWarehouse && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Locations & Zones</h1>
          <p className="text-xs text-slate-500 mt-1">
            Fine-grained storage racks, picking shelves, receiving docks, and transit points
          </p>
        </div>
        {isManager && (
          <Button onClick={() => setIsModalOpen(true)} className="h-9 text-xs">
            <Plus className="w-4 h-4 mr-1.5" />
            Add Location
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <Input
              placeholder="Search location or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8 text-xs"
            />
          </div>

          <select
            value={selectedWarehouseFilter}
            onChange={(e) => setSelectedWarehouseFilter(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>

          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Types</option>
            <option value="STORAGE">Storage</option>
            <option value="RECEIVING">Receiving</option>
            <option value="PRODUCTION">Production</option>
            <option value="DISPATCH">Dispatch</option>
            <option value="DAMAGED">Damaged</option>
            <option value="TRANSIT">Transit</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-900">{filtered.length}</span> locations
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Location Name</th>
                  <th className="py-3 px-3">Code</th>
                  <th className="py-3 px-3">Warehouse</th>
                  <th className="py-3 px-3">Zone Type</th>
                  <th className="py-3 px-3 text-right">Capacity</th>
                  <th className="py-3 px-3 text-right">Total Units</th>
                  <th className="py-3 px-3 text-right">Available</th>
                  <th className="py-3 px-3">Occupancy</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  {isManager && <th className="py-3 px-4 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-28" /></td>
                      <td className="py-4 px-3"><div className="h-4 bg-slate-100 rounded w-16" /></td>
                      <td className="py-4 px-3"><div className="h-4 bg-slate-200 rounded w-24" /></td>
                      <td className="py-4 px-3"><div className="h-4 bg-slate-100 rounded w-16" /></td>
                      <td className="py-4 px-3 text-right"><div className="h-4 bg-slate-100 rounded w-12 ml-auto" /></td>
                      <td className="py-4 px-3 text-right"><div className="h-4 bg-slate-200 rounded w-12 ml-auto" /></td>
                      <td className="py-4 px-3 text-right"><div className="h-4 bg-slate-200 rounded w-12 ml-auto" /></td>
                      <td className="py-4 px-3"><div className="h-4 bg-slate-100 rounded w-20" /></td>
                      <td className="py-4 px-3 text-center"><div className="h-4 bg-slate-100 rounded w-12 mx-auto" /></td>
                      {isManager && <td className="py-4 px-4 text-right"><div className="h-4 bg-slate-100 rounded w-6 ml-auto" /></td>}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      No locations found matching your filter criteria
                    </td>
                  </tr>
                ) : (
                  filtered.map((loc) => (
                    <tr key={loc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900 flex items-center space-x-2">
                        <MapPin className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
                        <span>{loc.name}</span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500 font-semibold">{loc.code}</td>
                      <td className="py-3 px-3 text-slate-700">
                        <div className="font-medium">{loc.warehouseName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{loc.warehouseCode}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {loc.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600 font-medium">
                        {loc.capacity.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {loc.totalStock.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-emerald-700">
                        {loc.availableStock.toLocaleString()}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                loc.occupancyPercent > 80 ? "bg-rose-500" : "bg-brand-600"
                              }`}
                              style={{ width: `${loc.occupancyPercent}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium">{loc.occupancyPercent}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge variant="success">Active</Badge>
                      </td>
                      {isManager && (
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setDeleteTarget(loc)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete location"
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

      {/* New Location Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Add Location / Zone</h3>
            <p className="text-xs text-slate-500 mb-5">
              Define a specific bin, shelf, rack or operational zone inside a warehouse.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Parent Warehouse <span className="text-rose-500">*</span>
                </label>
                <select
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-300 px-3 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Location Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="e.g. Rack D"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Location Code <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="e.g. LOC-RD"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Zone Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full h-9 rounded-lg border border-slate-300 px-3 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="STORAGE">Storage</option>
                    <option value="RECEIVING">Receiving</option>
                    <option value="PRODUCTION">Production</option>
                    <option value="DISPATCH">Dispatch</option>
                    <option value="DAMAGED">Damaged</option>
                    <option value="TRANSIT">Transit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Capacity (Units)
                  </label>
                  <Input
                    type="number"
                    placeholder="1000"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                  />
                </div>
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
                  Create Location
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Location"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? You can only delete locations that have 0 stored inventory.`}
        confirmLabel="Delete Location"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
