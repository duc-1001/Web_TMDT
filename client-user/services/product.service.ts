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

export const getAllProductsAdmin = async (page: number, limit: number, q?: string) => {
    const params = { page, limit, q }
    const response = await ApiClient.get<PaginatedData<ProductAdmin>>('/products/admin', params);
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

export const updateBatchQuantity = async (productId: string, data: any) => {
    const response = await ApiClient.put<ApiResponse>(`/products/admin/${productId}/batches/${data.batchId}`, { quantity: data.quantity });
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

//user
export const getProducts = async (q?: string, category?: string[], page: number = 1, limit: number = 20, sort: string = "createdAt_desc",minPrice?:number,maxPrice?:number) => {
    const params: any = { q, page, limit, sort }

    if (category?.length) {
        params.category = category.join(",")
    }

    if (minPrice !== undefined) {
        params.min_price = minPrice;
    }

    if (maxPrice !== undefined) {
        params.max_price = maxPrice;
    }
    
    const response = await ApiClient.get<PaginatedData<ProductCard>>('/products', params);
    return response;
}

export const getHomeProducts = async (limit: number) => {
    const response = await ApiClient.get<ApiResponse<ProductCard[]>>('/products/home', { limit });
    return response.data;
}

export const getOnSaleProducts = async (limit: number) => {
    const response = await ApiClient.get<ApiResponse<ProductCard[]>>('/products/on-sale', { limit });
    return response.data;
}

export const getNewArrivals = async (limit: number) => {
    const response = await ApiClient.get<ApiResponse<ProductCard[]>>('/products/new-arrivals', { limit });
    return response.data;
}

export const getProductsByIds = async (ids: string[]) => {
    if (!ids.length) return []
    const response = await ApiClient.get<ApiResponse<ProductCard[]>>('/products/by-ids', { ids: ids.join(',') });
    return response.data ?? [];
}

export const getProductBySlug = async (slug: string) => {
    const response = await ApiClient.get<ApiResponse<Product>>(`/products/${slug}`);
    return response.data;
}

export const getSimilarProducts = async (id: string, limit: number = 4) => {
    const params = { limit }
    const response = await ApiClient.get<ApiResponse<BasicProductCard[]>>(`/products/${id}/similar`, params);
    return response.data;
}

export const getCanReviewProduct = async (productId: string) => {
    const response = await ApiClient.get<ApiResponse<{ 
        canReview: boolean
        orders:{
            orderId: string
            orderCode: string
            viewToken: string
            createdAt: string
        }[],
     }>>(`/products/${productId}/can-review`);
    return response.data;
}

export const getProductReviews = async (productId: string, page: number, limit: number) => {
    const params = { page, limit }
    const response = await ApiClient.get<PaginatedData<Review>>(`/products/${productId}/reviews`, params);
    return response;
}

export const increaseProductView = async (productId: string) => {
    const response = await ApiClient.post(`/products/${productId}/view`);
    return response;
}

