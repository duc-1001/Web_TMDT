import { ApiClient } from "@/lib/apiClient";
import { buildFormData } from "@/lib/formData";
import { CouponFormData } from "@/schemas/coupon.schema";
import { ApiResponse,PaginatedData } from "@/types/commons";
import { Coupon, CouponAvailable } from "@/types/coupon";

// admin

export const getCouponsAdmin = async (q:string,page:number,limit:number,status:string) => {    
    const params = { q, page, limit, status };
    const response = await ApiClient.get<PaginatedData<Coupon>>('/coupons/admin',params);
    return response;
}

export const createCoupon = async (data: CouponFormData) => {
    const formData = buildFormData(data);
    const response = await ApiClient.post<ApiResponse>('/coupons', formData,{
        headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response;
}

export const updateCoupon = async (couponId: string, data: CouponFormData) => {    
    const formData = buildFormData(data);
    const response = await ApiClient.put<ApiResponse>(`/coupons/${couponId}`, formData,{
        headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response;
}

export const deleteCoupon = async (couponId: string) => {    
    const response = await ApiClient.delete<ApiResponse>(`/coupons/${couponId}`)
    return response;
}

export const exportCoupons = async (): Promise<Blob> => {
  const response = await ApiClient.get<Blob>("/coupons/export", {
    responseType: "blob",
  });
  return response; 
};

// user
export const getAvailableCoupons = async (orderValue: number) => {    
    const params = { order_value: orderValue };
    const response = await ApiClient.get<ApiResponse<CouponAvailable[]>>('/coupons/available',params);
    return response;
}


