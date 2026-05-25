import { ApiClient } from "@/lib/apiClient";
import { ApiResponse, PaginatedData } from "@/types/commons";
import { CalculateRefund, CreateRefundPayload, ListRefundItem, RefundAdminDetail, RefundAdminListItem, RefundUserDetail } from "@/types/refund";

//admin
export const adminGetRefunds = async (q?: string, status?: string, reason?: string, page?: number, limit?: number) => {
    const params: any = {};
    if (q) params.q = q;
    if (status) params.status = status;
    if (reason) params.reason = reason;
    if (page) params.page = page;
    if (limit) params.limit = limit;
    const response = await ApiClient.get<PaginatedData<RefundAdminListItem>>("/refunds/admin", params);
    return response;
}

export const adminGetRefundDetails = async (refundId: string) => {
    const response = await ApiClient.get<ApiResponse<RefundAdminDetail>>(`/refunds/admin/${refundId}`);
    return response.data;
}

export const adminUpdateRefundStatus = async (refundId: string, newStatus: string, reason?: string) => {
    const response = await ApiClient.patch<ApiResponse>(`/refunds/admin/${refundId}/status`, {
        status: newStatus,
        reason
    });
    return response;
}

//user
export const calculateRefund = async (payload: {
    orderCode: string;
    items?: Array<{ productId: string; quantity: number }>
    viewToken: string
}) => {
    const response = await ApiClient.post<ApiResponse<CalculateRefund>>("/refunds/calculate", payload);
    return response.data;
}

export const sendRefundOtp = async (orderCode: string, viewToken: string) => {
    const response = await ApiClient.post<ApiResponse<{ maskedEmail: string }>>("/refunds/send-otp", {
        orderCode,
        viewToken,
    });
    return response.data;
};

export const createRefund = async (payload: CreateRefundPayload, viewToken: string, otp: string) => {
    const response = await ApiClient.post<ApiResponse>("/refunds", { ...payload, viewToken, otp });
    return response.data;
}

export const getRefundDetails = async (
    order_code: string,
    viewToken: string
) => {
    const response = await ApiClient.get<ApiResponse<RefundUserDetail>>(`/refunds/${order_code}`, {
        viewToken
    });
    return response.data;
}

export const getMyRefunds = async () => {
    const response = await ApiClient.get<ApiResponse<ListRefundItem[]>>("/refunds/me");
    return response.data;
}

export const cancelRefund = async (refundCode: string, viewToken: string) => {
    const response = await ApiClient.patch(
        `/refunds/${refundCode}/cancel`,
        null,
        {
            params: { viewToken }
        }
    );
    return response;
};

export const requestRefundViewToken = async (refundCode: string, email: string) => {
    const response = await ApiClient.post<ApiResponse<{ viewToken: string }>>(`/refunds/${refundCode}/request-view-token`, { email });
    return response.data;
}