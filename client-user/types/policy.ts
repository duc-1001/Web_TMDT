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

export type PolicyApiResponse<T> = {
  status: string
  data: T
}
