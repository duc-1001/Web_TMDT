import { ApiClient } from "@/lib/apiClient";
import { buildFormData } from "@/lib/formData";
import { UserAddressForm } from "@/schemas/user_address.shema";
import { User } from "@/types/auth";
import { ApiResponse } from "@/types/commons";


export const login = async (email: string, password: string) => {
  const formData = buildFormData({
    email,
    password,
  });
  const response = await ApiClient.post<ApiResponse<{ token: string }>>('/auth/admin/login', formData);
  return response;
}

export const getCurrentUser = async () => {
  const response = await ApiClient.get<ApiResponse<User>>('/auth/me');
  return response;
}

export const logout = async () => {
  const response = await ApiClient.post<ApiResponse>('/auth/logout');
  return response;
}

export const refreshAccessToken = async () => {
  const response = await ApiClient.post<ApiResponse>('/auth/refresh');
  return response;
}
