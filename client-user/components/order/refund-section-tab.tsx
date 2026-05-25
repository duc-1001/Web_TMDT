"use client"

import { OrderShippingInfo } from "@/types/order"
import RefundForm from "../refund/refund-form"
import RefundHistoryList from "../refund/refund-history-list"
import { AlertTriangle, Clock, PackageX, Truck } from "lucide-react"
import { useState } from "react"

interface RefundSectionTabProps {
    order: OrderShippingInfo
    tab: string
    handleRefundSuccess: () => void
    setCodeError: React.Dispatch<React.SetStateAction<string | null>>
    token: string
    canCreateRefund: boolean
    codeError: string | null
}

export default function RefundSectionTab({
    order,
    tab,
    handleRefundSuccess,
    setCodeError,
    token,
    canCreateRefund,
    codeError
}: RefundSectionTabProps) {

    const { orderCode } = order
    const [isLoading, setIsLoading] = useState(false)

    return (
        <div className="space-y-6">

            {/* History */}
            <RefundHistoryList
                orderCode={orderCode}
                setIsLoading={setIsLoading}
                viewToken={token}
            />

            {/* Error messages */}
            <div className="w-full flex justify-center">
                <div className="space-y-2 text-sm">

                    {codeError === "REFUND_WINDOW_EXPIRED" && (
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-md">
                            <Clock size={16} />
                            <span>Đã quá hạn 7 ngày để yêu cầu hoàn tiền.</span>
                        </div>
                    )}

                    {codeError === "REFUND_PENDING" && (
                        <div className="flex items-center gap-2 text-yellow-700 bg-yellow-50 border border-yellow-200 px-3 py-2 rounded-md">
                            <AlertTriangle size={16} />
                            <span>Đơn hàng đang có yêu cầu hoàn tiền đang được xử lý.</span>
                        </div>
                    )}

                    {codeError === "NOTHING_TO_REFUND" && (
                        <div className="flex items-center gap-2 text-gray-600 bg-gray-50 border border-gray-200 px-3 py-2 rounded-md">
                            <PackageX size={16} />
                            <span>Tất cả sản phẩm trong đơn hàng đã được hoàn tiền.</span>
                        </div>
                    )}

                    {codeError === "ORDER_NOT_DELIVERED" && (
                        <div className="flex items-center gap-2 text-gray-600 bg-gray-50 border border-gray-200 px-3 py-2 rounded-md">
                            <Truck size={16} />
                            <span>Bạn chỉ có thể yêu cầu hoàn tiền sau khi đơn hàng đã được giao.</span>
                        </div>
                    )}

                </div>
            </div>

            {/* Refund form */}
            {canCreateRefund && !isLoading && (
                <RefundForm
                    order={order}
                    tab={tab}
                    handleRefundSuccess={handleRefundSuccess}
                    setCodeError={setCodeError}
                    token={token}
                />
            )}

        </div>
    )
}