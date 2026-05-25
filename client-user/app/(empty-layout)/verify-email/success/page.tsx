// client/src/app/(public)/verify-success/page.tsx

"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ShoppingBag, Truck, Sparkles } from "lucide-react"

export default function VerifyEmailSuccessPage() {
    return (
        <div className="max-w-[600px] m-auto">
            <h1 className="text-2xl font-bold text-center text-white">
                Xác thực email thành công!
            </h1>
            <p className="text-center text-muted-foreground mb-3">
                Tài khoản của bạn đã được kích hoạt thành công.
            </p>

            <div className="space-y-6">
                {/* Hiệu ứng thành công */}
                <div className="flex justify-center relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                        {[...Array(12)].map((_, i) => (
                            <Sparkles
                                key={i}
                                className="absolute w-4 h-4 text-orange-500 animate-ping"
                                style={{
                                    top: `${Math.random() * 100}%`,
                                    left: `${Math.random() * 100}%`,
                                    animationDelay: `${i * 0.1}s`,
                                    animationDuration: "1s",
                                }}
                            />
                        ))}
                    </div>

                    <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-orange-500/10 flex items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center">
                                <CheckCircle2 className="w-10 h-10 text-white" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Thông điệp chào mừng */}
                <div className="text-center space-y-3">
                    <p className="text-muted-foreground">
                        Chào mừng bạn đến với{" "}
                        <span className="text-orange-500 font-semibold">
                            Snack Việt
                        </span>
                        ! Sẵn sàng khám phá thế giới đồ ăn vặt hấp dẫn.
                    </p>
                </div>

                {/* Giới thiệu nhanh */}
                <div className="grid grid-cols-2 gap-3">
                    {/* Đa dạng món ăn */}
                    <div className="p-4 rounded-lg bg-gray-500/50 text-center">
                        <ShoppingBag className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                        <p className="text-sm font-medium text-white">
                            Đa dạng món ăn
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Snack nội & ngoại
                        </p>
                    </div>

                    {/* Giao hàng nhanh */}
                    <div className="p-4 rounded-lg bg-gray-500/50 text-center">
                        <Truck className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                        <p className="text-sm font-medium text-white">
                            Giao hàng nhanh
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Nhận hàng tận nơi
                        </p>
                    </div>
                </div>

                {/* CTA */}
                <div className="space-y-3">
                    <Button
                        asChild
                        className="w-full h-11 bg-orange-500 text-white hover:bg-orange-600"
                    >
                        <Link href="/login">
                            <ShoppingBag className="mr-2 h-4 w-4" />
                            Đăng nhâp và mua sắm ngay
                        </Link>
                    </Button>

                    {/* <Button
                        asChild
                        variant="outline"
                        className="w-full h-11 bg-transparent border-gray-700 text-muted-foreground hover:bg-blue-300"
                    >
                        <Link href="/products">
                            Xem danh sách sản phẩm
                        </Link>
                    </Button> */}
                </div>
            </div>
        </div>
    )
}
