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


// Customer APIs

export const createOrder = async (orderData: OrderPayload) => {
    const response = await ApiClient.post<ApiResponse<OrderResponse>>('/orders', orderData);
    return response.data;
}

export const getOrderSuccessByCode = async (orderCode: string) => {
    const response = await ApiClient.get<ApiResponse<SuccessOrderResponse>>(`/orders/${orderCode}/success`);
    return response.data;
}

export const getMyOrders = async (page: number, limit: number, status?: string, q?: string) => {
    const response = await ApiClient.get<PaginatedData<MyOrderListItem>>('/orders/my', {
        page,
        limit,
        status,
        q
    });
    return response;
}

export const cancelOrder = async (orderId: string) => {
    const response = await ApiClient.patch<ApiResponse<MyOrderListItem>>(`/orders/${orderId}/cancel`);
    return response.data;
}

export const getOrderShippingInfo = async (orderId: string, token: string) => {
    const response = await ApiClient.get<ApiResponse<OrderShippingInfo>>(`/orders/${orderId}`, { token });
    return response.data;
}

export const reorder = async (orderCode: string) => {
    const response = await ApiClient.post<ApiResponse>(
        `/orders/${orderCode}/reorder`
    )
    return response.data;
}

export const requestOrderViewToken = async (orderCode: string, email: string) => {
    const response = await ApiClient.post<ApiResponse<{ viewToken: string }>>(`/orders/${orderCode}/request-view-token`, { email });
    return response.data;
}

export const checkCanRefundOrder = async (orderCode: string, viewToken: string) => {
    const response = await ApiClient.get<ApiResponse<{ canRefund: boolean, refundDeadline: string }>>(`/orders/${orderCode}/refund-eligibility`, { viewToken });
    return response.data;
}

export const getRefundSummaryInfo = async (orderCode: string, token: string) => {
    const response = await ApiClient.get<ApiResponse<RefundSummary>>(`/orders/${orderCode}/refund-summary`, { token });
    return response.data;
}

export const getHistoryRefunds = async (orderCode: string, token: string) => {
    const response = await ApiClient.get<ApiResponse<OrderRefundListItem[]>>(`/orders/${orderCode}/refunds`, { token });
    return response.data;
}

export const getRefundableItems = async (orderCode: string, token: string) => {
    const response = await ApiClient.get<ApiResponse<RefundableItem[]>>(`/orders/${orderCode}/refundable-items`, { token });
    return response.data;
}

export const getOrderReviews = async (orderCode: string) => {
    const response = await ApiClient.get<ApiResponse<OrderReview[]>>(`/orders/${orderCode}/reviews`);
    return response.data;
}
