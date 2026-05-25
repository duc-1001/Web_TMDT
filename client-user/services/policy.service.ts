import { ApiClient } from "@/lib/apiClient"
import { PolicyApiResponse, PolicyItem, PolicyType } from "@/types/policy"

export const getPoliciesPublic = async (params?: { type?: PolicyType; q?: string }) => {
  const response = await ApiClient.get<PolicyApiResponse<PolicyItem[]>>("/policies", params)
  return response.data
}

export const getPolicyPublicDetail = async (identifier: string) => {
  const response = await ApiClient.get<PolicyApiResponse<PolicyItem>>(`/policies/detail/${identifier}`)
  return response.data
}

export const getPolicyTypes = async () => {
  const response = await ApiClient.get<PolicyApiResponse<Array<{ value: PolicyType; label: string }>>>("/policies/types")
  return response.data
}
