export type FaqItem = {
	_id: string
	question: string
	answer: string
	category: string
	order: number
	is_active: boolean
	created_at?: string | null
	updated_at?: string | null
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

export type FaqApiResponse<T> = {
	status: string
	data: T
}

