"use client";

import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export function WarehouseDistributionChart({
  data,
}: {
  data: { name: string; quantity: number }[];
}) {
  return (
    <Card className="col-span-full lg:col-span-6">
      <CardHeader className="pb-2">
        <CardTitle>Warehouse Stock Distribution</CardTitle>
        <CardDescription>On-hand physical inventory per warehouse facility</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          {data.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">
              No warehouse data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 30, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={140}
                  tick={{ fontSize: 11, fill: "#475569" }}
                />
                <Tooltip
                  formatter={(val: any) => [`${Number(val || 0).toLocaleString()} units`, "On Hand"]}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="quantity" fill="#4f46e5" radius={[0, 8, 8, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
