import { CategoryForSelect } from "./category";

// coupon.types.ts
export interface Coupon {
    _id: string;                    // ObjectId as string
    code: string;                  // mã khuyến mãi duy nhất
    name: string;                   // tên khuyến mãi
    description: string;           // mô tả chi tiết
    type: CouponType;            // loại khuyến mãi

    // Điều kiện áp dụng
    value: number;                  // giá trị giảm (%, số tiền cố định...)
    minOrderValue: number;         // đơn tối thiểu để áp dụng
    maxDiscountValue: number;     // giới hạn giảm tối đa (nếu là %)

    applyTo: CouponApplyTo;
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
    status: CouponStatus;        // trạng thái hiện tại (từ scheduler hoặc realtime)

    // Các trường bổ sung tùy dự án
    applicableProducts: {_id: string,name: string}[];  // danh sách product ID áp dụng (nếu không phải all)
    applicableCategories: CategoryForSelect[];
    excludedProducts: string[];

    priority: CouponPriority;
    userCondition: UserCondition;        // điều kiện người dùng (mới, VIP, tất cả)
    stackable: boolean;            // có thể dùng chung với khuyến mãi khác không

    createdAt: string;
    updatedAt: string;
}

// type cho type và status
export type CouponType = "percentage" | "fixed" | "buy_x_get_y" | "shipping"

export type CouponStatus = "active" | "scheduled" | "expired" | "exhausted" | "inactive"

export type UserCondition = "all" | "new" | "vip"

export type CouponPriority = "low" | "medium" | "high"

export type CouponApplyTo = "order" | "product"


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
