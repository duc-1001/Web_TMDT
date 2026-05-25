import { ApiClient } from "@/lib/apiClient";
import { ApiResponse,PaginatedData } from "@/types/commons";
import { CreateReviewPayload, EditReviewPayload, Review,AdminReview, ReasonCode } from "@/types/review";

// admin
export const getAllReviewsForAdmin = async (q:string,page: number, limit: number, status: 'all' | 'hidden' | 'visible') => {
  const params = {q, page, limit, status };
  const response = await ApiClient.get<PaginatedData<AdminReview>>("/reviews/admin", params);
  return response;
}

export const hideReview = async (id: string, reasonCode: ReasonCode, reasonText: string) => {
    const response = await ApiClient.patch<ApiResponse<{
      _id:string
      hiddenReasonCode: ReasonCode
      hiddenReasonText: string
    }>>(`/reviews/${id}/hide`, { reasonCode, reasonText });
    return response.data;
}

export const unhideReview = async (id: string) => {
    const response = await ApiClient.patch<ApiResponse<{ _id: string }>>(`/reviews/${id}/unhide`);
    return response.data;
}
