"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Truck,
  Building2,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  Printer,
  PackageCheck,
  ClipboardList,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useToast } from "@/components/ui/toast";
import { formatDate, formatDateTime } from "@/lib/utils/format";

export default function DeliveryDetailPage() {
  const { id } = useParams();
  const [delivery, setDelivery] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Pick quantities state
  const [pickedMap, setPickedMap] = useState<Record<string, number>>({});

  const toast = useToast();

  const fetchDelivery = async () => {
    try {
      const res = await fetch(`/api/operations/deliveries/${id}`);
      if (res.ok) {
        const data = await res.json();
        setDelivery(data.delivery);

        // Initialize picked quantities
        const initialPicked: Record<string, number> = {};
        data.delivery.items.forEach((item: any) => {
          initialPicked[item.id] = item.pickedQuantity || item.requestedQuantity;
        });
        setPickedMap(initialPicked);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDelivery();
  }, [id]);

  const handleStepAction = async (action: "PICK" | "PACK" | "VALIDATE") => {
    setIsConfirmOpen(false);
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/operations/deliveries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          pickedQuantities: pickedMap,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error("Operation Failed", data.error);
      } else {
        if (action === "PICK") {
          toast.success("Items Picked", "Order items marked as physically picked from shelves");
        } else if (action === "PACK") {
          toast.success("Packing Complete", "Items verified, boxed, and staged for dispatch");
        } else if (action === "VALIDATE") {
          toast.success(
            "Delivery Validated & Shipped",
            "Inventory decreased immediately and stock ledger recorded."
          );
        }
        fetchDelivery();
      }
    } catch {
      toast.error("Error", "Network error while processing delivery step.");
    } finally {
      setIsProcessing(false);
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

  if (!delivery) {
    return (
      <div className="p-8 text-center text-slate-500">
        Delivery order not found. <Link href="/operations/deliveries" className="text-brand-600 underline">Return</Link>
      </div>
    );
  }

  const isDone = delivery.status === "DONE";
  const isDraftOrReady = delivery.status === "DRAFT" || delivery.status === "READY" || delivery.status === "WAITING";
  const isPicking = delivery.status === "PICKING";
  const isPacking = delivery.status === "PACKING";

  // Stages for visual delivery flow
  const stages = [
    { label: "1. Order Placed", active: true },
    { label: "2. Picking", active: isPicking || isPacking || isDone },
    { label: "3. Packing", active: isPacking || isDone },
    { label: "4. Shipped & Done", active: isDone },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div className="flex items-center space-x-3">
          <Link href="/operations/deliveries">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                {delivery.deliveryNumber}
              </h1>
              {isDone ? (
                <Badge variant="success">Dispatched & Done</Badge>
              ) : isPacking ? (
                <Badge variant="info">Packing Stage</Badge>
              ) : isPicking ? (
                <Badge variant="warning">Picking Stage</Badge>
              ) : (
                <Badge variant="secondary">{delivery.status}</Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Customer: <strong className="text-slate-800">{delivery.customer}</strong> • Target Date: {formatDate(delivery.deliveryDate)}
            </p>
          </div>
        </div>

        {/* Workflow Action Buttons */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs no-print"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" /> Print Picking Slip
          </Button>

          {isDraftOrReady && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStepAction("PICK")}
              isLoading={isProcessing}
              className="text-xs"
            >
              <ClipboardList className="w-3.5 h-3.5 mr-1.5 text-brand-600" />
              Step 1: Start Picking
            </Button>
          )}

          {isPicking && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStepAction("PACK")}
              isLoading={isProcessing}
              className="text-xs"
            >
              <PackageCheck className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
              Step 2: Complete Packing
            </Button>
          )}

          {isPacking && (
            <Button
              size="sm"
              variant="success"
              onClick={() => setIsConfirmOpen(true)}
              isLoading={isProcessing}
              className="text-xs"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Step 3: Validate & Dispatch
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
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer Destination</span>
          <div className="text-base font-bold text-slate-900">{delivery.customer}</div>
          <div className="text-xs text-slate-500">Scheduled: {formatDate(delivery.deliveryDate)}</div>
        </Card>

        <Card className="p-4 space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Originating Storage</span>
          <div className="flex items-center text-sm font-semibold text-slate-900">
            <Building2 className="w-4 h-4 text-brand-600 mr-1.5" />
            <span>{delivery.warehouse?.name}</span>
          </div>
          <div className="flex items-center text-xs text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
            <span>Shelf / Rack: <strong>{delivery.sourceLocation?.name}</strong></span>
          </div>
        </Card>

        <Card className="p-4 space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fulfillment Status</span>
          {isDone ? (
            <div>
              <div className="text-xs font-semibold text-emerald-700 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" />
                Dispatched & Stock Decreased
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {formatDateTime(delivery.validatedAt)}
              </div>
            </div>
          ) : (
            <div className="text-xs text-blue-700 font-medium">
              Current Step: {isPacking ? "Packing verification" : isPicking ? "Warehouse floor picking" : "Pending picking"}
            </div>
          )}
        </Card>
      </div>

      {delivery.notes && (
        <Card className="p-4 bg-slate-50/70 border border-slate-200 text-xs">
          <span className="font-semibold text-slate-700 block mb-0.5">Shipping Instructions:</span>
          <p className="text-slate-600">{delivery.notes}</p>
        </Card>
      )}

      {/* Items Table with Pick/Pack Inputs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Outbound Line Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Product Name</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3 text-right">Location Available</th>
                  <th className="py-2.5 px-3 text-right">Requested Qty</th>
                  <th className="py-2.5 px-3 text-right w-36">Picked Qty</th>
                  <th className="py-2.5 px-3 text-center">Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {delivery.items?.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <Link href={`/products/${item.productId}`} className="hover:text-brand-600 underline-offset-2 hover:underline">
                        {item.productName}
                      </Link>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500 font-medium">{item.sku}</td>
                    <td className="py-3 px-3 text-right text-slate-600">
                      {item.locationOnHand} {item.unit}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      {item.requestedQuantity.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {isDone ? (
                        <span className="font-bold text-emerald-700">{item.pickedQuantity}</span>
                      ) : (
                        <input
                          type="number"
                          min="0"
                          max={item.requestedQuantity}
                          value={pickedMap[item.id] ?? item.pickedQuantity}
                          onChange={(e) =>
                            setPickedMap({
                              ...pickedMap,
                              [item.id]: parseInt(e.target.value, 10) || 0,
                            })
                          }
                          disabled={!isPicking && !isDraftOrReady}
                          className="w-24 h-7 text-right px-2 rounded border border-slate-300 font-semibold text-xs"
                        />
                      )}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-500 font-mono">{item.unit}</td>
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
        title="Validate & Dispatch Delivery"
        description={`Validate delivery order "${delivery.deliveryNumber}"? On-hand stock in "${delivery.warehouse?.name} / ${delivery.sourceLocation?.name}" will decrease immediately by the shipped quantities, and an official stock ledger entry will be created.`}
        confirmLabel="Confirm & Decrease Stock"
        variant="primary"
        onConfirm={() => handleStepAction("VALIDATE")}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
}
