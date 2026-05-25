// client/src/app/(public)/reset-password/[token]/page.tsx

"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Eye, EyeOff, Loader2, Check, X, KeyRound } from "lucide-react"
import { resetPassword } from "@/services/auth.service" // Import Service

// UI components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"


// --- 1. DEFINE ZOD SCHEMA AND TYPE (Tương tự như trên) ---
const resetPasswordSchema = z.object({
    password: z.string()
        .min(6, "Mật khẩu phải có ít nhất 6 ký tự."),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu của bạn."),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirmPassword"],
});
type ResetPasswordInputs = z.infer<typeof resetPasswordSchema>;



// --- Định nghĩa Props để lấy TOKEN từ URL ---
interface ResetPasswordPageProps {
    params: {
        token: string; // Lấy token từ URL
    };
}


export default function ResetPasswordPage({ params }: ResetPasswordPageProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get("token") // ✅ đúng
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [submissionMessage, setSubmissionMessage] = useState({ type: '', text: '' });

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting, isValid },
    } = useForm<ResetPasswordInputs>({
        resolver: zodResolver(resetPasswordSchema),
        mode: "onChange",
    })

    // --- XỬ LÝ SUBMIT (GỌI API) ---
    const onSubmit: SubmitHandler<ResetPasswordInputs> = async (data) => {
        setSubmissionMessage({ type: '', text: '' });

        if (!token) {
            setSubmissionMessage({ type: 'error', text: 'Lỗi: Token đặt lại mật khẩu không có trong URL.' });
            return;
        }

        try {
            // CALL AUTH SERVICE: Gửi token và mật khẩu mới
            const responseData = await resetPassword(token, data.password);

            router.push("/reset-password/success");

        } catch (error: any) {
            console.error("Reset Error:", error.response?.data);
            // Hiển thị lỗi từ backend (ví dụ: 'Invalid or expired token')
            const errorMessage = error.response?.data?.message || 'Không thể đặt lại mật khẩu. Liên kết có thể đã hết hạn.';
            setSubmissionMessage({ type: 'error', text: errorMessage });
        }
    }

    return (
        <div className="max-w-md w-full m-auto mt-20 ">
            <h2 className="text-2xl font-bold mb-6 text-center text-orange-500">Đặt lại mật khẩu</h2>
            <div className="mb-6 text-center text-muted-foreground">Vui lòng nhập mật khẩu mới cho tài khoản của bạn.</div>

            {submissionMessage.text && (
                <div className={`p-3 rounded-lg text-sm mb-4 ${submissionMessage.type === 'error' ? 'bg-red-500/10 text-red-500 font-medium' : 'bg-green-500/10 text-green-400'}`}>
                    {submissionMessage.text}
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                {/* New Password Input */}
                <div className="space-y-2">
                    <Label htmlFor="password">Mật khẩu mới</Label>
                    <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Nhập mật khẩu mới"
                            {...register("password")}
                            required
                            className="h-11 pl-10 pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>

                    {/* Password Requirements */}
                    {errors.password && <p className="text-red-500 font-medium text-xs mt-1">{errors.password.message}</p>}
                </div>

                {/* Confirm New Password Input */}
                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                    <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Nhập lại mật khẩu mới"
                            {...register("confirmPassword")}
                            required
                            className="h-11 pl-10 pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                    {errors.confirmPassword && <p className="text-red-500 font-medium text-xs mt-1">{errors.confirmPassword.message}</p>}
                </div>

                {/* Submit Button */}
                <Button
                    type="submit"
                    className="w-full h-11 bg-orange-500 hover:bg-orange-600"
                    disabled={isSubmitting || !isValid}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Đang cập nhật...
                        </>
                    ) : (
                        "Đặt lại mật khẩu"
                    )}
                </Button>

                {/* Back to Login Link */}
                <p className="text-center text-sm text-muted-foreground">
                    Nhớ mật khẩu?{" "}
                    <Link href="/login" className="text-orange-400 font-medium hover:underline">
                        Đăng nhập
                    </Link>
                </p>
            </form>
        </div>
    )
}