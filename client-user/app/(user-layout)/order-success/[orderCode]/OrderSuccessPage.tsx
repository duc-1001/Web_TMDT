"use client"

import React, { useMemo } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

import {
  CheckCircle2,
  CreditCard,
  Truck,
  Copy,
  ArrowRight,
  Wallet,
} from "lucide-react"

import { getOrderSuccessByCode } from "@/services/order.service"
import { formatDateTime } from "@/lib/utils"
import { OrderItemRow } from "@/components/order/order-item-row"
import { ShippingAddress } from "@/types/order"

/* ================= utils ================= */

const formatPrice = (price = 0) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price)

/* ================= types inline ================= */

type Payment = {
  method?: "cod" | "banking" | "momo" | "vnpay"
  status?: "paid" | "unpaid"
  qrBase64?: string
  qrPayload?: string
  paymentUrl?: string
}

const paymentMethodLabel = {
  cod: "Thanh toán khi nhận hàng",
  banking: "Chuyển khoản ngân hàng",
  momo: "Thanh toán MoMo",
  vnpay: "Thanh toán VN Pay",
} as const

/* ================= page ================= */

const OrderSuccessPage = ({ orderCode }: { orderCode: string }) => {
  const { data } = useQuery({
    queryKey: ["order", orderCode],
    queryFn: () => getOrderSuccessByCode(orderCode),
    enabled: !!orderCode,
  })


  if (!data) return null

  const {
    orderCode: code,
    totalAmount,
    payment = {} as Payment,
    shippingAddress = {} as ShippingAddress,
    createdAt,
    items = [],
  } = data

  /* ================= PAYMENT LOGIC ================= */

  const status = payment.status

  const method = payment.method
  const isCOD = method === "cod"
  const isVnpay = method === "vnpay"
  const isQR = method === "banking" || method === "momo"

  const isOnline = isQR || isVnpay
  const isPaid = status === "paid"
  const isUnpaidOnline = isOnline && !isPaid

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Đã sao chép")
  }

  /* ================= render ================= */

  return (
    <div className="min-h-screen bg-muted/30 py-10 sm:py-16">
      <div className="container m-auto max-w-3xl px-4">
        <Card className="overflow-hidden shadow-lg border">
          <CardContent className="p-0">

            {/* ================= HEADER ================= */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 sm:px-10 py-10 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
                <CheckCircle2 className="h-9 w-9" />
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                Đặt hàng thành công
              </h1>

              <p className="text-white/90 text-sm sm:text-base">
                Cảm ơn bạn đã mua hàng tại <b>Snack Việt</b>
              </p>

              <div className="mt-4 inline-flex items-center gap-2 bg-white/15 px-4 py-2 rounded-xl">
                <span className="text-sm">Mã đơn:</span>
                <span className="font-mono font-semibold break-all">
                  #{code}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white"
                  onClick={() => copyToClipboard(code)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* ================= BODY ================= */}
            <div className="p-6 sm:p-10 space-y-8">

              {/* ================= PAYMENT STATUS ================= */}
              <div
                className={`rounded-xl px-5 py-4 border ${isCOD || isPaid
                    ? "bg-green-50 border-green-200"
                    : "bg-yellow-50 border-yellow-200"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-orange-500" />
                    <p className="font-semibold">Thanh toán</p>
                  </div>

                  <Badge
                    variant="outline"
                    className={`font-semibold ${isCOD || isPaid
                        ? "border-green-400 text-green-600"
                        : "border-yellow-400 text-yellow-600"
                      }`}
                  >
                    {isCOD
                      ? "Thanh toán khi nhận hàng"
                      : isPaid
                        ? "Đã thanh toán"
                        : "Chờ thanh toán"}
                  </Badge>
                </div>

                {isUnpaidOnline && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Vui lòng hoàn tất thanh toán để đơn hàng được xử lý.
                  </p>
                )}
              </div>

              {/* ================= QR ================= */}
              {isUnpaidOnline && isQR && payment.qrBase64 && (
                <div className="border rounded-xl p-5 bg-white space-y-4">
                  <h3 className="font-semibold flex items-center gap-2 text-orange-600">
                    <Wallet className="h-5 w-5" />
                    Thanh toán QR
                  </h3>

                  <div className="flex flex-col sm:flex-row gap-6 items-center">
                    <img
                      src={`data:image/png;base64,${payment.qrBase64}`}
                      className="w-44 h-44 border rounded-lg"
                    />

                    <div className="text-sm space-y-3">
                      <p className="text-muted-foreground">
                        Quét mã bằng app ngân hàng / MoMo
                      </p>

                      <div className="bg-muted/40 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">
                          Nội dung chuyển khoản
                        </p>
                        <p className="font-mono font-semibold break-all">
                          {payment.qrPayload}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= VNPAY ================= */}
              {isUnpaidOnline && isVnpay && (
                <div className="border rounded-xl p-5 bg-white space-y-4 text-center">
                  <h3 className="font-semibold text-orange-600 flex items-center justify-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Thanh toán qua VNPay
                  </h3>

                  <Button
                    size="lg"
                    className="w-full"
                    disabled={!payment.paymentUrl}
                    onClick={() => {
                      if (!payment.paymentUrl) {
                        toast.error("Link thanh toán không hợp lệ")
                        return
                      }
                      window.location.href = payment.paymentUrl
                    }}
                  >
                    Thanh toán ngay
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* ================= INFO ================= */}
              <div className="border rounded-xl p-5 bg-white shadow-sm space-y-5">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Truck className="h-5 w-5 text-orange-500" />
                  Thông tin đơn hàng
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <InfoRow label="Tổng tiền">
                    <span className="font-bold text-orange-500">
                      {formatPrice(totalAmount)}
                    </span>
                  </InfoRow>

                  <InfoRow label="Phương thức">
                    {payment.method ? paymentMethodLabel[payment.method] : "-"}
                  </InfoRow>

                  <InfoRow label="Khách hàng">
                    {shippingAddress?.fullName || "-"}
                  </InfoRow>

                  <InfoRow label="SĐT">
                    {shippingAddress?.phone || "-"}
                  </InfoRow>
                </div>

                <Separator />

                <p className="font-semibold text-sm">
                  {shippingAddress?.address + " " + shippingAddress?.ward?.name + " " + shippingAddress?.province?.name || "-"}
                </p>

                <Separator />

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Thời gian</span>
                  <span className="font-semibold">
                    {formatDateTime(createdAt)}
                  </span>
                </div>
              </div>

              {/* ================= ITEMS ================= */}
              <div className="border rounded-xl p-5 bg-white space-y-4">
                <h2 className="text-lg font-semibold">
                  Sản phẩm đã mua
                </h2>

                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {items.map((item: any) => (
                    <OrderItemRow key={item.productId} item={item} />
                  ))}
                </div>
              </div>

              {/* ================= ACTION ================= */}
              <div className="flex gap-3 justify-center">
                <Button asChild variant="outline">
                  <Link href="/">Trang chủ</Link>
                </Button>

                <Button asChild>
                  <Link href={`/orders/${code}?token=${data.viewToken}`}>
                    Xem đơn
                  </Link>
                </Button>
              </div>

            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/* ================= sub ================= */

const InfoRow = ({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) => (
  <div className="flex justify-between bg-muted/40 rounded-lg px-4 py-3">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-semibold">{children}</span>
  </div>
)

export default OrderSuccessPage