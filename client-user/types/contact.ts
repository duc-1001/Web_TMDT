export type ContactMessagePayload = {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
}

export type ContactMessage = {
  _id: string
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  status: "new" | "in_progress" | "resolved" | "closed"
  created_at: string
  updated_at: string
}
