import { CategoryForSelect } from "./category";

// Discount.types.ts
export interface DiscountAdmin {
    _id: string;                    // ObjectId as string
    code: string;                  // mã khuyến mãi duy nhất
    name: string;                   // tên khuyến mãi
    description: string;           // mô tả chi tiết
    type: DiscountType;            // loại khuyến mãi
    image: string;                 // URL ảnh khuyến mãi

    // Điều kiện áp dụng
    value: number;                  // giá trị giảm (%, số tiền cố định...)
    minOrderValue: number;         // đơn tối thiểu để áp dụng
    maxDiscountValue: number;     // giới hạn giảm tối đa (nếu là %)

    applyTo: DiscountApplyTo;
    applyToAllCategories: boolean;

    // Thời gian
    startDate: string;      // ISO string hoặc null (vô thời hạn bắt đầu)
    endDate: string;        // ISO string hoặc null (vô thời hạn kết thúc)

    // Giới hạn sử dụng
    maxUsageCount: number;         // tổng lượt dùng tối đa (0 = không giới hạn)
    usageCount: number;             // đã dùng bao nhiêu lần
    maxUsagePerUser: number;          // lượt dùng tối đa mỗi user (0 = không giới hạn)

    // Trạng thái & flags
    isActive: boolean;
    isFeature: boolean;
    status: DiscountStatus;        // trạng thái hiện tại (từ scheduler hoặc realtime)

    // Các trường bổ sung tùy dự án
    applicableProducts: { _id: string, name: string }[];  // danh sách product ID áp dụng (nếu không phải all)
    applicableCategories: CategoryForSelect[];
    excludedProducts: string[];

    priority: DiscountPriority;
    userCondition: UserCondition;        // điều kiện người dùng (mới, VIP, tất cả)
    stackable: boolean;            // có thể dùng chung với khuyến mãi khác không

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
export type DiscountType = "percentage" | "fixed" | "buy_x_get_y" | "shipping"

export type DiscountStatus = "active" | "scheduled" | "expired" | "exhausted" | "inactive"

export type UserCondition = "all" | "new" | "vip"

export type DiscountPriority = "low" | "medium" | "high"

export type DiscountApplyTo = "order" | "product"