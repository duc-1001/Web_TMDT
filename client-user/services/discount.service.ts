import { ApiClient } from "@/lib/apiClient";
import { buildFormData } from "@/lib/formData";
import { DiscountFormData } from "@/schemas/discount.schema";
import { ApiResponse, PaginatedData } from "@/types/commons";
import { Discount, DiscountAdmin, DiscountAvailable } from "@/types/discount";

export const getDiscountsAdmin = async (q: string, page: number, limit: number, status: string) => {
    const params = { q, page, limit, status };
    const response = await ApiClient.get<PaginatedData<DiscountAdmin>>('/discounts/admin', params);
    return response;
}

export const createDiscount = async (data: DiscountFormData) => {
    const formData = buildFormData(data);
    const response = await ApiClient.post<ApiResponse>('/discounts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response;
}

export const updateDiscount = async (DiscountId: string, data: DiscountFormData) => {
    const formData = buildFormData(data);
    const response = await ApiClient.put<ApiResponse>(`/discounts/${DiscountId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response;
}

export const deleteDiscount = async (DiscountId: string) => {
    const response = await ApiClient.delete<ApiResponse>(`/discounts/${DiscountId}`)
    return response;
}

export const exportDiscounts = async (): Promise<Blob> => {
    const response = await ApiClient.get<Blob>("/discounts/export", {
        responseType: "blob",
    });
    return response;
};

export const toggleDiscountFeature = async (DiscountId: string): Promise<ApiResponse> => {
    const response = await ApiClient.patch<ApiResponse>(`/discounts/${DiscountId}/feature`)
    return response;
}

export const getActiveDiscounts = async (feature: boolean): Promise<Discount[]> => {
    const response = await ApiClient.get<ApiResponse<Discount[]>>('/discounts', { feature })
    return response.data || [];
}


export const getAvailableDiscounts = async (orderValue: number) => {    
    const params = { order_value: orderValue };
    const response = await ApiClient.get<ApiResponse<DiscountAvailable[]>>('/discounts/available',params);
    return response;
}
