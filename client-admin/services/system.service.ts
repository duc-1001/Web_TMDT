import { ApiClient } from "@/lib/apiClient";
import { ContactSettings } from "@/schemas/system.schema";
import { ApiResponse } from "@/types/commons";
import { SystemSettingsPayload } from "@/types/setting";


export const updateSettingBySection = async <T>(
  section: string,
  data: T
) => {
  const response = await ApiClient.put<ApiResponse<T>>(
    `/admin/settings/${section}`,
    data
  )
  return response.data
}


export const getSettingBySection = async <T>(section: string) => {
  const response = await ApiClient.get<ApiResponse<T>>(
    `/admin/settings/${section}`
  )
  return response.data
}
