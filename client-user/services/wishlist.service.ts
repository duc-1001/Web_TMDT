import { ApiClient } from "@/lib/apiClient";
import { buildFormData } from "@/lib/formData";
import { UserAddressForm } from "@/schemas/user_address.shema";
import { User } from "@/types/auth";
import { ApiResponse } from "@/types/commons";
import { BasicProductCard, ProductCard  } from "@/types/product";

export const getWishlist = async () => {
    const response = await ApiClient.get<ApiResponse<BasicProductCard[]>>('/wishlist');
    return response.data;
}

export const addToWishlist = async (productId: string) => {
    const response = await ApiClient.post<ApiResponse>(`/wishlist/${productId}`);
    return response.data;
}

export const removeFromWishlist = async (productId: string) => {
    const response = await ApiClient.delete<ApiResponse>(`/wishlist/${productId}`);
    return response.data;
}

export const clearWishlist = async () => {
    const response = await ApiClient.delete<ApiResponse>('/wishlist/clear');
    return response.data;
}