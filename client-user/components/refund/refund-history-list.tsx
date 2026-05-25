"use client"

import { getHistoryRefunds } from "@/services/order.service"
import { useQuery } from "@tanstack/react-query"
import {  formatPrice } from "@/lib/utils"
import Link from "next/link"
import { ArrowRight, RotateCcw } from "lucide-react"
import { OrderRefundListItem } from "@/types/refund"
import { StatusBadge } from "./refund-summary"
import { useEffect } from "react"
import { formatDateTime } from "@/lib/time"

interface RefundHistoryListProps {
  orderCode: string
  viewToken: string
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
}

const typeMap = {
  full: "Hoàn toàn bộ",
  partial: "Hoàn một phần"
}

const RefundHistoryList = ({ orderCode, viewToken, setIsLoading }: RefundHistoryListProps) => {

  const { data, isLoading } = useQuery({
    queryKey: ["refund-history", orderCode, viewToken],
    queryFn: () => getHistoryRefunds(orderCode, viewToken),
    enabled: !!orderCode && !!viewToken
  })

  const refunds = data as OrderRefundListItem[] | undefined

  // ✅ Đưa setState vào useEffect
  useEffect(() => {
    setIsLoading(isLoading)
  }, [isLoading, setIsLoading])

  // ✅ Loading UI đúng cách
  if (isLoading) {
    return (
      <div className="text-sm text-gray-500 py-6 text-center">
        Đang tải lịch sử hoàn tiền...
      </div>
    )
  }

  // ✅ Không có dữ liệu
  if (!refunds || refunds.length === 0) {
    return (
      <div className="text-sm text-gray-500 py-6 text-center">
        Chưa có lịch sử hoàn tiền
      </div>
    )
  }

  return (
    <div className="border rounded-xl divide-y bg-white">

      {refunds.map((refund) => (
        <div
          key={refund.refundCode}
          className="flex items-center justify-between p-4 hover:bg-gray-50 transition"
        >

          {/* LEFT */}
          <div className="flex items-center gap-3">

            <div className="p-2 bg-blue-50 rounded-md text-blue-600">
              <RotateCcw size={16} />
            </div>

            <div className="text-sm">

              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">
                  {refund.refundCode}
                </span>

                <StatusBadge status={refund.status} />
              </div>

              <div className="text-xs text-gray-500 mt-0.5 flex gap-3">

                <span>
                  {typeMap[refund.type]}
                </span>

                <span>
                  {refund.itemCount} sản phẩm
                </span>

                <span>
                  {formatPrice(refund.totalRefund)}
                </span>

                <span>
                  {formatDateTime(refund.createdAt)}
                </span>

              </div>

            </div>

          </div>

          {/* ACTION */}
          <Link
            href={`/refunds/${refund.refundCode}?token=${viewToken}`}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            Chi tiết
            <ArrowRight size={16} />
          </Link>

        </div>
      ))}

    </div>
  )
}

export default RefundHistoryList