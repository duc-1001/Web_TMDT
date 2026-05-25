import { ApiClient } from "@/lib/apiClient"
import type { AboutApiResponse, AboutItem } from "@/types/about"

export const getAboutPublic = async () => {
  const response = await ApiClient.get<AboutApiResponse<AboutItem>>("/about")
  return response.data
}
