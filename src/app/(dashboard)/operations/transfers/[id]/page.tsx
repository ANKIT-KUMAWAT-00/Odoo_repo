"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRightLeft,
  Building2,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  Printer,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useToast } from "@/components/ui/toast";
import { formatDate, formatDateTime } from "@/lib/utils/format";

export default function TransferDetailPage() {
  const { id } = useParams();
  const [transfer, setTransfer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const toast = useToast();

  const fetchTransfer = async () => {
    try {
      const res = await fetch(`/api/operations/transfers/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTransfer(data.transfer);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchTransfer();
  }, [id]);

  const handleValidate = async () => {
    setIsConfirmOpen(false);
    setIsValidating(true);
    try {
      const res = await fetch(`/api/operations/transfers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "VALIDATE" }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error("Transfer Failed", data.error);
      } else {
        toast.success(
          "Transfer Completed Successfully",
          "Updated source and destination locations. Company total stock remained unchanged."
        );
        fetchTransfer();
      }
    } catch {
      toast.error("Error", "Network error during transfer validation.");
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

  if (!transfer) {
    return (
      <div className="p-8 text-center text-slate-500">
        Transfer not found. <Link href="/operations/transfers" className="text-brand-600 underline">Return</Link>
      </div>
    );
  }

  const isDone = transfer.status === "DONE";
  const canValidate = transfer.status !== "DONE" && transfer.status !== "CANCELED";

  const stages = [
    { label: "Draft", active: true },
    { label: "Ready", active: transfer.status !== "DRAFT" },
    { label: "In Transit", active: transfer.status === "IN_PROGRESS" || isDone },
    { label: "Completed", active: isDone },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div className="flex items-center space-x-3">
          <Link href="/operations/transfers">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                {transfer.transferNumber}
              </h1>
              {isDone ? (
                <Badge variant="success">Transferred & Completed</Badge>
              ) : (
                <Badge variant="warning">{transfer.status}</Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Scheduled Date: {formatDate(transfer.scheduledDate)} • Created: {formatDate(transfer.createdAt)}
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
            <Printer className="w-3.5 h-3.5 mr-1.5" /> Print Transfer Slip
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
              Execute & Validate Transfer
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

      {/* Origin -> Destination Route Banner */}
      <Card className="overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-slate-50 via-white to-brand-50/20 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* From */}
          <div className="flex-1 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Source (Origin)</span>
            <div className="flex items-center text-base font-bold text-slate-900">
              <Building2 className="w-4 h-4 text-slate-400 mr-2" />
              <span>{transfer.sourceWarehouse?.name}</span>
            </div>
            <div className="flex items-center text-xs text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
              <span>Rack: <strong>{transfer.sourceLocation?.name}</strong></span>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center justify-center px-4">
            <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center shadow-xs">
              <ArrowRight className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold text-brand-700 mt-1">Net stock: Unchanged</span>
          </div>

          {/* To */}
          <div className="flex-1 space-y-1 text-left md:text-right">
            <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider block">Target (Destination)</span>
            <div className="flex items-center md:justify-end text-base font-bold text-slate-900">
              <Building2 className="w-4 h-4 text-brand-600 mr-2" />
              <span>{transfer.destinationWarehouse?.name}</span>
            </div>
            <div className="flex items-center md:justify-end text-xs text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-brand-500 mr-1.5" />
              <span>Rack: <strong>{transfer.destinationLocation?.name}</strong></span>
            </div>
          </div>
        </div>
      </Card>

      {transfer.notes && (
        <Card className="p-4 bg-slate-50/70 border border-slate-200 text-xs">
          <span className="font-semibold text-slate-700 block mb-0.5">Transfer Notes:</span>
          <p className="text-slate-600">{transfer.notes}</p>
        </Card>
      )}

      {/* Items Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Transferred Line Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Product Name</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3 text-right">Relocation Quantity</th>
                  <th className="py-2.5 px-3 text-center">Unit</th>
                  <th className="py-2.5 px-3 text-right">Ledger Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transfer.items?.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <Link href={`/products/${item.productId}`} className="hover:text-brand-600 underline-offset-2 hover:underline">
                        {item.product?.name}
                      </Link>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500 font-medium">{item.product?.sku}</td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      {item.quantity.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-500 font-mono">{item.unit}</td>
                    <td className="py-3 px-3 text-right">
                      {isDone ? (
                        <span className="text-emerald-600 font-semibold">Ledger Recorded</span>
                      ) : (
                        <span className="text-slate-400">Pending Execution</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Execute Internal Stock Transfer"
        description={`Execute transfer "${transfer.transferNumber}"? Quantity will be deducted from "${transfer.sourceLocation?.name}" and added to "${transfer.destinationLocation?.name}". Total company inventory will remain unchanged, and a verified ledger movement will be created.`}
        confirmLabel="Execute Transfer"
        variant="primary"
        onConfirm={handleValidate}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
}
