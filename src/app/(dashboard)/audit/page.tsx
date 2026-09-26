"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Database,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  AlertTriangle,
  History,
  FileText,
  Boxes,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils/format";

interface AuditLog {
  id: string;
  userId: string | null;
  userName: string;
  action: string;
  entity: string;
  entityId: string | null;
  oldValue: string | null;
  newValue: string | null;
  timestamp: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedAction, setSelectedAction] = useState("ALL");
  const [selectedEntity, setSelectedEntity] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "25",
      });
      if (search) params.append("search", search);
      if (selectedAction !== "ALL") params.append("action", selectedAction);
      if (selectedEntity !== "ALL") params.append("entity", selectedEntity);

      const res = await fetch(`/api/audit?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to load audit logs", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedAction, selectedEntity]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const getActionBadge = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("VALIDATE") || act.includes("APPROVE")) {
      return (
        <Badge variant="success" className="font-mono text-[11px]">
          {action}
        </Badge>
      );
    }
    if (act.includes("ADJUST") || act.includes("CHANGE")) {
      return (
        <Badge variant="warning" className="font-mono text-[11px]">
          {action}
        </Badge>
      );
    }
    if (act.includes("DELETE") || act.includes("CANCEL") || act.includes("REMOVE")) {
      return (
        <Badge variant="danger" className="font-mono text-[11px]">
          {action}
        </Badge>
      );
    }
    if (act.includes("CREATE")) {
      return (
        <Badge variant="info" className="font-mono text-[11px]">
          {action}
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="font-mono text-[11px]">
        {action}
      </Badge>
    );
  };

  const formatJsonPreview = (val: string | null) => {
    if (!val) return "—";
    try {
      const parsed = JSON.parse(val);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return val;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-slate-900 text-white shadow-xs">
              <History className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Audit Logs</h1>
              <p className="text-xs text-slate-500 font-medium">
                Immutable, traceable record of all warehouse operations, validations, and inventory modifications
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLogs()}
            disabled={loading}
            className="text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center space-x-3">
            <div className="p-3 bg-brand-50 text-brand-600 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Audited Events</p>
              <h3 className="text-xl font-bold text-slate-900">{total}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center space-x-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Validations & Approvals</p>
              <h3 className="text-xl font-bold text-slate-900">
                {logs.filter((l) => l.action.includes("VALIDATE")).length} (Page)
              </h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center space-x-3">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Stock Adjustments</p>
              <h3 className="text-xl font-bold text-slate-900">
                {logs.filter((l) => l.action.includes("ADJUST")).length} (Page)
              </h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center space-x-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Integrity Verification</p>
              <h3 className="text-sm font-semibold text-emerald-600 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-500 inline" />
                Audit Trail Active
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-slate-200 shadow-xs">
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search user, action, entity, document ref..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedAction}
                onChange={(e) => {
                  setSelectedAction(e.target.value);
                  setPage(1);
                }}
                className="h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500"
              >
                <option value="ALL">All Actions</option>
                <option value="VALIDATE_RECEIPT">Receipt Validation</option>
                <option value="VALIDATE_DELIVERY">Delivery Validation</option>
                <option value="VALIDATE_TRANSFER">Transfer Validation</option>
                <option value="ADJUST_STOCK">Stock Adjustment</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
              </select>

              <select
                value={selectedEntity}
                onChange={(e) => {
                  setSelectedEntity(e.target.value);
                  setPage(1);
                }}
                className="h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-500"
              >
                <option value="ALL">All Entities</option>
                <option value="Receipt">Receipt</option>
                <option value="DeliveryOrder">Delivery Order</option>
                <option value="InternalTransfer">Internal Transfer</option>
                <option value="InventoryAdjustment">Inventory Adjustment</option>
                <option value="Product">Product</option>
                <option value="Location">Location</option>
                <option value="Warehouse">Warehouse</option>
                <option value="ReorderRule">Reorder Rule</option>
                <option value="User">User</option>
              </select>

              <Button type="submit" size="sm" className="h-9 text-xs">
                Filter
              </Button>

              {(search || selectedAction !== "ALL" || selectedEntity !== "ALL") && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setSelectedAction("ALL");
                    setSelectedEntity("ALL");
                    setPage(1);
                  }}
                  className="h-9 text-xs text-slate-500 hover:text-slate-800"
                >
                  Reset
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Reference ID</th>
                <th className="py-3 px-4">Changes / Details</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-brand-600" />
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <History className="w-8 h-8 mx-auto mb-2 text-slate-400 stroke-1" />
                    <p className="font-medium text-slate-700">No audit log records found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Perform inventory operations to generate auditable records.
                    </p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">
                          {log.userName ? log.userName.charAt(0).toUpperCase() : "U"}
                        </div>
                        <span className="font-medium text-slate-900">{log.userName || "System"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                        {log.entity}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-600">
                      {log.entityId ? log.entityId : "—"}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-500 font-mono text-[11px]">
                      {log.newValue ? log.newValue.slice(0, 60) + (log.newValue.length > 60 ? "..." : "") : "—"}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                        className="h-7 px-2 text-xs text-slate-600 hover:text-brand-600"
                        title="View Full Audit Detail"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Details
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50">
          <div className="text-xs text-slate-500">
            Showing Page <span className="font-semibold text-slate-700">{page}</span> of{" "}
            <span className="font-semibold text-slate-700">{totalPages}</span> ({total} total logs)
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="h-8 px-2.5 text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="h-8 px-2.5 text-xs"
            >
              Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-brand-600" />
                <h3 className="font-bold text-sm text-slate-900">Audit Record Details</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedLog(null)}
                className="h-7 w-7 p-0 rounded-full text-slate-400 hover:text-slate-700"
              >
                ✕
              </Button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                <div>
                  <span className="text-[11px] text-slate-400 font-semibold block uppercase">Action</span>
                  <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-semibold block uppercase">Entity</span>
                  <span className="font-medium text-slate-800">{selectedLog.entity}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-semibold block uppercase">Entity Ref ID</span>
                  <span className="font-mono text-slate-800">{selectedLog.entityId || "—"}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-semibold block uppercase">User</span>
                  <span className="font-medium text-slate-800">{selectedLog.userName}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[11px] text-slate-400 font-semibold block uppercase">Timestamp</span>
                  <span className="font-mono text-slate-800">{formatDate(selectedLog.timestamp)}</span>
                </div>
              </div>

              {selectedLog.oldValue && (
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Previous State (Old Value)
                  </span>
                  <pre className="p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto max-h-48">
                    {formatJsonPreview(selectedLog.oldValue)}
                  </pre>
                </div>
              )}

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Recorded Change (New Value)
                </span>
                <pre className="p-3 rounded-lg bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-60">
                  {formatJsonPreview(selectedLog.newValue)}
                </pre>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/50 flex justify-end">
              <Button size="sm" onClick={() => setSelectedLog(null)} className="text-xs">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
