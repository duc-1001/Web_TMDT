import { ApiClient } from "@/lib/apiClient"
import { PaginatedData } from "@/types/commons"
import { ContactMessageItem, ContactMessageStatus } from "@/types/contact"

export const getContactMessagesAdmin = async (
  q?: string,
  status?: ContactMessageStatus | "all",
  page?: number,
  limit?: number,
) => {
  const params: any = {}
  if (q) params.q = q
  if (status && status !== "all") params.status = status
  if (page) params.page = page
  if (limit) params.limit = limit

  const response = await ApiClient.get<PaginatedData<ContactMessageItem>>("/contact/messages/admin", params)
  return response
}

export const updateContactMessageStatusAdmin = async (messageId: string, status: ContactMessageStatus) => {
  const response = await ApiClient.patch<{ status: string; data: ContactMessageItem }>(
    `/contact/messages/admin/${messageId}/status`,
    { status },
  )
  return response
}

export const replyContactMessageAdmin = async (messageId: string, replyMessage: string) => {
  const response = await ApiClient.patch<{ status: string; message: string; data: ContactMessageItem }>(
    `/contact/messages/admin/${messageId}/reply`,
    { reply_message: replyMessage },
  )
  return response
}
