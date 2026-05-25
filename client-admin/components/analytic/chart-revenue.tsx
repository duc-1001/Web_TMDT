"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { getRevenueChart } from "@/services/analytics.service";
import { formatPrice } from "@/lib/utils";

const formatCompact = (value: number) => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} tỷ`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}tr`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return value.toString();
};

interface RevenueChartProps {
  day: number;
  tab?: string;
}

const RevenueChart = ({ day, tab }: RevenueChartProps) => {
  const { data: revenueChart, isLoading } = useQuery({
    queryKey: ["revenueChart", day],
    queryFn: () => getRevenueChart(day),
    enabled: tab === "overview", 
  });

  if (isLoading) {
    return <p className="text-gray-500">Đang tải dữ liệu...</p>;
  }

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle>Doanh thu & Đơn hàng {day} ngày</CardTitle>
        <CardDescription>So sánh doanh thu và số lượng đơn</CardDescription>
      </CardHeader>
      <CardContent className="h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={revenueChart}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={12} />
            <YAxis
              yAxisId="left"
              axisLine={false}
              tickLine={false}
              tickFormatter={formatCompact}
              fontSize={12}
            />
            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(value: any, name: any) => [
                name === "revenue" ? formatPrice(value ?? 0) : value ?? 0,
                name === "revenue" ? "Doanh thu" : "Đơn hàng",
              ]}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="revenue"
              stroke="#f97316"
              strokeWidth={3}
              name="Doanh thu"
              dot={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="orders"
              stroke="#10b981"
              strokeWidth={2}
              name="Đơn hàng"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default RevenueChart;