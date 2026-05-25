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

