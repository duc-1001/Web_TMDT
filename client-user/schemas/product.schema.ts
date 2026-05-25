import { z } from "zod";


const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB (tuỳ bạn)

export const productSchema = z
    .object({
        // ===== THÔNG TIN CƠ BẢN =====
        name: z
            .string()
            .min(1, "Tên sản phẩm không được để trống")
            .max(200, "Tên sản phẩm không được vượt quá 200 ký tự"),

        description: z
            .string()
            .max(500, "Mô tả sản phẩm không được vượt quá 500 ký tự")
            .optional(),

        shortDescription: z
            .string()
            .min(20, "Mô tả ngắn tối thiểu 20 ký tự")
            .max(160, "Tối đa 160 ký tự"),

        highlights: z
            .array(z.string().min(3))
            .max(6, "Tối đa 6 ưu điểm")
            .optional(),

        // ===== GIÁ =====
        price: z
            .number()
            .gt(0, "Giá bán phải lớn hơn 0"),

        originalPrice: z
            .number()
            .min(0, "Giá gốc phải lớn hơn hoặc bằng 0")
            .optional(),

        importPrice: z
            .number()
            .optional(),

        // ===== HÌNH ẢNH =====
        images: z
            .array(
                z
                    .union([z.instanceof(File), z.string()])
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
                    )
            )
            .min(1, "Phải có ít nhất một hình ảnh"),

        // ===== PHÂN LOẠI =====
        category: z.object({
            _id: z.string().min(1, "Phải chọn một danh mục"),
            name: z.string(),
        }),

        brand: z.object({
            _id: z.string().min(1, "Phải chọn một thương hiệu"),
            name: z.string(),
        }),

        // ===== TRỌNG LƯỢNG =====
        weight: z
            .number()
            .positive("Trọng lượng phải lớn hơn 0"),

        unit: z.enum(["g", "kg", "ml", "l"], {
            message: "Đơn vị phải là g, kg, ml hoặc lít",
        }),

        // ===== ĐỒ ĂN VẶT =====
        expirationDate: z
            .date()
            .optional(),

        ingredient: z
            .string()
            .max(300, "Thành phần không được vượt quá 300 ký tự")
            .optional(),

        allergens: z.array(z.string()).optional(),

        storageInstruction: z
            .string()
            .max(200, "Hướng dẫn bảo quản không được vượt quá 200 ký tự")
            .optional(),

        origin: z
            .string()
            .max(100, "Xuất xứ không được vượt quá 100 ký tự")
            .optional(),

        // ===== QUẢN LÝ =====
        stock: z
            .number()
            .optional(),


        sku: z.string().optional(),

        isFeatured: z.boolean(),

        isActive: z.boolean().optional(),

        tags: z.string().optional(),

        isInitialStock: z.boolean().optional(),
    })

    // ===== LOGIC ĐIỀU KIỆN =====
    .superRefine((data, ctx) => {
        if (data.isInitialStock === true) {
            // BẮT BUộc có stock
            if (data.stock === undefined || data.stock <= 0) {
                ctx.addIssue({
                    path: ["stock"],
                    message: "Phải nhập số lượng tồn kho khi khởi tạo tồn kho ban đầu",
                    code: z.ZodIssueCode.custom,
                })
            }
            if (data.importPrice === undefined || data.importPrice <= 0) {
                ctx.addIssue({
                    path: ["importPrice"],
                    message: "Phải nhập giá nhập khi khởi tạo tồn kho ban đầu",
                    code: z.ZodIssueCode.custom,
                })
            }



            // BẮT BUỘC có expirationDate
            if (!data.expirationDate) {
                ctx.addIssue({
                    path: ["expirationDate"],
                    message: "Phải nhập hạn sử dụng khi khởi tạo tồn kho ban đầu",
                    code: z.ZodIssueCode.custom,
                })
            }
            else {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const expDate = new Date(data.expirationDate);
                expDate.setHours(0, 0, 0, 0);
                if (expDate <= today) {
                    ctx.addIssue({
                        path: ["expirationDate"],
                        message: "Hạn sử dụng phải lớn hơn ngày hiện tại",
                        code: z.ZodIssueCode.custom,
                    })
                }
            }
        }
    })

export const productSchemaEdit = z.object({
    // ===== THÔNG TIN CƠ BẢN =====
    name: z
        .string()
        .min(1, "Tên sản phẩm không được để trống")
        .max(200, "Tên sản phẩm không được vượt quá 200 ký tự"),

    description: z
        .string()
        .max(500, "Mô tả sản phẩm không được vượt quá 500 ký tự")
        .optional(),

    shortDescription: z
        .string()
        .min(20, "Mô tả ngắn tối thiểu 20 ký tự")
        .max(160, "Tối đa 160 ký tự"),

    highlights: z
        .array(z.string().min(3))
        .max(6, "Tối đa 6 ưu điểm")
        .optional(),
    // ===== GIÁ =====
    price: z.number().gt(0, "Giá bán phải lớn hơn 0"),

    images: z.array(
        z
            .union([z.instanceof(File), z.string()])
            .optional()
            .refine(
                (file) => {
                    if (!file || typeof file === "string") return true
                    return ACCEPTED_IMAGE_TYPES.includes(file.type)
                },
                { message: "Ảnh chỉ chấp nhận file PNG, JPG hoặc WEBP" }
            )
            .refine(
                (file) => {
                    if (!file || typeof file === "string") return true
                    return file.size <= MAX_FILE_SIZE
                },
                { message: "Dung lượng ảnh tối đa 2MB" }
            ),
    ).min(1, "Phải có ít nhất một hình ảnh"),

    originalPrice: z
        .number()
        .min(0, "Giá gốc phải lớn hơn hoặc bằng 0")
        .optional(),

    // ===== PHÂN LOẠI =====
    category: z.object({
        _id: z.string().min(1, "Phải chọn một danh mục"),
        name: z.string(),
    }),

    brand: z.object({
        _id: z.string().min(1, "Phải chọn một thương hiệu"),
        name: z.string(),
    }),

    // ===== TRỌNG LƯỢNG (CHUẨN THEO LOGIC CỦA BẠN) =====
    weight: z.number().positive("Trọng lượng phải lớn hơn 0"), // trọng lượng 1 đơn vị
    unit: z.enum(["g", "kg", "ml", "l"], {
        message: "Đơn vị phải là g, kg, ml hoặc lít",
    }),

    ingredient: z
        .string()
        .max(300, "Thành phần không được vượt quá 300 ký tự")
        .optional(),

    allergens: z.array(z.string()).optional(),

    storageInstruction: z
        .string()
        .max(200, "Hướng dẫn bảo quản không được vượt quá 200 ký tự")
        .optional(),

    origin: z
        .string()
        .max(100, "Xuất xứ không được vượt quá 100 ký tự")
        .optional(),

    sku: z.string().optional(),

    isFeatured: z.boolean(),

    isActive: z.boolean().optional(),

    tags: z.string().optional(),
})

export type ProductFormEdit = z.infer<typeof productSchemaEdit>;

export type ProductFormInput = z.input<typeof productSchema>;
// Type sau khi parse (output, dùng để submit API, v.v.)
export type ProductFormValues = z.output<typeof productSchema>;
