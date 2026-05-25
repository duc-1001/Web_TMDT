import { ApiClient } from "@/lib/apiClient";
import { buildFormData } from "@/lib/formData";
import { BrandForm } from "@/schemas/brand.schema";
import { Brand, ProductBrand } from "@/types/brand";
import { ApiResponse } from "@/types/commons";
import { DashboardAlert, DashboardStats, TopProduct } from "@/types/dashboard";
import { AdminOrderListItem } from "@/types/order";

export const getDashboardStats = async () => {
    const response = await ApiClient.get<ApiResponse<DashboardStats>>('/admin/dashboard/stats');
    return response.data;
}

export const getRecentOrders = async (limit: number) => {
    const response = await ApiClient.get<ApiResponse<AdminOrderListItem[]>>(`/admin/dashboard/orders/recent?limit=${limit}`);
    return response.data;
}

export const getTopProducts = async (limit: number) => {
    const response = await ApiClient.get<ApiResponse<TopProduct[]>>(`/admin/dashboard/products/top?limit=${limit}`);
    return response.data;
}

export const getDashboardAlerts = async () => {
    const response = await ApiClient.get<ApiResponse<DashboardAlert[]>>(`/admin/dashboard/alerts`);
    return response.data;
}