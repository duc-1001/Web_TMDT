export type PolicyType = "shipping" | "return" | "payment" | "privacy" | "terms"

export type PolicyStatus = "published" | "draft" | "archived"

export type PolicyItem = {
  _id: string
  type: PolicyType
  title: string
  slug: string
  content: string
  status: PolicyStatus
  version: number
  author: string
  created_at?: string | null
  updated_at?: string | null
  published_at?: string | null
}

export type PolicyPayload = {
  type: PolicyType
  title: string
  slug?: string
  content: string
  status?: PolicyStatus
  version?: number
  author?: string
}

export type PolicyAdminFilters = {
  page?: number
  limit?: number
  q?: string
  type?: PolicyType
  status?: PolicyStatus
}

export type PolicyAdminListResponse = {
  status: string
  data: PolicyItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
