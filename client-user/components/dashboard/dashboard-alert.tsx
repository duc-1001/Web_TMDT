"use client"

import { getDashboardAlerts } from "@/services/dashboard.service"
import { useQuery } from "@tanstack/react-query"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

const alertMessages: Record<string, (count: number) => string> = {
  lowStock: (c) => `${c} sản phẩm sắp hết hàng`,
  pendingOrders: (c) => `${c} đơn hàng chờ xử lý quá lâu`,
  unpaidOrders: (c) => `${c} đơn hàng chưa thanh toán`,
}

const DashboardAlert = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-alert"],
    queryFn: getDashboardAlerts,
  })

  if (isLoading) return null

  if (!data || data.length === 0) return null

  return (
    <div className="space-y-3">
      {data.map((alert: any, index: number) => (
        <Alert key={index} variant="destructive">
          <AlertCircle className="h-4 w-4" />

          <AlertTitle>Cảnh báo</AlertTitle>

          <AlertDescription>
            {alertMessages[alert.type]?.(alert.count)}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  )
}

export default DashboardAlert