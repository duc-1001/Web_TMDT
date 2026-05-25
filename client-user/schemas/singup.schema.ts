import { z } from "zod"

export const signupSchema = z
  .object({
    name: z
      .string()
      .min(1, "Vui lòng nhập họ tên")
      .regex(/[a-zA-ZÀ-ỹ]/, "Họ tên phải chứa ít nhất 1 chữ cái"),

    email: z.string().email("Email không hợp lệ"),

    password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),

    confirmPassword: z.string(),

    agreeTerms: z.boolean().refine((val) => val === true, {
      message: "Bạn phải đồng ý với điều khoản dịch vụ",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
  });
export type SignupForm = z.infer<typeof signupSchema>
