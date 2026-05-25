import { InforUserCheckout } from "@/app/(user-layout)/checkout/page"
import { GuestCartItem } from "./cart"
import { AppliedDiscount } from "./discount"

/* ================= USER SIDE ================= */

export interface OrderPayload {
  items: GuestCartItem[]
  shippingAddress: InforUserCheckout
  paymentMethod: PaymentMethod
  couponCodes?: string[]
}

export interface OrderResponse {
  orderId: string
  orderCode: string
  totalAmount: number
  expireAt: string
  paymentMethod: PaymentMethod
  qrPayload: string
  qrBase64: string
  paymentUrl?: string
}

export type PaymentMethod = "cod" | "banking" | "momo" | "vnpay"

export type PaymentStatus = "unpaid" | "paid" | "refunded" | "failed" | "expired"| "partially_refunded"

export type OrderStatus = "pending" | "confirmed" | "shipping" | "delivered" | "completed" | "cancelled" | "failed"

export type OrderStatusForWorkflow = "pending" | "confirmed" | "shipping" |  "failed"

export interface OrderItemSnapshot {
  productId: string
  name: string
  price: number
  quantity: number
  image?: {
    url: string
  }
}

export interface ShippingAddress {
  fullName: string
  phone: string
  address: string
  province?: {
    code: string
    name: string
  }
  ward?: {
    code: string
    name: string
  }
  email?: string
}

export interface PaymentDisplayInfo {
  qrBase64?: string | null
  qrPayload?: string | null
  expiredAt?: string | null
  method: PaymentMethod
  status: PaymentStatus
  paymentUrl?: string | null
  canPay: boolean
}

export interface SuccessOrderResponse {
  orderCode: string
  status: OrderStatus
  totalAmount: number
  shippingFee: number
  discountAmount: number
  items: OrderItemSnapshot[]
  shippingAddress: ShippingAddress
  payment: {
    method: "cod" | "banking" | "momo" | "vnpay"
    status: "paid" | "unpaid"
    // QR
    qrBase64?: string
    qrPayload?: string
    // VNPAY
    paymentUrl?: string
  }
  createdAt: string
  viewToken: string
  // 🔥 optional (rất nên có)
  expireAt?: string
}

/* ================= ADMIN SIDE ================= */


export type ShippingCarrier = "GHN" | "GHTK" | "VNPost"

export type ShippingStatus =
  | "pending"
  | "picked"
  | "in_transit"
  | "delivered"
  | "failed"
  | "returned"

export interface ShippingInfo {
  carrier?: ShippingCarrier
  trackingCode?: string
  shippingStatus: ShippingStatus
  shippedAt?: string
  deliveredAt?: string
}

export type PaymentLogType = "charge" | "refund"

export interface PaymentLog {
  _id: string
  type: PaymentLogType
  amount: number
  status: "pending" | "success" | "failed"
  transactionId?: string
  note?: string
  createdAt: string
}

export type StaffRole = "admin" | "cs" | "warehouse" | "accountant"

export interface AssignedStaff {
  _id: string
  name: string
  role: StaffRole
}


export interface AdminOrderListItem {
  _id: string
  orderCode: string

  customer: {
    _id: string
    name: string
    phone: string
    email: string
  }

  totalAmount: number

  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  status: OrderStatus

  assignedStaff?: AssignedStaff | null

  createdAt: string
  updatedAt?: string | null

  confirmedAt?: string | null
  packedAt?: string | null
  shippedAt?: string | null
  deliveredAt?: string | null

  // nếu có SLA thì thêm
  slaAt?: string | null
  timeline: TimelineItem[]
}

export interface TimelineItem {
  event: string
  time: Date
  from: OrderStatus | null
  to: OrderStatus
}

export interface MyOrderListItem {
  _id: string
  orderCode: string
  createdAt: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  totalAmount: number
  shippingFee: number
  shippingDiscount: number
  items: OrderItemSnapshot[]
  viewToken: string
}

export interface OrderShippingInfo {
  _id: string
  orderCode: string
  status: OrderStatus
  timeline: TimelineItem[]
  items: OrderItemSnapshot[]
  shippingAddress: ShippingAddress
  pricing: PricingInfo,
  payment: PaymentDisplayInfo
  viewToken: string,
  createdAt: string,
  refundStatus: RefundStatus
}

export type RefundStatus = "none" | "pending" | "partial" | "full";

export interface PricingInfo {
  subtotal: number
  shippingFee: number
  discountAmount: number
  total: number
  appliedDiscounts: AppliedDiscount[]
  shippingDiscount?: number
}

export interface AdminOrderDetail {
  _id: string
  orderCode: string
  customer: {
    _id: string
    name: string
    phone: string
    email: string
  }
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod
  subtotal: number
  shippingFee: number
  discountAmount: number
  totalAmount: number
  shippingDiscount: number
  items: OrderItemSnapshot[]
  shippingAddress: ShippingAddress
  payment: PaymentDisplayInfo
  paymentLogs: PaymentLog[]
  shippingInfo: ShippingInfo
  assignedStaff?: AssignedStaff | null
  timeline: TimelineItem[]
  note: string
  createdAt: string
  updatedAt?: string
  confirmedAt?: string
  packedAt?: string
  shippedAt?: string
  deliveredAt?: string
  completedAt?: string
  cancelledAt?: string
  refundedAt?: string

  refundedAmount: number
  refundStatus: RefundStatus
}


export interface AdminOrderSummary {
  pending: number
  shipping: number
  completedToday: number
  revenueToday: number
}