"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface StockMovementPoint {
  date: string;
  incoming: number;
  outgoing: number;
  adjustments: number;
}

export function StockMovementChart({
  data,
  days,
  onDaysChange,
}: {
  data: StockMovementPoint[];
  days: number;
  onDaysChange: (d: number) => void;
}) {
  return (
    <Card className="col-span-full lg:col-span-8">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 gap-2">
        <div>
          <CardTitle>Stock Movement Velocity</CardTitle>
          <CardDescription>
            Historical inbound receipts, outbound customer shipments, and physical inventory corrections
          </CardDescription>
        </div>

        {/* 7d / 30d / 90d toggle buttons */}
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs font-medium self-start sm:self-auto">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => onDaysChange(d)}
              className={`px-3 py-1 rounded-md transition-all ${
                days === d
                  ? "bg-white text-slate-900 font-semibold shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {d} Days
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIncoming" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorOutgoing" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorAdj" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                  fontSize: "12px",
                }}
              />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
              />
              <Area
                type="monotone"
                dataKey="incoming"
                name="Incoming Stock"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorIncoming)"
              />
              <Area
                type="monotone"
                dataKey="outgoing"
                name="Outgoing Deliveries"
                stroke="#6366f1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorOutgoing)"
              />
              <Area
                type="monotone"
                dataKey="adjustments"
                name="Adjustments"
                stroke="#f59e0b"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#colorAdj)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
