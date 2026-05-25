import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { getRecentOrders } from '@/services/dashboard.service'
import { useQuery } from '@tanstack/react-query'
import { formatTimeAgo } from '@/lib/time'
import { formatPrice, getStatusColor, ORDER_STEPS_LABEL } from '@/lib/utils'
import { Badge } from '../ui/badge'
import { OrderStatus } from '@/types/order'
import Link from 'next/link'
import { BadgeStatusPayment } from '@/app/(admin)/orders/page'

interface RecentOrderProps {
    tab?: string
}

const RecentOrderComponent = ({ tab }: RecentOrderProps) => {
    const { data, isLoading } = useQuery({
        queryKey: ["dashboard-recent-orders"],
        queryFn: () => getRecentOrders(10),
        enabled: tab === "overview",
    })

    return (
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-2">
                <CardTitle>Đơn hàng gần đây</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-300">
                {data?.map((order) => (
                    <div
                        key={order._id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-4 last:border-0 gap-3"
                    >
                        {/* Thông tin đơn hàng */}
                        <div className="flex flex-col gap-0.5">
                            <Link href={`/orders/${order.orderCode}`} className="font-medium hover:underline hover:text-orange-600">
                                <p className="font-semibold">{order.orderCode}</p>
                            </Link>
                            <p className="text-sm text-gray-500">{order.customer.name}</p>
                            <p className="text-xs text-gray-400">{formatTimeAgo(order.createdAt)}</p>
                        </div>

                        {/* Trạng thái, tổng tiền, payment */}
                        <div className="flex flex-col sm:items-end gap-2">
                            <Badge
                                className={`${getStatusColor(order.status as OrderStatus)}`}
                            >
                                {ORDER_STEPS_LABEL[order.status as OrderStatus]}
                            </Badge>
                            <p className="font-semibold text-gray-800">{formatPrice(order.totalAmount)}</p>
                            {BadgeStatusPayment(order.paymentStatus)}
                        </div>
                    </div>
                ))}

                {!data?.length && !isLoading && (
                    <p className="text-sm text-gray-400 text-center py-4">Chưa có đơn hàng nào.</p>
                )}
            </CardContent>
        </Card>
    )
}

export default RecentOrderComponent