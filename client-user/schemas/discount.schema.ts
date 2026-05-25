import { z } from "zod";

const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024

export const DiscountSchema = z.object({
  image: z
    .union([z.instanceof(File), z.string()])
    .refine(
      (file) => file !== undefined && file !== null && file !== "",
      { message: "Vui lòng chọn ảnh khuyến mãi" }
    )
    .refine(
      (file) =>
        typeof file === "string" ||
        ACCEPTED_IMAGE_TYPES.includes(file.type),
      { message: "Ảnh chỉ chấp nhận định dạng PNG, JPG hoặc WEBP" }
    )
    .refine(
      (file) =>
        typeof file === "string" || file.size <= MAX_FILE_SIZE,
      { message: "Dung lượng ảnh tối đa 10MB" }
    ),
  code: z
    .string()
    .min(3, "Mã khuyến mãi phải có ít nhất 3 ký tự")
    .max(20, "Mã khuyến mãi tối đa 20 ký tự")
    .regex(/^[A-Z0-9]+$/, "Chỉ chấp nhận chữ cái in hoa và số"),
  name: z.string().min(5, "Tên khuyến mãi phải có ít nhất 5 ký tự"),
  description: z.string().min(10, "Mô tả phải có ít nhất 10 ký tự"),
  type: z.enum(["percentage", "fixed", "shipping", "buy_x_get_y"]),
  applyTo: z.enum(["order", "product"]),
  discountValue: z
    .number()
    .min(0, "Giá trị giảm phải lớn hơn hoặc bằng 0")
    .optional(),
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
  isFeature: z.boolean().optional(),
  applyToAllCategories: z.boolean().optional(),
  // Nếu muốn validate categories/products nghiêm ngặt hơn, có thể thêm:
  applicableCategories: z.array(z.string()).optional(),
  applicableProducts: z.array(z.string()).optional(),
}).refine(
  (data) => {
    if (data.type === "percentage" || data.type === "fixed") {
      return data.discountValue !== undefined && data.discountValue > 0;
    }
    return true;
  },
  {
    message: "Giá trị giảm là bắt buộc và phải > 0 cho loại percentage/fixed",
    path: ["discountValue"],
  }
).refine(
  (data) => new Date(data.startDate) < new Date(data.endDate),
  {
    message: "Ngày kết thúc phải sau ngày bắt đầu",
    path: ["endDate"],
  }
);

export type DiscountFormData = z.infer<typeof DiscountSchema>;