import { ApiClient } from "@/lib/apiClient";
import { buildFormData } from "@/lib/formData";
import { UserAddressForm } from "@/schemas/user_address.shema";
import { User } from "@/types/auth";
import { ApiResponse } from "@/types/commons";


export const register = async (fullName: string, email: string, password: string) => {
  const formData = buildFormData({
    fullName,
    email,
    password,
  });
  const response = await ApiClient.post<ApiResponse<{ token: string }>>('/auth/register', formData);
  return response;
}

export const login = async (email: string, password: string) => {
  const formData = buildFormData({
    email,
    password,
  });
  const response = await ApiClient.post<ApiResponse<{ token: string }>>('/auth/login', formData);
  return response;
}

export const verifyEmailToken = async (token: string) => {
  const formData = buildFormData({
    token,
  });
  const response = await ApiClient.post<ApiResponse>('/auth/verify-email', formData);
  return response;
}

export const resendVerificationLink = async (email: string) => {
  const formData = buildFormData({
    email,
  });
  const response = await ApiClient.post<ApiResponse>('/auth/resend-verification', formData);
  return response;
}

export const getCurrentUser = async () => {
  const response = await ApiClient.get<ApiResponse<User>>('/auth/me');
  return response;
}

export const refreshAccessToken = async () => {
  const response = await ApiClient.post<ApiResponse>('/auth/refresh');
  return response;
}

export const logout = async () => {
  const response = await ApiClient.post<ApiResponse>('/auth/logout');
  return response;
}

export const googleLogin = async () => {
  const response = await ApiClient.get<ApiResponse>('/auth/google/login');
  return response;
}

export const updateUserProfile = async (data: { fullName?: string; phoneNumber?: string; }) => {
  const formData = buildFormData(data);
  const response = await ApiClient.put<ApiResponse>('/auth/profile', formData);
  return response;
}

export const updateUserAvatar = async (avatarUrl: string) => {
  const response = await ApiClient.put<ApiResponse>('/auth/profile', buildFormData({ avatar: avatarUrl }));
  return response;
}

export const changeUserPassword = async (oldPassword: string, newPassword: string) => {
  const formData = buildFormData({
    oldPassword,
    newPassword,
  });
  const response = await ApiClient.post<ApiResponse>('/auth/change-password', formData);
  return response;
}

export const forgotPassword = async (email: string) => {
  const formData = buildFormData({
    email,
  });
  const response = await ApiClient.post<ApiResponse>('/auth/forgot-password', formData);
  return response;
}

export const resetPassword = async (token: string, newPassword: string) => {
  const formData = buildFormData({
    token,
    newPassword,
  });
  const response = await ApiClient.post<ApiResponse>('/auth/reset-password', formData);
  return response;
}

export const addUserAddress = async (data: UserAddressForm) => {
  const response = await ApiClient.post<ApiResponse<User>>(
    "/auth/address",
    {
      ...data,
      isDefault: Boolean(data.isDefault),
    }
  )
  return response
}

export const editUserAddress = async (addressId: string, data: UserAddressForm) => {
  const response = await ApiClient.put<ApiResponse<User>>(
    `/auth/address/${addressId}`,
    {
      ...data,
      isDefault: Boolean(data.isDefault),
    }
  )
  return response
}

export const deleteUserAddress = async (addressId: string) => {
  const response = await ApiClient.delete<ApiResponse<User>>(
    `/auth/address/${addressId}`
  )
  return response
}
