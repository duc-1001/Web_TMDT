import { ApiClient } from "@/lib/apiClient";
import { buildFormData } from "@/lib/formData";
import { CategoryForm } from "@/schemas/category.schema";
import { Category, CategoryForSelect, CategoryTree, ProductCategory } from "@/types/category";
import { ApiResponse } from "@/types/commons";

export const createCategory = async (data: CategoryForm) => {
    const formData = buildFormData(data);
    const response = await ApiClient.post<ApiResponse>('/categories', formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response;
}

export const editCategory = async (id: string, data: CategoryForm) => {
    const formData = buildFormData(data);
    const response = await ApiClient.put<ApiResponse>(`/categories/${id}`, formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response;
}

export const deleteCategory = async (id: string) => {
    const response = await ApiClient.delete<ApiResponse>(`/categories/${id}`);
    return response;
}

export const getAllCategoriesAdmin = async () => {
    const response = await ApiClient.get<ApiResponse<Category[]>>('/categories/admin');
    return response.data;
}

export const changeCategoryStatus = async (id: string) => {
    const response = await ApiClient.patch<ApiResponse>(`/categories/${id}/status`);
    return response;
}

export const moveCategory = async (categoryId: string, targetId: string | null, position: 'inside' | 'before' | 'after') => {
    const response = await ApiClient.post<ApiResponse>('/categories/move', {
        categoryId,
        targetId,
        position
    });
    return response;
}

export const getAllCategoriesForProduct = async () => {
    const response = await ApiClient.get<ApiResponse<ProductCategory[]>>('/categories/for-product');
    return response.data;
}

export const getCategories = async (parentId?: string, isFeatured?: boolean, type?: string) => {
    const params: Record<string, string> = {};
    if (parentId) params.parentId = parentId;
    if (isFeatured !== undefined) params.isFeatured = isFeatured.toString();
    if (type) params.type = type;
    const response = await ApiClient.get<ApiResponse<Category[]>>('/categories',  params );
    return response.data;
}

export const getCategoryRootTree = async () => {
    const response = await ApiClient.get<ApiResponse<CategoryTree[]>>('/categories',{ parentId: null, type: "tree" } );
    return response.data;
}

export const getCategoryForSelect = async () => {
    const response = await ApiClient.get<ApiResponse<CategoryForSelect[]>>('/categories/for-select');
    return response.data;
}

