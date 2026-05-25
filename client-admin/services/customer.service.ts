import { ApiClient } from "@/lib/apiClient";
import { buildFormData } from "@/lib/formData";
import { CategoryForm } from "@/schemas/category.schema";
import { Category, CategoryForSelect, CategoryTree, ProductCategory } from "@/types/category";
import { ApiResponse, PaginatedData } from "@/types/commons";
import { Customer, CustomerDetail, CustomerOrder, CustomerQuickView, CustomerSummary } from "@/types/customer";

export const getAllCustomersAdmin = async (q?: string, page: number = 1, limit: number = 20, statusFilter?: string, sortBy: string = 'createdAt') => {
    const params = {
        q,
        page: page.toString(),
        limit: limit.toString(),
        status: statusFilter,
        sort: sortBy,
    };
    const response = await ApiClient.get<PaginatedData<Customer>>('/customers', params);
    return response;
}

export const getCustomerSummary = async () => {
    const response = await ApiClient.get<ApiResponse<CustomerSummary>>('/customers/summary');
    return response.data;
}

export const getCustomerQuickView = async (customerId: string) => {
    const response = await ApiClient.get<ApiResponse<CustomerQuickView>>(`/customers/${customerId}/quick-view`);
    return response.data;
}

export const blockCustomer = async (customerId: string, reasonCode: string, reasonNote?: string) => {
    const payload = {
        reasonCode,
        reasonNote
    }
    const response = await ApiClient.patch<ApiResponse>(`/customers/${customerId}/block`, payload);
    return response.data;
}

export const unblockCustomer = async (customerId: string) => {
    const response = await ApiClient.patch<ApiResponse>(`/customers/${customerId}/unblock`);
    return response.data;
}

export const sendEmailToCustomer = async (recipients: string[], subject: string, content: string) => {
    const payload = {
        subject: subject,
        recipients: recipients,
        content: content
    }
    const response = await ApiClient.post<ApiResponse>(`/customers/send-email`, payload);
    return response.data;
}

export const getCustomerDetail = async (customerId: string) => {
    const response = await ApiClient.get<ApiResponse<CustomerDetail>>(`/customers/${customerId}`);
    return response.data;
}

export const getCustomerOrders = async (customerId: string, page: number = 1, limit: number = 10) => {
    const params = {
        page: page.toString(),
        limit: limit.toString()
    };
    const response = await ApiClient.get<PaginatedData<CustomerOrder>>(`/customers/${customerId}/orders`, params);
    return response;
}
