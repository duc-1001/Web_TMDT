"use client"

import { useEffect, useRef } from "react"
import { Mail } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { verifyEmailToken } from "@/services/auth.service"

export default function VerifyEmailPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get("token") // ✅ đúng
    const hasCalledApi = useRef(false)

    useEffect(() => {
        if (!token || hasCalledApi.current) {
            router.push("/verify-email/error?type=invalid")
            return
        }

        const verifyToken = async () => {
            hasCalledApi.current = true
            try {
                const response = await verifyEmailToken(token)
                console.log("Email verified successfully:", response)
                router.push("/verify-email/success")
            } catch (error: any) {
                const messError =
                    error.response?.data?.message || error.message

                if (messError.includes("already verified")) {
                    router.push("/verify-email/error?type=already_verified")
                } else if (messError.includes("expired")) {
                    router.push("/verify-email/error?type=expired")
                } else {
                    router.push("/verify-email/error?type=invalid")
                }

                console.error(
                    "Error verifying email:",
                    error.response?.data || error.message
                )
            }
        }

        verifyToken()
    }, [token, router])

    return (
        <div className="items-center h-screen flex flex-col justify-center px-4">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-orange-500 mb-2">
                    Xác thực email của bạn
                </h2>
                <p className="text-muted-foreground">
                    Đang kiểm tra email của bạn...
                </p>
            </div>

            <div className="space-y-6">
                <div className="flex justify-center">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-orange-500/20 flex items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-orange-500/30 flex items-center justify-center animate-pulse">
                                <Mail className="w-8 h-8 text-orange-500" />
                            </div>
                        </div>
                        <div
                            className="absolute inset-0 rounded-full border-2 border-orange-500/40 animate-ping"
                            style={{ animationDuration: "2s" }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
