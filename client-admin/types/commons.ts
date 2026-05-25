// client/src/types/common.ts
export interface ApiResponse<T = undefined> {
  success: boolean;
  message?: string;
  data?: T;
}


export interface PaginatedData<T> {
  "data": T[];
  "pagination": {
    "total": number;
    "page": number;
    "limit": number;
    "totalPages": number;
  },
}