import { z } from "zod"

const refundItemSchema = z.object({
    productId: z.string(),
    quantity: z.number().min(0),
})

const MAX_IMAGES = 5

const baseSchema = z.object({
    paymentMethod: z.enum(["cod", "banking", "vnpay", "momo"]),
    type: z.enum(["full", "partial"]),
    reasonCode: z.string().min(1, "Vui lòng chọn lý do"),
    reason: z.string().optional(),
    note: z.string().optional(),
    images: z.array(z.instanceof(File)).max(MAX_IMAGES, `Tối đa ${MAX_IMAGES} ảnh`),
    refundDestination: z.enum(["original", "bank"]).optional(),
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    accountHolder: z.string().optional(),
    items: z.array(refundItemSchema).optional(),
})

export const refundSchema = baseSchema
    // Nếu reasonCode = OTHER → bắt nhập lý do cụ thể
    .refine(
        (data) => data.reasonCode !== "OTHER" || (data.reason && data.reason.trim().length > 0),
        {
            message: "Nhập lý do cụ thể",
            path: ["reason"],
        }
    )
    // Partial refund → phải chọn ít nhất 1 sản phẩm
    .refine(
        (data) => {
            if (data.type === "partial") {
                const selected = data.items?.filter((i) => i.quantity > 0) || []
                return selected.length > 0
            }
            return true
        },
        {
            message: "Vui lòng chọn ít nhất 1 sản phẩm",
            path: ["items"],
        }
    )
    // Bank info chỉ bắt buộc với COD / Banking
    .refine(
        (data) => {
            if (data.paymentMethod === "cod" || data.paymentMethod === "banking") {
                return (
                    data.bankName?.trim().length! > 0 &&
                    data.accountNumber?.trim().length! > 0 &&
                    data.accountHolder?.trim().length! > 0
                )
            }
            // Với VNPAY / MoMo → luôn đúng
            return true
        },
        {
            message: "Vui lòng nhập đầy đủ thông tin tài khoản ngân hàng",
            path: ["bankName"],
        }
    )

export type RefundFormValues = z.infer<typeof refundSchema>