import { ApiClient } from "@/lib/apiClient";
import { buildFormData } from "@/lib/formData";
import { UserAddressForm } from "@/schemas/user_address.shema";
import { CategoryRevenue, ChurnCustomerItem, CustomerGrowthItem, CustomerSegmentItem, DashboardStats, ExpiringProduct, LowStockProduct, ProductSales, PurchaseFrequencyItem, RevenueChartItem, TopCustomerItem, TrafficSource } from "@/types/analytic";
import { User } from "@/types/auth";
import { ApiResponse } from "@/types/commons";

export const trackVisit = async (data: Record<string, any>) => {
  const response = await ApiClient.post<ApiResponse>('/analytics/track-visit', data, {
    headers: { "Content-Type": "application/json" },
  })
  return response
}

export const getTrafficSources = async (day: number) => {
  const params = {
    day
  }
  const response = await ApiClient.get<ApiResponse<TrafficSource[]>>('/analytics/traffic-sources', params)
  return response.data
}

export const getDashboardStats = async (day: number) => {
  const params = {
    day
  }
  const response = await ApiClient.get<ApiResponse<DashboardStats>>('/analytics/dashboard', params)
  return response.data
}

export const getRevenueChart = async (day: number) => {
  const params = {
    day
  }
  const response = await ApiClient.get<ApiResponse<RevenueChartItem[]>>('/analytics/chart-revenue', params)
  return response.data
}

export const getCategoryRevenue = async (day: number) => {
  const params = {
    day
  }
  const response = await ApiClient.get<ApiResponse<CategoryRevenue[]>>('/analytics/category-revenue', params)
  return response.data
}

export const getTopSellingProducts = async (day: number, limit: number) => {
  const response = await ApiClient.get<ApiResponse<ProductSales[]>>('/analytics/top-products', { day, limit })
  return response.data
}

export const getLowSellingProducts = async (day: number, limit: number) => {
  const response = await ApiClient.get<ApiResponse<ProductSales[]>>('/analytics/low-products', { day, limit })
  return response.data
}

export const getLowStockProducts = async (limit: number, threshold: number) => {
  const response = await ApiClient.get<ApiResponse<LowStockProduct[]>>('/analytics/low-stock-products', { limit, threshold })
  return response.data
}

export const getExpiringProducts = async (limit: number, daysUntilExpiry: number) => {
  const response = await ApiClient.get<ApiResponse<ExpiringProduct[]>>('/analytics/expiring-products', { limit, days_until_expiry: daysUntilExpiry })
  return response.data
}

export const getCustomerGrowth = async (day: number) => {
  const response = await ApiClient.get<ApiResponse<CustomerGrowthItem[]>>('/analytics/customer-growth', { day })
  return response.data
}

export const getPurchaseFrequency = async () => {
  const response = await ApiClient.get<ApiResponse<PurchaseFrequencyItem[]>>('/analytics/purchase-frequency')
  return response.data
}

export const getCustomerSegmentation = async () => {
  const response = await ApiClient.get<ApiResponse<CustomerSegmentItem[]>>('/analytics/customer-segmentation')
  return response.data
}

export const getChurnCustomers = async (limit: number) => {
  const response = await ApiClient.get<ApiResponse<ChurnCustomerItem[]>>('/analytics/churn-customers', { limit })
  return response.data
}

export const getTopCustomers = async (limit: number) => {
  const response = await ApiClient.get<ApiResponse<TopCustomerItem[]>>('/analytics/top-customers', { limit })
  return response.data
}