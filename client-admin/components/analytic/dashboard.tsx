"use client";

import { formatPrice } from "@/lib/utils";
import { getDashboardStats } from "@/services/analytics.service";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeftRight,
  DollarSign,
  MousePointerClick,
  Package,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import React from "react";
import { Card, CardContent } from "../ui/card";

interface DashboardProps {
  day: number;
}

const statIcons: Record<string, any> = {
  gmv: DollarSign,
  orders: ShoppingCart,
  aov: Package,
  newCustomers: Users,
  conversionRate: MousePointerClick,
  cancelRate: ArrowLeftRight,
};

const Dashboard = ({ day }: DashboardProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboardStats", day],
    queryFn: () => getDashboardStats(day),
  });

  if (isLoading) {
    return (
      <p className="text-gray-500 text-center py-10">
        Đang tải dữ liệu...
      </p>
    );
  }

  if (!data) {
    return (
      <p className="text-gray-500 text-center py-10">
        Không có dữ liệu
      </p>
    );
  }

  // map dữ liệu API về format giống stats
  const stats = [
    { key: "gmv", title: "Doanh thu (GMV)", value: formatPrice(data.gmv) },
    { key: "orders", title: "Đơn hàng", value: data.orders.toLocaleString() },
    { key: "aov", title: "AOV", value: formatPrice(data.aov) },
    { key: "newCustomers", title: "Khách hàng mới", value: data.newCustomers.toLocaleString() },
    { key: "conversionRate", title: "Tỷ lệ chuyển đổi", value: `${data.conversionRate}%` },
    { key: "cancelRate", title: "Tỷ lệ hủy đơn", value: `${data.cancelRate}%` },
  ].map((stat) => {
    const changeValue = String(data.changes?.[stat.key as keyof typeof data.changes]) ?? "+0%";
    const isPositive = !changeValue.startsWith("-");

    return {
      ...stat,
      change: changeValue,
      trend: isPositive ? "up" : "down",
      icon: statIcons[stat.key],
    };
  });

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.title}
            className="border-none shadow-sm hover:shadow transition-shadow"
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="rounded-lg bg-orange-100 p-2.5">
                  <Icon className="h-5 w-5 text-orange-600" />
                </div>
                <div
                  className={`flex items-center gap-1 text-xs font-medium ${
                    stat.trend === "up" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stat.trend === "up" ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  {stat.change}
                </div>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.title}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default Dashboard;