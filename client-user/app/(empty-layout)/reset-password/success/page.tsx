"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowRight, Shield } from "lucide-react"

export default function ResetPasswordSuccessPage() {
    return (
        <div className="text-black max-w-xl mx-auto p-6 bg-white mt-20">
            <h2 className="text-2xl font-bold mb-8 text-center text-black">
                Mật khẩu đã được đặt lại thành công!
            </h2>

            <div className="mb-6 text-center text-muted-foreground">
                Mật khẩu của bạn đã được cập nhật thành công.
            </div>

            <div className="text-center relative">
                {/* Floating dots */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute animate-bounce"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 50}%`,
                                animationDelay: `${Math.random() * 0.5}s`,
                                animationDuration: `${0.5 + Math.random() * 0.5}s`,
                            }}
                        >
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{
                                    backgroundColor: [
                                        "#f97316", // orange-500
                                        "#fb923c", // orange-400
                                        "#f59e0b", // amber-500
                                        "#fdba74", // orange-300
                                    ][Math.floor(Math.random() * 4)],
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Success icon */}
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-500/5 mb-6 relative">
                    <div className="absolute inset-0 rounded-full bg-orange-500/10 animate-ping" />
                    <CheckCircle className="h-10 w-10 text-orange-500 relative z-10" />
                </div>

                <h3 className="text-lg font-semibold mb-2">
                    Mật khẩu đã được đặt lại!
                </h3>

                <p className="text-muted-foreground mb-6">
                    Bạn có thể đăng nhập bằng mật khẩu mới của mình. Vui lòng bảo mật tài khoản bằng cách không chia sẻ mật khẩu với người khác.
                </p>

                {/* Security tips */}
                <div className="p-4 rounded-xl bg-gray-300/50 border border-gray-700/50 mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Shield className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-medium">Mẹo bảo mật</span>
                    </div>

                    <ul className="text-xs text-muted-foreground space-y-1.5 text-left">
                        <li className="flex items-start gap-2">
                            <span className="text-orange-500">•</span>
                            Tránh sử dụng cùng một mật khẩu cho các tài khoản khác nhau
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-orange-500">•</span>
                            Đăng xuất khỏi các thiết bị không tin cậy
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-orange-500">•</span>
                            Kích hoạt xác thực hai yếu tố để bảo vệ tài khoản tốt hơn
                        </li>
                    </ul>
                </div>

                <Button asChild className="w-full h-11 bg-orange-500 hover:bg-orange-600">
                    <Link href="/login">
                        Đăng nhập ngay
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>
        </div>
    )
}
