import { ApiClient } from "@/lib/apiClient";
import { ContactSettings } from "@/schemas/system.schema";
import { ApiResponse } from "@/types/commons";
import { SystemSettingsPayload } from "@/types/setting";
import { GeneralInfo } from "@/types/system";

// admin

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

// user

export const getGeneralInfo = async () => {
    const response = await ApiClient.get<ApiResponse<GeneralInfo>>(
        '/system/general-info'
    )
    return response.data;
}

export interface HomepageSectionConfig {
    id: string
    label?: string
    type?: "fixed" | "custom"
    enabled: boolean
    order: number
    itemCount?: number
    productIds?: string[]
}

export const getHomepageConfig = async (): Promise<HomepageSectionConfig[]> => {
    try {
        const response = await ApiClient.get<{ success: boolean; data: { sections?: HomepageSectionConfig[] } }>(
            '/system/homepage-config'
        )
        return response.data?.sections ?? []
    } catch {
        return []
    }
}

