import { ApiClient } from "@/lib/apiClient";
import { buildFormData } from "@/lib/formData";
import { BrandForm } from "@/schemas/brand.schema";
import { Brand, ProductBrand } from "@/types/brand";
import { ApiResponse } from "@/types/commons";

export const createBrand = async (data:BrandForm) => {
    const formData = buildFormData(data);
    const response = await ApiClient.post<ApiResponse>('/brands', formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response;
}

export const getAllBrandsAdmin = async () => {
    const response = await ApiClient.get<ApiResponse<Brand[]>>('/brands/admin');
    return response.data;
}

export const editBrand = async (id: string, data: BrandForm) => {
    const formData = buildFormData(data);
    const response = await ApiClient.put<ApiResponse>(`/brands/${id}`, formData,    
        { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response;
}

export const deleteBrand = async (id: string) => {
    const response = await ApiClient.delete<ApiResponse>(`/brands/${id}`);
    return response;
}

export const changeBrandStatus = async (id: string) => {
    const response = await ApiClient.patch<ApiResponse>(`/brands/${id}/status`);
    return response;
}

export const getAllBrandsForProduct = async () => {
    const response = await ApiClient.get<ApiResponse<ProductBrand[]>>('/brands/for-product');
    return response.data;
}