"use client"

import React from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { formatPrice } from "@/lib/utils"
import { Clock, Receipt, Package, ArrowRight, CreditCard, CheckCircle2, RotateCcw, XCircle } from "lucide-react"
import { getRefundSummaryInfo } from "@/services/order.service"
import { OrderShippingInfo } from "@/types/order"
import { ReasonCode, RefundSummary } from "@/types/refund"
import { REFUND_REASONS } from "./refund-form"
import { Badge } from "../ui/badge"
import { formatDateTime } from "@/lib/time"

export const StatusBadge = ({ status }: { status: string }) => {
  const styles: any = {
    pending: { label: "Đang kiểm tra", icon: Clock, class: "bg-amber-50 text-amber-600 border-amber-200" },
    approved: { label: "Đã chấp nhận", icon: CheckCircle2, class: "bg-blue-50 text-blue-600 border-blue-200" },
    completed: { label: "Đã hoàn tiền", icon: RotateCcw, class: "bg-green-50 text-green-600 border-green-200" },
    rejected: { label: "Từ chối", icon: XCircle, class: "bg-rose-50 text-rose-600 border-rose-200" },
    cancelled: { label: "Đã hủy", icon: XCircle, class: "bg-gray-50 text-gray-600 border-gray-200" }
  }
  const config = styles[status] || styles.pending
  const Icon = config.icon
  return (
    <Badge variant="outline" className={`${config.class} py-1 px-2.5 flex items-center gap-1.5 font-medium border`}>
      <Icon size={13} />
      {config.label}
    </Badge>
  )
}

interface RefundDetailProps {
  order: OrderShippingInfo
  viewToken: string
}


const typeMap = {
  full: "Hoàn toàn bộ",
  partial: "Hoàn một phần",
}

const destinationMap = {
  original: "Phương thức thanh toán ban đầu",
  bank: "Chuyển khoản ngân hàng",
}

const RefundDetail = ({ order, viewToken }: RefundDetailProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ["refund-summary", order.orderCode],
    queryFn: () => getRefundSummaryInfo(order.orderCode, viewToken),
  })

  const refund = data as RefundSummary | undefined

  if (isLoading || !refund) {
    return (
      <div className="text-center py-10 text-gray-500">
        Đang tải thông tin hoàn tiền...
      </div>
    )
  }

  const statusColorMap: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    processing: "bg-blue-100 text-blue-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    completed: "bg-emerald-100 text-emerald-700",
  }
  return (
    <div className="max-w-4xl mx-auto">

      <div className="bg-white border rounded-2xl shadow-sm p-6 hover:shadow-md transition">

        {/* HEADER */}
        <div className="flex justify-between items-start">

          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Yêu cầu hoàn tiền
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              {refund.refundCode}
            </p>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-sm font-medium`}
          >
            <StatusBadge status={refund.status} />
          </span>

        </div>

        {/* INFO */}
        <div className="grid grid-cols-2 gap-6 mt-6 text-sm">

          <div>
            <p className="text-gray-500">Mã đơn hàng</p>
            <p className="font-medium">{refund.orderCode}</p>
          </div>

          <div className="flex items-center gap-2">
            <Clock size={16} className="text-gray-400" />
            <div>
              <p className="text-gray-500">Ngày tạo</p>
              <p className="font-medium">
                {formatDateTime(refund.createdAt)}
              </p>
            </div>
          </div>

        </div>

        {/* META INFO */}
        <div className="grid grid-cols-2 gap-4 mt-6 text-sm border-t pt-4">

          <div className="flex items-center gap-2">
            <Package size={16} className="text-gray-400" />
            <span>{refund.itemCount} sản phẩm hoàn</span>
          </div>

          <div>
            <span className="text-gray-500">Loại hoàn:</span>{" "}
            {typeMap[refund.type]}
          </div>

          <div>
            <span className="text-gray-500">Lý do:</span>{" "}
            {refund.reasonCode} : {refund.reason}
          </div>

          <div className="flex items-center gap-2">
            <CreditCard size={16} className="text-gray-400" />
            {destinationMap[refund.refundDestination]}
          </div>

        </div>

        {/* MONEY */}
        <div className="mt-6 border-t pt-6 flex items-center justify-between">

          <div className="flex items-center gap-2 text-gray-600">
            <Receipt size={18} />
            <span>Tổng tiền hoàn</span>
          </div>

          <div className="text-2xl font-bold text-green-600">
            {formatPrice(refund.totalRefund)}
          </div>

        </div>

        {/* ACTION */}
        <div className="mt-6 flex justify-end">

          <Link
            href={`/refunds/${refund.refundCode}?token=${viewToken}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Xem chi tiết
            <ArrowRight size={16} />
          </Link>

        </div>

      </div>

    </div>
  )
}

export default RefundDetail