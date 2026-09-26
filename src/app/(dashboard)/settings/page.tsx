"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Building,
  Sliders,
  Bell,
  Users,
  Save,
  CheckCircle2,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils/format";

export default function SettingsPage() {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<"general" | "inventory" | "notifications" | "users">("general");
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string; warehouseId: string }[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Settings State
  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [currency, setCurrency] = useState("USD ($)");
  const [timezone, setTimezone] = useState("America/New_York");
  const [defaultWarehouseId, setDefaultWarehouseId] = useState("");
  const [defaultLocationId, setDefaultLocationId] = useState("");
  const [allowNegativeStock, setAllowNegativeStock] = useState(false);
  const [automaticReorderAlerts, setAutomaticReorderAlerts] = useState(true);
  const [notifyLowStock, setNotifyLowStock] = useState(true);
  const [notifyDeliveries, setNotifyDeliveries] = useState(true);
  const [notifyReceipts, setNotifyReceipts] = useState(true);
  const [notifyTransfers, setNotifyTransfers] = useState(true);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [settingsRes, whRes, locRes] = await Promise.all([
          fetch("/api/settings"),
          fetch("/api/warehouses"),
          fetch("/api/locations"),
        ]);

        if (settingsRes.ok) {
          const sData = await settingsRes.json();
          const s = sData.setting;
          setCompanyName(s.companyName || "");
          setCompanyEmail(s.companyEmail || "");
          setCurrency(s.currency || "USD ($)");
          setTimezone(s.timezone || "UTC");
          setDefaultWarehouseId(s.defaultWarehouseId || "");
          setDefaultLocationId(s.defaultLocationId || "");
          setAllowNegativeStock(s.allowNegativeStock || false);
          setAutomaticReorderAlerts(s.automaticReorderAlerts || true);
          setNotifyLowStock(s.notifyLowStock || true);
          setNotifyDeliveries(s.notifyDeliveries || true);
          setNotifyReceipts(s.notifyReceipts || true);
          setNotifyTransfers(s.notifyTransfers || true);

          setUsers(sData.users || []);
        }

        if (whRes.ok) {
          const whData = await whRes.json();
          setWarehouses(whData.warehouses || []);
        }
        if (locRes.ok) {
          const locData = await locRes.json();
          setLocations(locData.locations || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          companyEmail,
          currency,
          timezone,
          defaultWarehouseId,
          defaultLocationId,
          allowNegativeStock,
          automaticReorderAlerts,
          notifyLowStock,
          notifyDeliveries,
          notifyReceipts,
          notifyTransfers,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error("Save Failed", data.error);
      } else {
        toast.success("Settings Saved", "System preferences and inventory constraints updated");
      }
    } catch {
      toast.error("Error", "Network error while saving settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure enterprise parameters, stock policy rules, notifications, and user access roles
          </p>
        </div>
        <Button onClick={handleSave} isLoading={isSaving} size="sm">
          <Save className="w-4 h-4 mr-1.5" />
          Save Changes
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab("general")}
          className={`py-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === "general"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Building className="w-4 h-4" />
          <span>General</span>
        </button>

        <button
          onClick={() => setActiveTab("inventory")}
          className={`py-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === "inventory"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Inventory Policy</span>
        </button>

        <button
          onClick={() => setActiveTab("notifications")}
          className={`py-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === "notifications"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notifications</span>
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`py-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === "users"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Users & RBAC ({users.length})</span>
        </button>
      </div>

      {/* GENERAL TAB */}
      {activeTab === "general" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Organization Profile</CardTitle>
            <CardDescription>Primary company identity, localized currency, and operational timezone</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Company Name
                </label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. StockSense Logistics Ltd."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Operations Email
                </label>
                <Input
                  type="email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  placeholder="e.g. ops@company.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  System Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-300 px-3 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="USD ($)">USD ($)</option>
                  <option value="EUR (€)">EUR (€)</option>
                  <option value="GBP (£)">GBP (£)</option>
                  <option value="CAD ($)">CAD ($)</option>
                  <option value="AUD ($)">AUD ($)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Operational Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-300 px-3 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="America/New_York">Eastern Time (America/New_York)</option>
                  <option value="America/Chicago">Central Time (America/Chicago)</option>
                  <option value="America/Los_Angeles">Pacific Time (America/Los_Angeles)</option>
                  <option value="Europe/London">London (UTC / BST)</option>
                  <option value="Europe/Paris">Central European (CET / CEST)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* INVENTORY POLICY TAB */}
      {activeTab === "inventory" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Stock Engine Policies</CardTitle>
            <CardDescription>Rules governing physical stock mutations, defaults, and negative stock controls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Default Intake Warehouse
                </label>
                <select
                  value={defaultWarehouseId}
                  onChange={(e) => setDefaultWarehouseId(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-300 px-3 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">None Selected</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Default Storage Location
                </label>
                <select
                  value={defaultLocationId}
                  onChange={(e) => setDefaultLocationId(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-300 px-3 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">None Selected</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex items-start space-x-3">
                <input
                  id="negStock"
                  type="checkbox"
                  checked={allowNegativeStock}
                  onChange={(e) => setAllowNegativeStock(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <div>
                  <label htmlFor="negStock" className="text-xs font-bold text-slate-900 cursor-pointer">
                    Allow Negative Inventory Balances
                  </label>
                  <p className="text-xs text-slate-500">
                    When disabled (recommended), the system blocks deliveries and transfers from completing if on-hand physical stock is insufficient.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <input
                  id="reorderAlerts"
                  type="checkbox"
                  checked={automaticReorderAlerts}
                  onChange={(e) => setAutomaticReorderAlerts(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <div>
                  <label htmlFor="reorderAlerts" className="text-xs font-bold text-slate-900 cursor-pointer">
                    Automatic Reorder & Safety Stock Alerts
                  </label>
                  <p className="text-xs text-slate-500">
                    Automatically trigger notifications and dashboard flags whenever available stock reaches reorder levels.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* NOTIFICATIONS TAB */}
      {activeTab === "notifications" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Notification Triggers</CardTitle>
            <CardDescription>Select which operational movements generate real-time alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Low Stock Alerts</span>
                <span className="text-xs text-slate-500">Alert staff when items cross below reorder safety buffers</span>
              </div>
              <input
                type="checkbox"
                checked={notifyLowStock}
                onChange={(e) => setNotifyLowStock(e.target.checked)}
                className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Delivery Order Alerts</span>
                <span className="text-xs text-slate-500">Alert warehouse staff when customer delivery orders are placed</span>
              </div>
              <input
                type="checkbox"
                checked={notifyDeliveries}
                onChange={(e) => setNotifyDeliveries(e.target.checked)}
                className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Inbound Receipt Alerts</span>
                <span className="text-xs text-slate-500">Notify receiving docks when vendor shipments arrive</span>
              </div>
              <input
                type="checkbox"
                checked={notifyReceipts}
                onChange={(e) => setNotifyReceipts(e.target.checked)}
                className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Internal Transfer Alerts</span>
                <span className="text-xs text-slate-500">Notify dispatch and receiving racks when stock is in transit</span>
              </div>
              <input
                type="checkbox"
                checked={notifyTransfers}
                onChange={(e) => setNotifyTransfers(e.target.checked)}
                className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* USERS & ROLES TAB */}
      {activeTab === "users" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Users & Access Control</CardTitle>
            <CardDescription>
              Registered team members and their assigned operational permission tiers
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-3">Email Address</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-3">Phone</th>
                    <th className="py-3 px-4 text-right">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-900 flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-600">
                          {u.name.charAt(0)}
                        </div>
                        <span>{u.name}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-mono">{u.email}</td>
                      <td className="py-3 px-3">
                        {u.role === "INVENTORY_MANAGER" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
                            <ShieldCheck className="w-3 h-3 mr-1 text-brand-600" />
                            Inventory Manager
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            <UserCheck className="w-3 h-3 mr-1 text-slate-600" />
                            Warehouse Staff
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-500">{u.phone || "—"}</td>
                      <td className="py-3 px-4 text-right text-slate-500">{formatDate(u.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
