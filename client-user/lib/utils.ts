import { OrderStatus } from "@/types/order"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price)
}

export const formatDateInput = (date?: Date) => {
  if (!date) return ""
  return date.toISOString().split("T")[0]
}

export const formatDateTimeLocal = (date?: Date) => {
  if (!date) return ""
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16)
}

export const formatDate = (date: string | Date) => {
  const d = new Date(date)
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export const formatDateTime = (date: string | Date) => {
  const d = new Date(date)
  return d.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export function getEventRemainingTime(
  startAt?: string | Date,
  endAt?: string | Date
): string | null {
  if (!startAt || !endAt) return null

  const now = new Date()
  const start = new Date(startAt)
  const end = new Date(endAt)

  // Chưa bắt đầu
  if (now < start) {
    return "Sắp diễn ra"
  }

  // Đã kết thúc
  if (now >= end) {
    return "Đã kết thúc"
  }

  const diffMs = end.getTime() - now.getTime()

  const minuteMs = 1000 * 60
  const hourMs = minuteMs * 60
  const dayMs = hourMs * 24
  const monthMs = dayMs * 30 // quy ước 1 tháng = 30 ngày

  // Ưu tiên đơn vị lớn nhất
  const months = Math.floor(diffMs / monthMs)
  if (months >= 1) {
    return `Còn lại: ${months} tháng`
  }

  const days = Math.floor(diffMs / dayMs)
  if (days >= 1) {
    return `Còn lại: ${days} ngày`
  }

  const hours = Math.floor(diffMs / hourMs)
  if (hours >= 1) {
    return `Còn lại: ${hours} giờ`
  }

  const minutes = Math.floor(diffMs / minuteMs)
  return `Còn lại: ${minutes} phút`
}

export const getStatusColor = (status: OrderStatus): string => {
  const colors: Record<OrderStatus, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    shipping: "bg-cyan-100 text-cyan-800",
    delivered: "bg-green-100 text-green-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    failed: "bg-red-100 text-red-800",
  }
  return colors[status] || "bg-gray-100 text-gray-800"
}


export const ORDER_STEPS = [
    { value: 'pending', label: 'Chờ xác nhận' },
    { value: 'confirmed', label: 'Đã xác nhận' },
    { value: 'shipping', label: 'Đang giao' },
    { value: 'delivered', label: 'Đã giao' },
    { value: 'completed', label: 'Hoàn tất' }
] as const

export const ORDER_STEPS_LABEL: Record<string, string> = {
  pending: "Đang xử lý",
  confirmed: "Đã xác nhận",
  shipping: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
  completed: "Hoàn thành",
};

export const HIDE_REVIEW_REASONS = [
    { value: "SPAM", label: "Spam / quảng cáo" },
    { value: "OFFENSIVE", label: "Ngôn từ không phù hợp" },
    { value: "IRRELEVANT", label: "Không liên quan đến sản phẩm" }
] 


export const PAYMENT_NAME: Record<string, string> = {
    cod: "Thanh toán khi nhận hàng",
    banking: "Chuyển khoản ngân hàng",
    momo: "Momo",
    vnpay: "VnPay"
}