export type FaqCategory = string

export type FaqItem = {
	_id: string
	question: string
	answer: string
	category: FaqCategory
	order: number
	is_active: boolean
	created_at?: string | null
	updated_at?: string | null
}

export type FaqFormPayload = {
	question: string
	answer: string
	category: FaqCategory
	order: number
	is_active: boolean
}

export type FaqAdminFilters = {
	page?: number
	limit?: number
	q?: string
	category?: FaqCategory
	is_active?: boolean
}

export type FaqAdminListResponse = {
	status: string
	data: FaqItem[]
	pagination: {
		page: number
		limit: number
		total: number
		totalPages: number
	}
}

export type FaqCategoryItem = {
	_id: string
	key: string
	name: string
	order: number
	is_active: boolean
	created_at?: string | null
	updated_at?: string | null
}

export type FaqCategoryPayload = {
	name: string
	order?: number
	is_active?: boolean
}

