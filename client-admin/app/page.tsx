"use client"
import DashboardStatus from "@/components/dashboard/dashboard-status"
import DashboardRecentOrders from "@/components/dashboard/dashboard-recent-orders"
import DashboardTopProducts from "@/components/dashboard/dashboard-top-products"
import DashboardAlerts from "@/components/dashboard/dashboard-alert"
import AdminLayout from "@/components/layout/admin/admin-layout"


export default function AdminDashboard() {
  return (
    <AdminLayout>
      <div className="space-y-6 p-6">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Tổng quan</h1>
          <p className="text-muted-foreground">Tổng quan nhanh về cửa hàng bán đồ ăn vặt</p>
        </div>

        {/* KPI Stats */}
        <DashboardStatus />

        {/* Main grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Orders */}
          <DashboardRecentOrders />
          {/* Top Products */}
          <DashboardTopProducts />
        </div>

        {/* Alerts */}
        <DashboardAlerts />
      </div>
    </AdminLayout>
  )
}
