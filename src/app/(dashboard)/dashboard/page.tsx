"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, RefreshCw, FileDown, Truck, ArrowRightLeft, SlidersHorizontal, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KpiCards, KpiData } from "@/components/dashboard/KpiCards";
import { StockMovementChart } from "@/components/dashboard/StockMovementChart";
import { CategoryDistributionChart } from "@/components/dashboard/CategoryDistributionChart";
import { WarehouseDistributionChart } from "@/components/dashboard/WarehouseDistributionChart";
import { LowStockTable } from "@/components/dashboard/LowStockTable";
import { RecentOperationsTable } from "@/components/dashboard/RecentOperationsTable";
import { DashboardFilterBar, FilterState } from "@/components/dashboard/DashboardFilterBar";
import { useWarehouse } from "@/components/layout/WarehouseContext";
import { useUser } from "@/components/layout/UserContext";

export default function DashboardPage() {
  const { selectedWarehouseId } = useWarehouse();
  const { user } = useUser();

  const [filters, setFilters] = useState<FilterState>({
    docType: "ALL",
    status: "ALL",
    warehouseId: "ALL",
    locationId: "ALL",
    categoryId: "ALL",
    days: 30,
  });

  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string; warehouseId: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [kpis, setKpis] = useState<KpiData>({
    totalStockQuantity: 0,
    activeProductsCount: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    pendingReceiptsCount: 0,
    pendingDeliveriesCount: 0,
    activeTransfersCount: 0,
  });

  const [stockMovementSeries, setStockMovementSeries] = useState<any[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<any[]>([]);
  const [warehouseDistribution, setWarehouseDistribution] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [recentOperations, setRecentOperations] = useState<any[]>([]);

  // Sync warehouse from header selector if changed
  useEffect(() => {
    if (selectedWarehouseId !== filters.warehouseId) {
      setFilters((prev) => ({ ...prev, warehouseId: selectedWarehouseId }));
    }
  }, [selectedWarehouseId]);

  // Fetch filter metadata (warehouses, locations, categories)
  useEffect(() => {
    async function loadMeta() {
      try {
        const [whRes, locRes, catRes] = await Promise.all([
          fetch("/api/warehouses"),
          fetch("/api/locations"),
          fetch("/api/categories"),
        ]);
        if (whRes.ok) {
          const whData = await whRes.json();
          setWarehouses(whData.warehouses || []);
        }
        if (locRes.ok) {
          const locData = await locRes.json();
          setLocations(locData.locations || []);
        }
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData.categories || []);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadMeta();
  }, []);

  // Fetch dynamic dashboard data
  const fetchDashboardData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (filters.warehouseId !== "ALL") params.append("warehouseId", filters.warehouseId);
      if (filters.locationId !== "ALL") params.append("locationId", filters.locationId);
      if (filters.categoryId !== "ALL") params.append("categoryId", filters.categoryId);
      if (filters.docType !== "ALL") params.append("docType", filters.docType);
      if (filters.status !== "ALL") params.append("status", filters.status);
      params.append("days", filters.days.toString());

      const res = await fetch(`/api/dashboard?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setKpis(data.kpis);
        setStockMovementSeries(data.stockMovementSeries || []);
        setCategoryDistribution(data.categoryDistribution || []);
        setWarehouseDistribution(data.warehouseDistribution || []);
        setLowStockProducts(data.lowStockProducts || []);
        setRecentOperations(data.recentOperations || []);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleClearFilters = () => {
    setFilters({
      docType: "ALL",
      status: "ALL",
      warehouseId: "ALL",
      locationId: "ALL",
      categoryId: "ALL",
      days: 30,
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Operational Overview
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-brand-50 text-brand-700 border border-brand-200 flex items-center">
              <Sparkles className="w-3 h-3 mr-1 text-brand-600" /> Real-time Stock
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Centralized inventory visibility, operational movement velocity, and threshold monitoring
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchDashboardData(true)}
            isLoading={isRefreshing}
            className="h-9 px-3"
            title="Refresh dashboard data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>

          <Link href="/operations/receipts/new">
            <Button size="sm" variant="outline" className="h-9 text-xs">
              <FileDown className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              Receive Goods
            </Button>
          </Link>

          <Link href="/operations/deliveries/new">
            <Button size="sm" variant="outline" className="h-9 text-xs">
              <Truck className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
              New Delivery
            </Button>
          </Link>

          <Link href="/operations/transfers/new">
            <Button size="sm" variant="outline" className="h-9 text-xs">
              <ArrowRightLeft className="w-3.5 h-3.5 mr-1.5 text-purple-600" />
              Transfer
            </Button>
          </Link>

          <Link href="/operations/adjustments/new">
            <Button size="sm" className="h-9 text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
              Adjust Stock
            </Button>
          </Link>
        </div>
      </div>

      {/* Dynamic Filters Bar */}
      <DashboardFilterBar
        filters={filters}
        onChange={setFilters}
        onClear={handleClearFilters}
        warehouses={warehouses}
        locations={locations}
        categories={categories}
      />

      {/* KPI Cards */}
      <KpiCards kpis={kpis} isLoading={isLoading} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Stock Movement Velocity Chart */}
        <StockMovementChart
          data={stockMovementSeries}
          days={filters.days}
          onDaysChange={(d) => setFilters((prev) => ({ ...prev, days: d }))}
        />

        {/* Inventory by Category */}
        <CategoryDistributionChart data={categoryDistribution} />
      </div>

      {/* Warehouse Distribution & Low Stock Alert Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <WarehouseDistributionChart data={warehouseDistribution} />
        <LowStockTable products={lowStockProducts} />
      </div>

      {/* Recent Operations Unified Table */}
      <RecentOperationsTable operations={recentOperations} />
    </div>
  );
}
