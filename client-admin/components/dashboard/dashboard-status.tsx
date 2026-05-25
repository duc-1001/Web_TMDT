"use client"

import { useQuery } from "@tanstack/react-query"
import { DollarSign, Package, ShoppingCart, Users } from "lucide-react"
import { getDashboardStats } from "@/services/dashboard.service"

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { DashboardStats } from "@/types/dashboard"
import { formatPrice } from "@/lib/utils"

// ===== Config UI =====

const statsConfig = [
  {
    key: "revenue",
    title: "Doanh thu",
    icon: DollarSign,
  },
  {
    key: "orders",
    title: "Đơn hàng",
    icon: ShoppingCart,
  },
  {
    key: "products",
    title: "Sản phẩm",
    icon: Package,
  },
  {
    key: "customers",
    title: "Khách hàng",
    icon: Users,
  },
] as const

// ===== Component =====

const DashboardStatus = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
  })

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsConfig.map((stat) => {
        const Icon = stat.icon
        const statData = data?.[stat.key]

        return (
          <Card key={stat.key}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>

              <Icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>

            <CardContent>
              {/* Value */}

              <div className="text-2xl font-bold">
                {isLoading ? "..." : stat.key=== "revenue" ? formatPrice(statData?.value ?? 0) : statData?.value ?? 0}
              </div>

              {/* Trend */}

              {statData?.trend !== undefined && (
                <p
                  className={`text-xs mt-1 ${
                    statData.trend >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {statData.trend > 0 ? "+" : ""}
                  {statData.trend}% so với tháng trước
                </p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export default DashboardStatus