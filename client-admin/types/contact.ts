export type ContactMessageStatus = "new" | "in_progress" | "resolved" | "closed"

export type ContactMessageItem = {
  _id: string
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  status: ContactMessageStatus
  reply_message?: string
  replied_by?: string
  replied_at?: string | null
  last_reply_sent_at?: string | null
  created_at: string
  updated_at: string
}
