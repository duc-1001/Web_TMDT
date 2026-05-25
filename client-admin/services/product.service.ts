import { ApiClient } from "@/lib/apiClient";
import { buildFormData } from "@/lib/formData";
import { ApiResponse, PaginatedData } from "@/types/commons";
import { BasicProductForm, BatchProductStatus, ProductCard, Product, ProductAdmin, ProductBatch, ProductEdit, BasicProductCard, ProductForSelect, ProductAnalyticsSummary, ProductRevenueChartItem, ProductOrdersViewsChartItem } from "@/types/product";
import { Review } from "@/types/review";

export const createProduct = async (data: any) => {
    const formData = buildFormData(data);
    const response = await ApiClient.post<ApiResponse>('/products', formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response;
}

export const editProduct = async (id: string, data: any) => {
    const formData = buildFormData(data);
    const response = await ApiClient.put<ApiResponse>(`/products/${id}`, formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response;
}

export const getAllProductsAdmin = async (
    page: number,
    limit: number,
    q?: string,
    sort?: string,
    isActive?: boolean
) => {
    const params: Record<string, any> = { page, limit }
    if (q)               params.q        = q
    if (sort)            params.sort     = sort
    if (isActive !== undefined) params.isActive = isActive
    const response = await ApiClient.get<PaginatedData<ProductAdmin>>('/products/admin', params)
    return response
}

export const getProductByIdAdmin = async (id: string) => {
    const response = await ApiClient.get<ApiResponse<ProductEdit>>(`/products/admin/${id}`);
    return response.data;
}

export const updateProductStatus = async (productId: string) => {
    const response = await ApiClient.patch<ApiResponse>(`/products/${productId}/status`);
    return response;
}

export const deleteProduct = async (productId: string) => {
    const response = await ApiClient.delete<ApiResponse>(`/products/${productId}`);
    return response;
}

export const getProductBasicInfo = async (productId: string) => {
    const response = await ApiClient.get<ApiResponse<BasicProductForm>>(`/products/admin/${productId}/basic`);
    return response.data;
}

export const getBatchProductStatus = async (productId: string) => {
    const response = await ApiClient.get<ApiResponse<BatchProductStatus>>(`/products/admin/${productId}/batch-status`);
    return response.data;
}

export const getProductBatchesAdmin = async (productId: string, page: number, limit: number) => {
    const params = { page, limit }
    const response = await ApiClient.get<PaginatedData<ProductBatch>>(`/products/admin/${productId}/batches`, params);
    return response;
}

export const updateBatchQuantity = async (productId: string, batchId: string, data: any) => {
    const response = await ApiClient.put<ApiResponse>(`/products/admin/${productId}/batches/${batchId}`, { quantity: data.quantity });
    return response;
}

export const createProductBatch = async (productId: string, data: any) => {
    const formData = buildFormData(data);
    const response = await ApiClient.post<ApiResponse>(`/products/admin/${productId}/batches`, formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response;
}

export const getProductForSelect = async (q?: string, limit?: number, category_id?: string) => {
    const params = { q, limit, category_id }
    const response = await ApiClient.get<ApiResponse<ProductForSelect[]>>('/products/admin/for-select', params);
    return response.data;
}

export const getAnalyticsSummaryProduct = async (productId: string) => {
    const response = await ApiClient.get<ApiResponse<ProductAnalyticsSummary>>(`/products/admin/${productId}/analytics/summary`);
    return response.data;
}

export const getAnalyticsRevenueProduct = async (productId: string,days: number) => {
    const params = { days }
    const response = await ApiClient.get<ApiResponse<ProductRevenueChartItem[]>>(`/products/admin/${productId}/analytics/revenue`, params);
    return response.data;
}

export const getProductOrdersViewsChart = async (productId: string, days: number) => {
    const params = { days }
    const response = await ApiClient.get<ApiResponse<ProductOrdersViewsChartItem[]>>(`/products/admin/${productId}/analytics/traffic`, params);
    return response.data;
}

export const getProductPerformance = async (productId: string, days: number) => {
    const params = { days }
    const response = await ApiClient.get<ApiResponse<{ searchRate: number, addToCartRate: number, wishlistRate: number }>>(`/products/admin/${productId}/analytics/performance`, params);
    return response.data;
}

