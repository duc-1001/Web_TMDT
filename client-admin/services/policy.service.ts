import { ApiClient } from "@/lib/apiClient"
import {
  PolicyAdminFilters,
  PolicyAdminListResponse,
  PolicyItem,
  PolicyPayload,
  PolicyStatus,
  PolicyType,
} from "@/types/policy"

type PolicyDetailResponse = {
  status: string
  data: PolicyItem
}

type PolicyDeleteResponse = {
  status: string
  message: string
}

type PolicyTypesResponse = {
  status: string
  data: Array<{ value: PolicyType; label: string }>
}

export const getPoliciesAdmin = async (params: PolicyAdminFilters = {}) => {
  const response = await ApiClient.get<PolicyAdminListResponse>("/policies/admin", params)
  return response
}

export const getPolicyByIdAdmin = async (policyId: string) => {
  const response = await ApiClient.get<PolicyDetailResponse>(`/policies/admin/${policyId}`)
  return response.data
}

export const createPolicyAdmin = async (payload: PolicyPayload) => {
  const response = await ApiClient.post<PolicyDetailResponse>("/policies/admin", payload)
  return response.data
}

export const updatePolicyAdmin = async (policyId: string, payload: PolicyPayload) => {
  const response = await ApiClient.put<PolicyDetailResponse>(`/policies/admin/${policyId}`, payload)
  return response.data
}

export const updatePolicyStatusAdmin = async (policyId: string, status: PolicyStatus) => {
  const response = await ApiClient.patch<PolicyDetailResponse>(`/policies/admin/${policyId}/status`, { status })
  return response.data
}

export const deletePolicyAdmin = async (policyId: string) => {
  const response = await ApiClient.delete<PolicyDeleteResponse>(`/policies/admin/${policyId}`)
  return response
}

export const getPolicyTypes = async () => {
  const response = await ApiClient.get<PolicyTypesResponse>("/policies/types")
  return response.data
}
