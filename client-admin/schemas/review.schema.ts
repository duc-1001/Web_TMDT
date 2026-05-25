import { z } from "zod";

const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB (tuỳ bạn)


const existingImageSchema = z.object({
  url: z.string(),
  imagePublicId: z.string(),
})

const fileImageSchema = z
  .instanceof(File)
  .refine(
    (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
    { message: "Ảnh chỉ chấp nhận PNG, JPG hoặc WEBP" }
  )
  .refine(
    (file) => file.size <= MAX_FILE_SIZE,
    { message: "Dung lượng ảnh tối đa 10MB" }
  )

export const reviewSchema = z.object({
  rating: z
    .number({ message: "Vui lòng nhập đánh giá" })
    .min(1, "Đánh giá phải từ 1 sao")
    .max(5, "Đánh giá tối đa 5 sao"),

  comment: z
    .string()
    .max(1000, "Bình luận không được vượt quá 1000 ký tự")
    .optional(),

  images: z
    .array(z.union([fileImageSchema, existingImageSchema]))
    .max(5, "Tối đa 5 ảnh")
    .optional(),
})

export type ReviewFormData = z.infer<typeof reviewSchema>;
