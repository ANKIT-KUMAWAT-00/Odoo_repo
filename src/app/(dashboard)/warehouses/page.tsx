"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Building2, MapPin, User, Phone, Package, ArrowRight, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useUser } from "@/components/layout/UserContext";

interface WarehouseItem {
  id: string;
  name: string;
  code: string;
  address?: string;
  manager?: string;
  contact?: string;
  status: string;
  locationCount: number;
  productCount: number;
  totalStock: number;
  pendingIncoming: number;
  pendingOutgoing: number;
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");
  const [manager, setManager] = useState("");
  const [contact, setContact] = useState("");

  const { isManager } = useUser();
  const toast = useToast();

  const fetchWarehouses = async () => {
    try {
      const res = await fetch("/api/warehouses");
      if (res.ok) {
        const data = await res.json();
        setWarehouses(data.warehouses || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/warehouses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim(),
          address: address.trim(),
          manager: manager.trim(),
          contact: contact.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error("Error", data.error || "Failed to create warehouse");
      } else {
        toast.success("Warehouse Created", `Facility "${name}" created with default storage racks`);
        setIsModalOpen(false);
        setName("");
        setCode("");
        setAddress("");
        setManager("");
        setContact("");
        fetchWarehouses();
      }
    } catch {
      toast.error("Error", "Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Warehouses</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage physical distribution centers, hubs, and internal storage facilities
          </p>
        </div>
        {isManager && (
          <Button onClick={() => setIsModalOpen(true)} className="h-9 text-xs">
            <Plus className="w-4 h-4 mr-1.5" />
            Add Warehouse
          </Button>
        )}
      </div>

      {/* Grid of Warehouses */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-5 bg-slate-200 rounded w-36 mb-3" />
              <div className="h-4 bg-slate-100 rounded w-24 mb-6" />
              <div className="space-y-2">
                <div className="h-3 bg-slate-100 rounded w-full" />
                <div className="h-3 bg-slate-100 rounded w-3/4" />
              </div>
            </Card>
          ))
        ) : (
          warehouses.map((wh) => (
            <Card key={wh.id} className="hover:shadow-md transition-all flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-brand-50 text-brand-600 border border-brand-100">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900">{wh.name}</CardTitle>
                      <span className="text-[11px] font-mono text-slate-400 font-semibold">{wh.code}</span>
                    </div>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Address & Manager */}
                <div className="text-xs space-y-1.5 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {wh.address && (
                    <div className="flex items-center text-slate-600 truncate">
                      <MapPin className="w-3.5 h-3.5 mr-2 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{wh.address}</span>
                    </div>
                  )}
                  {wh.manager && (
                    <div className="flex items-center text-slate-600">
                      <User className="w-3.5 h-3.5 mr-2 text-slate-400 flex-shrink-0" />
                      <span>Manager: <strong className="text-slate-800">{wh.manager}</strong></span>
                    </div>
                  )}
                  {wh.contact && (
                    <div className="flex items-center text-slate-600">
                      <Phone className="w-3.5 h-3.5 mr-2 text-slate-400 flex-shrink-0" />
                      <span>{wh.contact}</span>
                    </div>
                  )}
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-100">
                  <div className="p-2 rounded-lg bg-slate-50">
                    <span className="block text-[10px] uppercase font-semibold text-slate-400">Locations</span>
                    <span className="text-sm font-bold text-slate-800">{wh.locationCount}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50">
                    <span className="block text-[10px] uppercase font-semibold text-slate-400">Products</span>
                    <span className="text-sm font-bold text-slate-800">{wh.productCount}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50">
                    <span className="block text-[10px] uppercase font-semibold text-slate-400">Total Stock</span>
                    <span className="text-sm font-bold text-brand-600">{wh.totalStock.toLocaleString()}</span>
                  </div>
                </div>

                {/* Pending In/Out Badges */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span className="flex items-center text-emerald-700">
                    <ArrowDownLeft className="w-3 h-3 mr-1 text-emerald-600" />
                    {wh.pendingIncoming} Pending Inbound
                  </span>
                  <span className="flex items-center text-blue-700">
                    <ArrowUpRight className="w-3 h-3 mr-1 text-blue-600" />
                    {wh.pendingOutgoing} Pending Outbound
                  </span>
                </div>

                {/* View Details Link */}
                <div className="pt-2">
                  <Link href={`/warehouses/${wh.id}`}>
                    <Button variant="outline" size="sm" className="w-full text-xs font-semibold h-8">
                      View Facility Details <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* New Warehouse Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Add Warehouse Facility</h3>
            <p className="text-xs text-slate-500 mb-5">
              Create a new physical warehouse or storage depot.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Warehouse Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="e.g. West Coast Distribution"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Warehouse Code <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="e.g. WH-WEST"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Physical Address
                </label>
                <Input
                  placeholder="e.g. 500 Pacific Way, Oakland, CA"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Facility Manager
                  </label>
                  <Input
                    placeholder="e.g. Marcus Ray"
                    value={manager}
                    onChange={(e) => setManager(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Phone / Contact
                  </label>
                  <Input
                    placeholder="+1 (555) 000-0000"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
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
                  Create Warehouse
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
