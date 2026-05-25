import { CategoryForSelect } from "./category";

// Discount.types.ts
export interface DiscountAdmin {
    _id: string;
    code: string;
    name: string;
    description: string;
    type: DiscountType; // chỉ còn 'percentage' | 'fixed'
    image: string;
    value: number;
    minOrderValue: number;
    maxDiscountValue: number;
    applyTo: DiscountApplyTo; // chỉ còn 'order'
    applyToAllCategories: true;
    applicableProducts: [];
    applicableCategories: [];
    startDate: string;
    endDate: string;
    maxUsageCount: number;
    usageCount: number;
    maxUsagePerUser: number;
    isActive: boolean;
    isFeature: boolean;
    status: DiscountStatus;
    priority: DiscountPriority;
    userCondition: UserCondition;
    stackable: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Discount {
    _id: string;
    // Hiển thị
    name: string;
    description: string;
    image: string;
    isFeature: boolean;

    // Giảm giá
    type: DiscountType;          // percentage | fixed | shipping
    value: number;
    maxDiscountValue?: number;
    minOrderValue?: number;

    maxUsageCount: number;         // tổng lượt dùng tối đa (0 = không giới hạn)
    usageCount: number;             // đã dùng bao nhiêu lần
    maxUsagePerUser: number;

    // Phạm vi áp dụng (để FE check nhanh)
    applyTo: DiscountApplyTo;
    applicableProducts?: { _id: string; name: string }[];
    applicableCategories?: CategoryForSelect[];

    // Điều kiện cơ bản
    userCondition?: UserCondition;

    // Thời gian (để FE hiển thị badge)
    startDate: string;
    endDate: string;

    // Cờ trạng thái đơn giản
    isActive: boolean;
    stackable: boolean;
}

export interface AppliedDiscount {
    _id: string;
    code: string;
    name: string;
    description: string;
    amount: number;
    type: DiscountType;
    value: number;
}

export type DiscountAvailable = {
  _id: string
  code: string
  name: string
  description: string

  type: DiscountType
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

// type cho type và status
export type DiscountType = "percentage" | "fixed"

export type DiscountStatus = "active" | "scheduled" | "expired" | "exhausted" | "inactive"

export type UserCondition = "all" | "new" | "vip"

export type DiscountPriority = "low" | "medium" | "high"

export type DiscountApplyTo = "order"