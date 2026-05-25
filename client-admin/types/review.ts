/* ================= REVIEW BASE ================= */

export type ReasonCode = "SPAM" | "OFFENSIVE" | "IRRELEVANT" | "OTHER"

export interface ReviewImage {
  url: string
  imagePublicId: string
}

export interface ReviewUser {
  _id: string
  fullName: string
  avatar?: string | null
}

/* ================= PUBLIC REVIEW ================= */

export interface Review {
  _id: string
  productId: string
  rating: number
  comment: string
  isMine: boolean
  images: ReviewImage[]
  createdAt: string
  user: ReviewUser | null
}

export interface OrderReview extends Review {
  hiddenReasonText?: string | null
  hiddenReasonCode?: ReasonCode | null
  isHidden: boolean
}

/* ================= CREATE REVIEW ================= */

export interface CreateReviewPayload {
  productId: string
  orderId: string
  rating: number
  comment?: string
  images?: ReviewImage[]
}

export interface EditReviewPayload {
  rating: number
  comment?: string
  images?: ReviewImage[]
}


/* ================= LIST REVIEW ================= */

export interface ReviewListResponse {
  data: Review[]
  total: number
  page: number
  limit: number
}

/* ================= ADMIN REVIEW ================= */

export interface AdminReview extends Review {
  isHidden: boolean
  hiddenReasonText?: string | null
  hiddenReasonCode?: ReasonCode | null
  hiddenAt?: string | null
  hiddenBy?: string | null
  product: {
    _id: string
    name: string
    slug: string
  }
}