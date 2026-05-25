import { z } from "zod"

const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"]
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB (tuỳ bạn)

export const brandSchema = z.object({
  name: z
    .string()
    .min(1, "Tên thương hiệu không được để trống")
    .max(100, "Tên thương hiệu không được vượt quá 100 ký tự"),

  logo: z
    .union([z.instanceof(File), z.string()])
    .optional()
    .refine(
      (file) => {
        if (!file || typeof file === "string") return true
        return ACCEPTED_IMAGE_TYPES.includes(file.type)
      },
      { message: "Logo chỉ chấp nhận file PNG, JPG hoặc WEBP" }
    )
    .refine(
      (file) => {
        if (!file || typeof file === "string") return true
        return file.size <= MAX_FILE_SIZE
      },
      { message: "Dung lượng logo tối đa 2MB" }
    ),

  description: z
    .string()
    .max(500, "Mô tả không được vượt quá 500 ký tự")
    .optional(),

  isActive: z.boolean().default(true),
})

export type BrandForm = z.input<typeof brandSchema>
