"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, FileDown, Truck, ArrowRightLeft, SlidersHorizontal } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils/format";

interface OperationItem {
  id: string;
  reference: string;
  type: "Receipt" | "Delivery" | "Transfer" | "Adjustment";
  date: string;
  user: string;
  location: string;
  status: string;
  link: string;
}

export function RecentOperationsTable({ operations }: { operations: OperationItem[] }) {
  const getBadgeVariant = (status: string) => {
    switch (status.toUpperCase()) {
      case "DONE":
      case "COMPLETED":
        return "success";
      case "READY":
      case "PACKING":
      case "PICKING":
        return "info";
      case "WAITING":
      case "IN_PROGRESS":
        return "warning";
      case "CANCELED":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "Receipt":
        return <FileDown className="w-3.5 h-3.5 text-emerald-600" />;
      case "Delivery":
        return <Truck className="w-3.5 h-3.5 text-blue-600" />;
      case "Transfer":
        return <ArrowRightLeft className="w-3.5 h-3.5 text-purple-600" />;
      default:
        return <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />;
    }
  };

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle>Recent Inventory Operations</CardTitle>
          <CardDescription>Live log of inbound, outbound, transfer, and adjustment transactions</CardDescription>
        </div>
        <Link href="/operations/moves" className="text-xs text-brand-600 hover:text-brand-800 font-semibold flex items-center">
          Full Stock Ledger <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Link>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-y border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Reference</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3">Counterparty / Staff</th>
                <th className="py-2.5 px-3">Location / Route</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {operations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No recent operations recorded for the selected filter.
                  </td>
                </tr>
              ) : (
                operations.map((op) => (
                  <tr key={op.reference} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                      {op.reference}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-1.5 font-medium text-slate-700">
                        {getIcon(op.type)}
                        <span>{op.type}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-500">{formatDateTime(op.date)}</td>
                    <td className="py-3 px-3 text-slate-700 font-medium truncate max-w-[150px]">{op.user}</td>
                    <td className="py-3 px-3 text-slate-600 truncate max-w-[180px]">{op.location}</td>
                    <td className="py-3 px-3 text-center">
                      <Badge variant={getBadgeVariant(op.status) as any}>{op.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={op.link}
                        className="text-xs text-brand-600 hover:text-brand-800 font-semibold inline-flex items-center"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
