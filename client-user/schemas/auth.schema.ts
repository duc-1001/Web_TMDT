import { z } from "zod"

export const editInfoSchema = z.object({
    fullName: z.string().min(2, "Họ và tên phải có ít nhất 2 ký tự").max(100, "Họ và tên không được vượt quá 100 ký tự").optional(),
    phoneNumber: z
        .string()
        .regex(/^\d{10}$/, "Số điện thoại phải đúng 10 chữ số")
    })

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(6, "Mật khẩu hiện tại phải có ít nhất 6 ký tự").max(100, "Mật khẩu hiện tại không được vượt quá 100 ký tự"),
    newPassword: z.string().min(6, "Mật khẩu mới phải có ít nhất 6 ký tự").max(100, "Mật khẩu mới không được vượt quá 100 ký tự"),
    confirmNewPassword: z.string().min(6, "Xác nhận mật khẩu mới phải có ít nhất 6 ký tự").max(100, "Xác nhận mật khẩu mới không được vượt quá 100 ký tự"),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Mật khẩu mới và xác nhận mật khẩu mới không khớp",
})

export type EditInfoForm = z.infer<typeof editInfoSchema>
export type ChangePasswordForm = z.infer<typeof changePasswordSchema>