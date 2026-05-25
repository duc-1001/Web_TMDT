export type TrafficSource = {
    name: string
    value: number
}

export type DashboardStats = {
    gmv: number
    orders: number
    newCustomers: number
    aov: number
    conversionRate: number
    cancelRate: number
    visits: number
    changes: {
        gmv: number
        orders: number
        newCustomers: number
        aov: number
        conversionRate: number
        cancelRate: number
        visits: number
    }
}

export type RevenueChartItem = {
    day: string
    revenue: number
    orders: number
    visitors: number
}

export type CategoryRevenue = {
    categoryId: string
    categoryName: string
    revenue: number
    orders: number
    percent: number
}
    
export type ProductSales = {
  productId: string
  name: string
  image?: string | null
  sold: number
  revenue: number
}

export type TopSellingProduct = ProductSales
export type LowSellingProduct = ProductSales

export type LowStockProduct = {
  productId: string
  name: string
  image?: string | null
  stock: number
}

export type ExpiringProduct = {
  productId: string
  name: string
  image?: string | null
  stock: number
  expirationDate: string
}

export type CustomerGrowthItem = {
  date: string
  newCustomers: number
  returning: number
}

export type PurchaseFrequencyItem = {
  range: string
  customers: number
}

export type CustomerSegmentItem = {
  segment: string
  count: number
  percent: number
}

export type ChurnCustomerItem = {
  _id: string
  fullName: string
  lastOrder: string
  lastLogin: string | null
}

export type TopCustomerItem = {
  _id: string
  fullName: string
  phone: string
  orders: number
  spent: number
  avgOrder: number
  lastOrder: string
}