import { ApiClient } from "@/lib/apiClient";
import { buildFormData } from "@/lib/formData";
import { CreateNewBanner, HeroBanner } from "@/types/banner";
import { ApiResponse } from "@/types/commons";

export const createBanner = async (data: CreateNewBanner) => {
    const formData = buildFormData(data);
    const response = await ApiClient.post<ApiResponse>('/banners', formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response;
}

export const editBanner = async (id: string, data: CreateNewBanner) => {
    const formData = buildFormData(data);
    const response = await ApiClient.put<ApiResponse>(`/banners/${id}`, formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response;
}

export const deleteBanner = async (id: string) => {
    const response = await ApiClient.delete<ApiResponse>(`/banners/${id}`);
    return response;
}

export const changeBannerStatus = async (id: string) => {
    const response = await ApiClient.patch<ApiResponse>(`/banners/${id}/toggle-status`);
    return response;
}

export const getAllBannersAdmin = async () => {
    const response = await ApiClient.get<ApiResponse<HeroBanner[]>>('/banners/admin');
    return response.data;
}

export const getHeroBanners = async () => {
    const response = await ApiClient.get<ApiResponse<HeroBanner[]>>('/banners/hero');
    return response.data;
}