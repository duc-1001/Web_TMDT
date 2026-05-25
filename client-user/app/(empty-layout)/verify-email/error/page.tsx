// client/src/app/(public)/verify-error/page.tsx

"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { XCircle, RefreshCw, ArrowLeft, Loader2, AlertTriangle } from "lucide-react"
import api from "@/lib/axios"
import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { resendVerificationLink } from "@/services/auth.service"

// Ghi chú: Cần có email người dùng (lấy từ query params / state / localStorage)
// Hiện tại yêu cầu người dùng nhập lại email
const USER_EMAIL_PLACEHOLDER = "user_email@example.com"

const errorSchema = z.object({
    email: z.string().email("Email không hợp lệ."),
})

type ErrorParams = z.infer<typeof errorSchema>

export default function VerifyEmailErrorPage() {
    const searchParams = useSearchParams()
    // Lấy loại lỗi từ URL: /verify-error?type=expired
    const errorType = searchParams.get("type") || "expired"

    const [isResending, setIsResending] = useState(false)
    const [resendSuccess, setResendSuccess] = useState(false)
    const [resendError, setResendError] = useState("")

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ErrorParams>({
        resolver: zodResolver(errorSchema),
        mode: "onChange",
    })

    // --- ĐỊNH NGHĨA NỘI DUNG LỖI ---
    const errorMessages: Record<
        string,
        { title: string; description: string; icon: React.ReactNode }
    > = {
        expired: {
            title: "Liên kết đã hết hạn",
            description:
                "Liên kết xác thực email đã hết hạn. Vui lòng yêu cầu gửi lại email xác thực mới.",
            icon: <AlertTriangle className="w-10 h-10 text-amber-500" />,
        },
        invalid: {
            title: "Liên kết không hợp lệ",
            description:
                "Liên kết xác thực không hợp lệ hoặc đã được sử dụng. Vui lòng thử lại.",
            icon: <XCircle className="w-10 h-10 text-red-500" />,
        },
        already_verified: {
            title: "Email đã được xác thực",
            description:
                "Tài khoản của bạn đã được xác thực trước đó. Bạn có thể đăng nhập ngay.",
            icon: <AlertTriangle className="w-10 h-10 text-amber-500" />,
        },
    }

    const currentError = errorMessages[errorType] || errorMessages.expired
    const isAlreadyVerified = errorType === "already_verified"

    // --- GỬI LẠI EMAIL XÁC THỰC ---
    const handleResend = async (data: ErrorParams) => {
        if (isResending) return

        setIsResending(true)
        setResendError("")
        setResendSuccess(false)

        try {
            await resendVerificationLink(data.email)
            setResendSuccess(true)
        } catch (error: any) {
            console.error("Lỗi gửi lại email:", error.response?.data)
            setResendError(
                error.message ||
                "Không thể gửi email. Vui lòng kiểm tra lại địa chỉ email."
            )
        } finally {
            setIsResending(false)
        }
    }

    return (
        <div className="space-y-6 w-full max-w-md mx-auto py-12 px-4">
            <div className="max-w-[600px]">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                        {currentError.title}
                    </h2>
                    <p className="text-muted-foreground">
                        {currentError.description}
                    </p>
                </div>

                {/* Icon lỗi */}
                <div className="flex justify-center">
                    <div
                        className={`w-24 h-24 rounded-full ${
                            isAlreadyVerified
                                ? "bg-amber-500/10"
                                : "bg-red-500/10"
                        } flex items-center justify-center`}
                    >
                        <div
                            className={`w-16 h-16 rounded-full ${
                                isAlreadyVerified
                                    ? "bg-amber-500/20"
                                    : "bg-red-500/20"
                            } flex items-center justify-center`}
                        >
                            {currentError.icon}
                        </div>
                    </div>
                </div>

                {/* Thông báo kết quả */}
                <div className="space-y-3 my-3">
                    {resendError && (
                        <div className="p-4 rounded-lg bg-red-500/10 text-red-400 text-sm text-center">
                            {resendError}
                        </div>
                    )}

                    {resendSuccess && (
                        <div className="p-4 rounded-lg bg-green-500/10 text-green-400 text-center">
                            <p className="font-medium mb-1">
                                Gửi email thành công!
                            </p>
                            <p className="text-sm">
                                Vui lòng kiểm tra hộp thư của bạn để xác thực.
                            </p>
                        </div>
                    )}
                </div>

                {/* Hành động */}
                <div className="space-y-3">
                    {/* Gửi lại email (chỉ hiển thị khi chưa xác thực) */}
                    {!resendSuccess && !isAlreadyVerified && (
                        <form
                            onSubmit={handleSubmit(handleResend)}
                            className="space-y-4"
                        >
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="email@example.com"
                                    {...register("email")}
                                    required
                                    className="h-11 border-gray-700"
                                />
                                {errors.email && (
                                    <p className="text-red-400 text-xs mt-1">
                                        {errors.email.message}
                                    </p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-11 bg-orange-500"
                                disabled={isResending}
                            >
                                {isResending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Đang gửi...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Gửi lại email xác thực
                                    </>
                                )}
                            </Button>
                        </form>
                    )}

                    {/* Đăng nhập */}
                    <Button
                        asChild
                        variant={isAlreadyVerified ? "default" : "outline"}
                        className={`w-full h-11 ${
                            isAlreadyVerified
                                ? "bg-orange-500 hover:bg-orange-600"
                                : "bg-transparent border-gray-700 text-muted-foreground hover:bg-blue-300"
                        }`}
                    >
                        <Link href="/login">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            {isAlreadyVerified
                                ? "Đăng nhập ngay"
                                : "Quay lại đăng nhập"}
                        </Link>
                    </Button>

                    {/* Đăng ký mới */}
                    {!isAlreadyVerified && (
                        <Button
                            asChild
                            variant="ghost"
                            className="w-full h-11 text-muted-foreground hover:bg-blue-300"
                        >
                            <Link href="/register">
                                Đăng ký tài khoản mới
                            </Link>
                        </Button>
                    )}
                </div>

                {/* Hỗ trợ */}
                <p className="text-center text-xs text-muted-foreground mt-6">
                    Cần hỗ trợ? Liên hệ{" "}
                    <Link
                        href="#"
                        className="text-orange-500 hover:underline"
                    >
                        hotro@snackviet.vn
                    </Link>
                </p>
            </div>
        </div>
    )
}
