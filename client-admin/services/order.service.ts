import { ApiClient } from "@/lib/apiClient";
import { ApiResponse, PaginatedData } from "@/types/commons";
import { AdminOrderListItem, OrderPayload, OrderResponse, SuccessOrderResponse, AdminOrderDetail, AdminOrderSummary, MyOrderListItem, OrderShippingInfo } from "@/types/order";
import { OrderRefundListItem, RefundableItem, RefundSummary } from "@/types/refund";
import { OrderReview, Review } from "@/types/review";

// Admin APIs

export const getOrdersAdmin = async (page: number, limit: number, search?: string, status?: string, paymentStatus?: string, staff?: string, sortBy?: string) => {
    const response = await ApiClient.get<PaginatedData<AdminOrderListItem>>('/orders/admin', {
        page,
        limit,
        search,
        status,
        paymentStatus,
        staff,
        sortBy
    });
    return response;
}

export const getOrderDetailsAdmin = async (orderCode: string) => {
    const response = await ApiClient.get<ApiResponse<AdminOrderDetail>>(`/orders/admin/${orderCode}`);
    return response.data;
}

export const updateOrderStatus = async (orderCode: string, newStatus: string) => {
    const response = await ApiClient.patch<ApiResponse<AdminOrderListItem>>(`/orders/admin/${orderCode}/status`, { status: newStatus });
    return response.data;
}

export const getOrderSummaryAdmin = async () => {
    const response = await ApiClient.get<ApiResponse<AdminOrderSummary>>(`/orders/admin/summary`);
    return response.data;
}


export const updateBulkNextOrderStatus = async (orderIds: string[]) => {
    const response = await ApiClient.patch<ApiResponse<{
        success: AdminOrderListItem[],
        failed: { orderCode: string, reason: string }[]
    }>>(`/orders/admin/bulk/next`, { orderIds });
    return response.data;
}

export const updateBulkCancelOrderStatus = async (orderIds: string[]) => {
    const response = await ApiClient.patch<ApiResponse<{
        success: AdminOrderListItem[],
        failed: { orderCode: string, reason: string }[]
    }>>(`/orders/admin/bulk/cancel`, { orderIds });
    return response.data;
}

export const markOrderAsPaid = async (orderCode: string) => {
    const response = await ApiClient.patch<ApiResponse<AdminOrderListItem>>(`/orders/admin/${orderCode}/mark-paid`);
    return response.data;
}

export const revertOrderToUnpaid = async (orderCode: string) => {
    const response = await ApiClient.patch<ApiResponse<AdminOrderListItem>>(`/orders/admin/${orderCode}/revert-unpaid`);
    return response.data;
}
