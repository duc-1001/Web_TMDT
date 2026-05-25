import { ApiClient } from "@/lib/apiClient"
import {
	FaqAdminFilters,
	FaqAdminListResponse,
	FaqCategoryItem,
	FaqCategoryPayload,
	FaqFormPayload,
	FaqItem,
} from "@/types/faq"

type FaqDetailResponse = {
	status: string
	data: FaqItem
}

type FaqDeleteResponse = {
	status: string
	message: string
}

type FaqCategoryListResponse = {
	status: string
	data: FaqCategoryItem[]
}

type FaqCategoryDetailResponse = {
	status: string
	data: FaqCategoryItem
}

export const getFaqsAdmin = async (params: FaqAdminFilters = {}) => {
	const response = await ApiClient.get<FaqAdminListResponse>("/faqs/admin", params)
	return response
}

export const getFaqByIdAdmin = async (faqId: string) => {
	const response = await ApiClient.get<FaqDetailResponse>(`/faqs/admin/${faqId}`)
	return response.data
}

export const createFaqAdmin = async (payload: FaqFormPayload) => {
	const response = await ApiClient.post<FaqDetailResponse>("/faqs/admin", payload)
	return response.data
}

export const updateFaqAdmin = async (faqId: string, payload: FaqFormPayload) => {
	const response = await ApiClient.put<FaqDetailResponse>(`/faqs/admin/${faqId}`, payload)
	return response.data
}

export const updateFaqStatusAdmin = async (faqId: string, is_active: boolean) => {
	const response = await ApiClient.patch<FaqDetailResponse>(`/faqs/admin/${faqId}/status`, { is_active })
	return response.data
}

export const deleteFaqAdmin = async (faqId: string) => {
	const response = await ApiClient.delete<FaqDeleteResponse>(`/faqs/admin/${faqId}`)
	return response
}

export const getFaqCategoriesAdmin = async () => {
	const response = await ApiClient.get<FaqCategoryListResponse>("/faqs/categories/admin")
	return response.data
}

export const createFaqCategoryAdmin = async (payload: FaqCategoryPayload) => {
	const response = await ApiClient.post<FaqCategoryDetailResponse>("/faqs/categories/admin", payload)
	return response.data
}

export const updateFaqCategoryAdmin = async (categoryId: string, payload: Partial<FaqCategoryPayload>) => {
	const response = await ApiClient.put<FaqCategoryDetailResponse>(`/faqs/categories/admin/${categoryId}`, payload)
	return response.data
}

export const updateFaqCategoryStatusAdmin = async (categoryId: string, is_active: boolean) => {
	const response = await ApiClient.patch<FaqCategoryDetailResponse>(
		`/faqs/categories/admin/${categoryId}/status`,
		{ is_active },
	)
	return response.data
}

export const deleteFaqCategoryAdmin = async (categoryId: string) => {
	const response = await ApiClient.delete<FaqDeleteResponse>(`/faqs/categories/admin/${categoryId}`)
	return response
}

