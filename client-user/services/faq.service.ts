import { ApiClient } from "@/lib/apiClient"
import { FaqApiResponse, FaqCategoryItem, FaqItem } from "@/types/faq"

export const getFaqCategories = async () => {
	const response = await ApiClient.get<FaqApiResponse<FaqCategoryItem[]>>("/faqs/categories")
	return response.data
}

export const getFaqs = async (category?: string) => {
	const response = await ApiClient.get<FaqApiResponse<FaqItem[]>>("/faqs", {
		category: category || undefined,
	})
	return response.data
}

