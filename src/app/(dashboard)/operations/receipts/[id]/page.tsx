"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  FileDown,
  Building2,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  Printer,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useToast } from "@/components/ui/toast";
import { formatDate, formatDateTime } from "@/lib/utils/format";

export default function ReceiptDetailPage() {
  const { id } = useParams();
  const [receipt, setReceipt] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const toast = useToast();

  const fetchReceipt = async () => {
    try {
      const res = await fetch(`/api/operations/receipts/${id}`);
      if (res.ok) {
        const data = await res.json();
        setReceipt(data.receipt);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchReceipt();
  }, [id]);

  const handleValidate = async () => {
    setIsConfirmOpen(false);
    setIsValidating(true);
    try {
      const res = await fetch(`/api/operations/receipts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "VALIDATE" }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error("Validation Failed", data.error);
      } else {
        toast.success(
          "Receipt Validated Successfully",
          `Stock quantities increased immediately and ledger entry generated.`
        );
        fetchReceipt();
      }
    } catch {
      toast.error("Error", "Network error during validation.");
    } finally {
      setIsValidating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-48" />
        <div className="h-48 bg-slate-200 rounded-2xl" />
        <div className="h-64 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="p-8 text-center text-slate-500">
        Receipt not found. <Link href="/operations/receipts" className="text-brand-600 underline">Return</Link>
      </div>
    );
  }

  const isDone = receipt.status === "DONE";
  const canValidate = receipt.status !== "DONE" && receipt.status !== "CANCELED";

  // Stages for visual timeline
  const stages = [
    { label: "Draft", active: true },
    { label: "Waiting", active: receipt.status !== "DRAFT" },
    { label: "Ready", active: receipt.status === "READY" || isDone },
    { label: "Done", active: isDone },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div className="flex items-center space-x-3">
          <Link href="/operations/receipts">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                {receipt.receiptNumber}
              </h1>
              {isDone ? (
                <Badge variant="success">Validated & Received</Badge>
              ) : (
                <Badge variant="info">{receipt.status}</Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Vendor: <strong className="text-slate-800">{receipt.supplier}</strong> • Created: {formatDate(receipt.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs no-print"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" /> Print
          </Button>

          {canValidate && (
            <Button
              size="sm"
              variant="success"
              onClick={() => setIsConfirmOpen(true)}
              isLoading={isValidating}
              className="text-xs"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Validate Receipt
            </Button>
          )}
        </div>
      </div>

      {/* Visual Timeline */}
      <Card className="p-4 bg-slate-50 border border-slate-200/80">
        <div className="flex items-center justify-between max-w-xl mx-auto">
          {stages.map((stage, idx) => (
            <React.Fragment key={stage.label}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    stage.active
                      ? "bg-brand-600 text-white shadow-xs ring-4 ring-brand-100"
                      : "bg-slate-200 text-slate-400"
                  }`}
                >
                  {stage.active && isDone && idx === 3 ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    idx + 1
                  )}
                </div>
                <span className={`text-[11px] font-semibold mt-1.5 ${stage.active ? "text-slate-900" : "text-slate-400"}`}>
                  {stage.label}
                </span>
              </div>
              {idx < stages.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 -mt-4 transition-colors ${
                    stages[idx + 1].active ? "bg-brand-600" : "bg-slate-200"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </Card>

      {/* Overview Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-4 space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Vendor / Supplier</span>
          <div className="text-base font-bold text-slate-900">{receipt.supplier}</div>
          <div className="text-xs text-slate-500">Scheduled: {formatDate(receipt.expectedDate)}</div>
        </Card>

        <Card className="p-4 space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Receiving Facility</span>
          <div className="flex items-center text-sm font-semibold text-slate-900">
            <Building2 className="w-4 h-4 text-brand-600 mr-1.5" />
            <span>{receipt.warehouse?.name}</span>
          </div>
          <div className="flex items-center text-xs text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
            <span>Target: <strong>{receipt.destinationLocation?.name}</strong></span>
          </div>
        </Card>

        <Card className="p-4 space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Validation Record</span>
          {isDone ? (
            <div>
              <div className="text-xs font-semibold text-emerald-700 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" />
                Validated & Ledger Written
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {formatDateTime(receipt.validatedAt)}
              </div>
            </div>
          ) : (
            <div className="text-xs text-amber-700 font-medium">
              Pending shelf inspection & confirmation
            </div>
          )}
        </Card>
      </div>

      {receipt.notes && (
        <Card className="p-4 bg-slate-50/70 border border-slate-200 text-xs">
          <span className="font-semibold text-slate-700 block mb-0.5">Notes & Instructions:</span>
          <p className="text-slate-600">{receipt.notes}</p>
        </Card>
      )}

      {/* Items Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Inbound Line Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Product Name</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3 text-right">Expected Quantity</th>
                  <th className="py-2.5 px-3 text-right">Received Quantity</th>
                  <th className="py-2.5 px-3 text-center">Unit</th>
                  <th className="py-2.5 px-3">Batch / Lot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receipt.items?.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <Link href={`/products/${item.productId}`} className="hover:text-brand-600 underline-offset-2 hover:underline">
                        {item.product?.name}
                      </Link>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500 font-medium">{item.product?.sku}</td>
                    <td className="py-3 px-3 text-right font-medium text-slate-700">
                      {item.expectedQuantity.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-700">
                      {item.receivedQuantity.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-500 font-mono">{item.unit}</td>
                    <td className="py-3 px-3 font-mono text-slate-600">{item.batchLot || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Validate Inbound Goods Receipt"
        description={`Validate receipt "${receipt.receiptNumber}"? Physical stock in "${receipt.warehouse?.name} / ${receipt.destinationLocation?.name}" will increase immediately, and official stock ledger entries will be generated.`}
        confirmLabel="Confirm & Increase Stock"
        variant="success"
        onConfirm={handleValidate}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
}
