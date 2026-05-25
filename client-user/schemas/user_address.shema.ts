import {z} from "zod"

export const userAddressSchema = z.object({
    name: z.string().min(2, "Tên phải có ít nhất 2 ký tự").max(100, "Tên không được vượt quá 100 ký tự"),
    receiver: z.string().min(2, "Họ và tên người nhận phải có ít nhất 2 ký tự").max(100, "Họ và tên người nhận không được vượt quá 100 ký tự"),
    phone: z.string().min(9, "Số điện thoại không hợp lệ").max(15, "Số điện thoại không hợp lệ"),
    province:z.object({
        code: z.string().min(1, "Vui lòng chọn Tỉnh/Thành phố"),
        name: z.string().min(1, "Vui lòng chọn Tỉnh/Thành phố")
    }),
    ward: z.object({
        code: z.string().min(1, "Vui lòng chọn Phường/Xã"),
        name: z.string().min(1, "Vui lòng chọn Phường/Xã")
    }),
    street: z.string().min(5, "Địa chỉ chi tiết phải có ít nhất 5 ký tự").max(200, "Địa chỉ chi tiết không được vượt quá 200 ký tự"),
    isDefault: z.boolean().optional(),
})

export type UserAddressForm = z.infer<typeof userAddressSchema>