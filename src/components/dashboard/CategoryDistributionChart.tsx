"use client";

import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#06b6d4", "#ec4899", "#8b5cf6"];

export function CategoryDistributionChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  const totalStock = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="col-span-full lg:col-span-4">
      <CardHeader className="pb-2">
        <CardTitle>Inventory by Category</CardTitle>
        <CardDescription>Stock distribution across material categories</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full flex items-center justify-center">
          {data.length === 0 ? (
            <div className="text-xs text-slate-400">No category inventory data</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${Number(val || 0).toLocaleString()} units`, "Stock"]}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  iconType="circle"
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
