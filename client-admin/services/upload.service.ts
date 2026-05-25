import { ApiClient } from "@/lib/apiClient";
import { ApiResponse } from "@/types/commons";


export const uploadFile = async (file: File, type: 'product' | 'system' | 'category' | 'user' | 'review') => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await ApiClient.post<ApiResponse<{ url: string, imagePublicId: string }>>(`/upload/image?type=${type}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
}

export const deleteFile = async (publicId: string) => {
    const response = await ApiClient.post<ApiResponse>(
        "/upload/delete",
        { publicId }   
    );
    return response.data;
}