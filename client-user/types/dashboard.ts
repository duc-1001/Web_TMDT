export type StatItem = {
  value: number
  trend?: number
}

export type DashboardStats = {
  revenue: StatItem
  orders: StatItem
  products: StatItem
  customers: StatItem
}

export type TopProduct = {
  _id: string
  name: string
  sold: number
  revenue: number
}

export type DashboardAlert = {
    type: "lowStock" | "pendingOrders" | "unpaidOrders"
    count: number
}

