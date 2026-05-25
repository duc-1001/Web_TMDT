import { z } from "zod"

export const ACCEPTED_IMAGE_TYPES = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
]

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export const HeroBannerSchema = z.object({
    // ===== CONTENT =====
    title: z
        .string()
        .min(1, "Tiêu đề không được để trống")
        .max(120, "Tiêu đề tối đa 120 ký tự"),

    subtitle: z
        .string()
        .max(200, "Tiêu đề phụ tối đa 200 ký tự")
        .optional(),

    // ===== CTA =====
    buttonText: z
        .string()
        .max(30, "Văn bản nút tối đa 30 ký tự")
        .optional(),

    buttonLink: z
        .string()
        .optional(),

    // ===== IMAGE =====
    backgroundImage: z
        .union([z.instanceof(File), z.string()])
        .optional()
        .refine(
            (file) => {
                if (!file || typeof file === "string") return true
                return ACCEPTED_IMAGE_TYPES.includes(file.type)
            },
            { message: "Ảnh chỉ chấp nhận PNG, JPG hoặc WEBP" }
        )
        .refine(
            (file) => {
                if (!file || typeof file === "string") return true
                return file.size <= MAX_FILE_SIZE
            },
            { message: "Dung lượng ảnh tối đa 10MB" }
        ),
})
    .superRefine((data, ctx) => {
        if (data.buttonText && !data.buttonLink) {
            ctx.addIssue({
                path: ["buttonLink"],
                message: "Vui lòng nhập link khi có văn bản nút",
                code: z.ZodIssueCode.custom,
            })
        } else if (data.buttonText && data.buttonLink) {
            if (!data.buttonLink?.startsWith("/")) {
                ctx.addIssue({
                    path: ["buttonLink"],
                    message: "Link nút phải bắt đầu bằng '/'",
                    code: z.ZodIssueCode.custom,
                })
            }
        }
    })

export type HeroBanner = z.infer<typeof HeroBannerSchema>