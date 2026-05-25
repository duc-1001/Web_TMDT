import { CategoryForSelect } from "./category";

// coupon.types.ts
export interface Coupon {
  _id: string;
  code: string;
  name: string;
  description: string;
  type: CouponType; // chỉ còn 'percentage' | 'fixed'
  value: number;
  minOrderValue: number;
  maxDiscountValue: number;
  applyTo: CouponApplyTo; // chỉ còn 'order'
  applyToAllCategories: true;
  applicableProducts: [];
  applicableCategories: [];
  // Thời gian
  startDate: string;
  endDate: string;
  // Giới hạn sử dụng
  maxUsageCount: number;
  usageCount: number;
  maxUsagePerUser: number;
  // Trạng thái & flags
  isActive: boolean;
  status: CouponStatus;
  priority: CouponPriority;
  userCondition: UserCondition;
  stackable: boolean;
  createdAt: string;
  updatedAt: string;
}

// type cho type và status
export type CouponType = "percentage" | "fixed"

export type CouponStatus = "active" | "scheduled" | "expired" | "exhausted" | "inactive"

export type UserCondition = "all" | "new" | "vip"

export type CouponPriority = "low" | "medium" | "high"

export type CouponApplyTo = "order"


export type CouponAvailable = {
  _id: string
  code: string
  name: string
  description: string
  type: CouponType
  value: number
  maxDiscountValue: number
  minOrderValue: number
  usageCount: number
  maxUsageCount: number
  maxUsagePerUser: number
  stackable: boolean
  eligible: boolean
  reason: string
  requireLoginToUse: boolean
  estimatedDiscount: number
}
