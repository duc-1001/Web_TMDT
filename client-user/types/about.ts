export type AboutStatus = "published" | "draft" | "archived"

export type AboutSection = {
  title: string
  content: string
  image: string
  layout: "text-left" | "text-right"
}

export type AboutItem = {
  _id: string
  key: "about"
  title: string
  content: string
  sections?: AboutSection[]
  status: AboutStatus
  version: number
  author: string
  created_at?: string | null
  updated_at?: string | null
  published_at?: string | null
}

export type AboutApiResponse<T> = {
  status: string
  data: T
}
