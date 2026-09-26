"use client";

import React from "react";
import { Building2, ChevronDown } from "lucide-react";
import { useWarehouse } from "./WarehouseContext";

export function WarehouseSelector() {
  const { selectedWarehouseId, setSelectedWarehouseId, warehouses } = useWarehouse();

  return (
    <div className="relative inline-flex items-center">
      <div className="flex items-center space-x-2 bg-slate-100/80 hover:bg-slate-200/70 border border-slate-200/80 rounded-lg px-2.5 py-1.5 transition-colors">
        <Building2 className="w-4 h-4 text-brand-600 flex-shrink-0" />
        <select
          value={selectedWarehouseId}
          onChange={(e) => setSelectedWarehouseId(e.target.value)}
          className="bg-transparent text-xs font-medium text-slate-800 focus:outline-none cursor-pointer pr-4 appearance-none"
        >
          <option value="ALL">All Warehouses (Global)</option>
          {warehouses.map((wh) => (
            <option key={wh.id} value={wh.id}>
              {wh.name} ({wh.code})
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5" />
      </div>
    </div>
  );
}
