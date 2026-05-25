"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle, XCircle, Clock, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const PaymentResultPage = () => {
  const params = useSearchParams()
  const router = useRouter()

  const status = params.get("status")
  const orderCode = params.get("orderCode")
  const viewToken = params.get("viewToken")

  const getConfig = () => {
    switch (status) {
      case "success": // BE trả "paid"
        return {
          icon: <CheckCircle className="w-16 h-16 text-green-500" />,
          title: "Thanh toán thành công 🎉",
          description: "Đơn hàng của bạn đã được xác nhận",
          color: "text-green-600",
        }
      case "expired":
        return {
          icon: <Clock className="w-16 h-16 text-yellow-500" />,
          title: "Hết thời gian thanh toán ⏰",
          description: "Vui lòng thử lại đơn hàng",
          color: "text-yellow-600",
        }
      case "cancelled": // BE trả "cancelled"
        return {
          icon: <XCircle className="w-16 h-16 text-gray-500" />,
          title: "Bạn đã huỷ thanh toán",
          description: "Đơn hàng chưa được xử lý",
          color: "text-gray-600",
        }
      default:
        return {
          icon: <XCircle className="w-16 h-16 text-red-500" />,
          title: "Thanh toán thất bại ❌",
          description: "Có lỗi xảy ra, vui lòng thử lại",
          color: "text-red-600",
        }
    }
  }

  const config = getConfig()

  return (
    <div className=" pb-52 pt-20 flex  justify-center bg-gray-50 px-4">
      <Card className="max-w-md w-full shadow-lg rounded-2xl">
        <CardContent className="p-6 flex flex-col items-center text-center gap-4">

          {/* Icon */}
          {config.icon}

          {/* Title */}
          <h1 className={`text-xl font-semibold ${config.color}`}>
            {config.title}
          </h1>

          {/* Description */}
          <p className="text-gray-500 text-sm">
            {config.description}
          </p>

          {/* Order Code */}
          {orderCode && (
            <div className="bg-gray-100 px-4 py-2 rounded-lg text-sm">
              Mã đơn: <span className="font-medium">{orderCode}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-4 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push("/")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Trang chủ
            </Button>

            <Button
              className="flex-1"
              onClick={() => router.push(`/orders/${orderCode}?token=${viewToken}`)}
            >
              Xem đơn
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PaymentResultPage