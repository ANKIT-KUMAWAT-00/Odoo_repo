"use client";

import React from "react";
import { Filter, RotateCcw, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface FilterState {
  docType: string;
  status: string;
  warehouseId: string;
  locationId: string;
  categoryId: string;
  days: number;
}

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onClear: () => void;
  warehouses: { id: string; name: string }[];
  locations: { id: string; name: string; warehouseId: string }[];
  categories: { id: string; name: string }[];
}

export function DashboardFilterBar({
  filters,
  onChange,
  onClear,
  warehouses,
  locations,
  categories,
}: FilterBarProps) {
  const filteredLocations =
    filters.warehouseId && filters.warehouseId !== "ALL"
      ? locations.filter((l) => l.warehouseId === filters.warehouseId)
      : locations;

  const isFiltered =
    filters.docType !== "ALL" ||
    filters.status !== "ALL" ||
    filters.warehouseId !== "ALL" ||
    filters.locationId !== "ALL" ||
    filters.categoryId !== "ALL" ||
    filters.days !== 30;

  return (
    <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center text-slate-500 font-semibold mr-1">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
            Filters:
          </div>

          {/* Doc Type */}
          <div className="relative">
            <select
              value={filters.docType}
              onChange={(e) => onChange({ ...filters, docType: e.target.value })}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 pr-6 appearance-none focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="ALL">All Documents</option>
              <option value="RECEIPTS">Receipts</option>
              <option value="DELIVERIES">Delivery Orders</option>
              <option value="TRANSFERS">Internal Transfers</option>
              <option value="ADJUSTMENTS">Adjustments</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>

          {/* Status */}
          <div className="relative">
            <select
              value={filters.status}
              onChange={(e) => onChange({ ...filters, status: e.target.value })}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 pr-6 appearance-none focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="WAITING">Waiting</option>
              <option value="READY">Ready</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
              <option value="CANCELED">Canceled</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>

          {/* Warehouse */}
          <div className="relative">
            <select
              value={filters.warehouseId}
              onChange={(e) =>
                onChange({ ...filters, warehouseId: e.target.value, locationId: "ALL" })
              }
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 pr-6 appearance-none focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="ALL">All Warehouses</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>

          {/* Location */}
          <div className="relative">
            <select
              value={filters.locationId}
              onChange={(e) => onChange({ ...filters, locationId: e.target.value })}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 pr-6 appearance-none focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="ALL">All Locations</option>
              {filteredLocations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>

          {/* Category */}
          <div className="relative">
            <select
              value={filters.categoryId}
              onChange={(e) => onChange({ ...filters, categoryId: e.target.value })}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 pr-6 appearance-none focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>

          {/* Date range */}
          <div className="relative">
            <select
              value={filters.days}
              onChange={(e) => onChange({ ...filters, days: parseInt(e.target.value, 10) })}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 pr-6 appearance-none focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value={1}>Today</option>
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Right: Clear Filters Button */}
        {isFiltered && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onClear}
            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 px-2.5 font-medium flex items-center"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
}
