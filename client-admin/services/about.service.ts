import { ApiClient } from "@/lib/apiClient"
import type { AboutItem, AboutPayload } from "@/types/about"

type AboutDetailResponse = {
  status: string
  data: AboutItem
}

export const getAboutAdmin = async () => {
  const response = await ApiClient.get<AboutDetailResponse>("/about/admin")
  return response.data
}

export const updateAboutAdmin = async (payload: AboutPayload) => {
  const response = await ApiClient.put<AboutDetailResponse>("/about/admin", payload)
  return response.data
}
