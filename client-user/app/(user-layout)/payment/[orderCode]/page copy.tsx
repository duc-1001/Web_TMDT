"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

import {
    Copy,
    CheckCircle2,
    AlertCircle,
    Clock,
    ArrowLeft,
    Wallet,
    Building2,
} from "lucide-react"
import { toast } from "sonner"

const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(price)
}

const PaymentPage = () => {
    const params = useParams()
    const router = useRouter()

    const orderCode = params?.orderCode as string

    // Fake data (giả lập API trả về)
    const [paymentData, setPaymentData] = useState({
        orderCode: orderCode || "DH12345678",
        amount: 259000,
        method: "banking",
        bankName: "Vietcombank",
        accountName: "SNACK VIET CO., LTD",
        accountNumber: "1017828282",
        qrPayload: `SNACKVIET_${orderCode || "DH12345678"}`,
        qrBase64: "", // nếu có base64 thì gắn vô
        qrUrl: "https://img.vietqr.io/image/VCB-1017828282-compact2.png",
        status: "PENDING", // PENDING | PAID
        expiredSeconds: 900, // 15 phút
    })

    const [secondsLeft, setSecondsLeft] = useState(paymentData.expiredSeconds)

    // Countdown timer
    useEffect(() => {
        const interval = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 0) return 0
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success("Đã sao chép!")
    }

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m}:${s.toString().padStart(2, "0")}`
    }

    // Fake confirm payment
    const handleFakePaid = () => {
        setPaymentData((prev) => ({ ...prev, status: "PAID" }))
        toast.success("Thanh toán thành công!")

        setTimeout(() => {
            router.push(`/order-success/${paymentData.orderCode}`)
        }, 1200)
    }

    return (
        <div className="min-h-screen bg-muted/30">
            <div className="container max-w-4xl m-auto px-4">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between gap-3">
                    <Button
                        variant="outline"
                        className="bg-transparent"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Quay lại
                    </Button>

                    <Badge
                        variant="outline"
                        className={`px-3 py-1 text-sm font-semibold ${paymentData.status === "PAID"
                                ? "border-green-300 text-green-600"
                                : "border-yellow-300 text-yellow-600"
                            }`}
                    >
                        {paymentData.status === "PAID" ? "Đã thanh toán" : "Chờ thanh toán"}
                    </Badge>
                </div>

                <Card className="overflow-hidden shadow-lg border">
                    <CardContent className="p-0">
                        {/* Top header */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 sm:px-10 py-8">
                            <div className="flex flex-col gap-2">
                                <h1 className="text-2xl sm:text-3xl font-bold">
                                    Thanh toán đơn hàng
                                </h1>
                                <p className="text-white/80 text-sm sm:text-base">
                                    Vui lòng hoàn tất thanh toán để đơn hàng được xác nhận.
                                </p>

                                <div className="mt-4 inline-flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 bg-white/15 px-4 py-2 rounded-xl max-w-full">
                                    <span className="text-xs sm:text-sm text-white/80">
                                        Mã đơn:
                                    </span>
                                    <span className="font-mono font-semibold text-sm sm:text-base break-all">
                                        #{paymentData.orderCode}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-6 sm:p-10 space-y-8">
                            {/* Amount */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-muted/40 rounded-xl px-5 py-4">
                                <div className="flex items-center gap-2">
                                    <Wallet className="h-5 w-5 text-blue-600" />
                                    <p className="font-semibold">Số tiền cần thanh toán</p>
                                </div>

                                <p className="text-xl sm:text-2xl font-bold text-orange-500">
                                    {formatPrice(paymentData.amount)}
                                </p>
                            </div>

                            {/* Countdown */}
                            <div className="flex items-start gap-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/40 rounded-xl px-5 py-4">
                                <Clock className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
                                <div className="text-sm">
                                    <p className="font-semibold text-yellow-700 dark:text-yellow-400">
                                        Mã thanh toán sẽ hết hạn sau:{" "}
                                        <span className="font-mono">{formatTime(secondsLeft)}</span>
                                    </p>
                                    <p className="text-yellow-700/80 dark:text-yellow-300/80">
                                        Nếu hết hạn, vui lòng tạo lại đơn hàng để lấy QR mới.
                                    </p>
                                </div>
                            </div>

                            {/* Payment box */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                                {/* QR */}
                                <div className="space-y-4">
                                    <h2 className="text-lg font-semibold flex items-center gap-2">
                                        <Building2 className="h-5 w-5 text-blue-600" />
                                        Quét mã QR để thanh toán
                                    </h2>

                                    <div className="flex justify-center">
                                        <div className="w-56 h-56 rounded-2xl overflow-hidden border shadow bg-white flex items-center justify-center">
                                            <img
                                                src={
                                                    paymentData.qrBase64
                                                        ? `data:image/png;base64,${paymentData.qrBase64}`
                                                        : paymentData.qrUrl
                                                }
                                                alt="QR Payment"
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                    </div>

                                    <p className="text-sm text-muted-foreground text-center leading-relaxed">
                                        Mở app ngân hàng hoặc ví điện tử để quét mã QR và thanh toán.
                                    </p>
                                </div>

                                {/* Info */}
                                <div className="space-y-4">
                                    <h2 className="text-lg font-semibold">
                                        Thông tin chuyển khoản
                                    </h2>

                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between gap-3 bg-muted/40 rounded-xl px-4 py-3">
                                            <div className="min-w-0">
                                                <p className="text-xs text-muted-foreground mb-1">
                                                    Ngân hàng
                                                </p>
                                                <p className="font-semibold break-words">
                                                    {paymentData.bankName}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start justify-between gap-3 bg-muted/40 rounded-xl px-4 py-3">
                                            <div className="min-w-0">
                                                <p className="text-xs text-muted-foreground mb-1">
                                                    Tên tài khoản
                                                </p>
                                                <p className="font-semibold break-words">
                                                    {paymentData.accountName}
                                                </p>
                                            </div>

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="shrink-0"
                                                onClick={() => copyToClipboard(paymentData.accountName)}
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <div className="flex items-start justify-between gap-3 bg-muted/40 rounded-xl px-4 py-3">
                                            <div className="min-w-0">
                                                <p className="text-xs text-muted-foreground mb-1">
                                                    Số tài khoản
                                                </p>
                                                <p className="font-mono font-bold text-base break-all">
                                                    {paymentData.accountNumber}
                                                </p>
                                            </div>

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="shrink-0"
                                                onClick={() => copyToClipboard(paymentData.accountNumber)}
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <div className="flex items-start justify-between gap-3 bg-muted/40 rounded-xl px-4 py-3">
                                            <div className="min-w-0">
                                                <p className="text-xs text-muted-foreground mb-1">
                                                    Nội dung chuyển khoản
                                                </p>
                                                <p className="font-mono font-semibold break-all leading-relaxed">
                                                    {paymentData.qrPayload}
                                                </p>
                                            </div>

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="shrink-0"
                                                onClick={() => copyToClipboard(paymentData.qrPayload)}
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-xl px-5 py-4">
                                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                                        <div className="text-sm">
                                            <p className="font-semibold text-blue-700 dark:text-blue-400">
                                                Lưu ý quan trọng
                                            </p>
                                            <p className="text-blue-700/80 dark:text-blue-300/80 leading-relaxed">
                                                Vui lòng chuyển đúng số tiền và đúng nội dung để hệ thống tự động xác nhận.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    className="bg-transparent flex-1"
                                    asChild
                                >
                                    <Link href="/">
                                        Về trang chủ
                                    </Link>
                                </Button>

                                <Button
                                    className="flex-1"
                                    onClick={handleFakePaid}
                                    disabled={paymentData.status === "PAID"}
                                >
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Tôi đã thanh toán
                                </Button>
                            </div>

                            {/* Footer */}
                            <p className="text-xs text-muted-foreground text-center leading-relaxed">
                                Nếu bạn đã thanh toán nhưng trạng thái chưa cập nhật, vui lòng đợi 1-2 phút hoặc liên hệ hỗ trợ.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default PaymentPage
