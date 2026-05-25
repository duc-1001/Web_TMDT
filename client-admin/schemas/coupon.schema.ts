import { z } from "zod";


export const couponSchema = z.object({
  code: z
    .string()
    .min(3, "Mã khuyến mãi phải có ít nhất 3 ký tự")
    .max(20, "Mã khuyến mãi tối đa 20 ký tự")
    .regex(/^[A-Z0-9]+$/, "Chỉ chấp nhận chữ cái in hoa và số"),
  name: z.string().min(5, "Tên khuyến mãi phải có ít nhất 5 ký tự"),
  description: z.string().min(10, "Mô tả phải có ít nhất 10 ký tự"),
  type: z.enum(["percentage", "fixed"]),
  applyTo: z.literal("order"),
  discountValue: z
    .number()
    .min(1, "Giá trị giảm phải lớn hơn 0"),
  maxDiscountValue: z.number().min(0).optional(),
  minOrderValue: z.number().min(0, "Giá trị đơn tối thiểu phải >= 0").optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  startDate: z.string().min(1, "Vui lòng chọn ngày bắt đầu"),
  endDate: z.string().min(1, "Vui lòng chọn ngày kết thúc"),
  userCondition: z.enum(["all", "new", "vip"]).optional(),
  maxUsageCount: z.number().min(0).optional(),
  maxUsagePerUser: z.number().min(0).optional(),
  stackable: z.boolean().optional(),
  isActive: z.boolean().optional(),
  applyToAllCategories: z.literal(true),
  applicableCategories: z.array(z.string()).default([]),
  applicableProducts: z.array(z.string()).default([]),
}).refine(
  (data) => new Date(data.startDate) < new Date(data.endDate),
  {
    message: "Ngày kết thúc phải sau ngày bắt đầu",
    path: ["endDate"],
  }
);

export type CouponFormData = z.infer<typeof couponSchema>;