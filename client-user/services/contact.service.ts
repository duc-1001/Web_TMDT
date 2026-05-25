import { ApiClient } from "@/lib/apiClient"
import { ApiResponse } from "@/types/commons"
import { ContactMessage, ContactMessagePayload } from "@/types/contact"

export const submitContactMessage = async (payload: ContactMessagePayload) => {
  const response = await ApiClient.post<ApiResponse<ContactMessage>>("/contact/messages", payload)
  return response
}
