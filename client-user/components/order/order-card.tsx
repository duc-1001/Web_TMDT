"use client"

import { Card, CardContent } from "../ui/card"
import { Button } from "../ui/button"
import { MyOrderListItem } from "@/types/order"
import { Badge } from "../ui/badge"
import { formatDateTime, formatPrice, getStatusColor } from "@/lib/utils"
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    Eye,
    Loader2,
    Package,
    RotateCcw,
    Truck,
    XCircle,
} from "lucide-react"
import { OrderItemRow } from "./order-item-row"
import Link from "next/link"
import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogOverlay,
    DialogTitle,
} from "../ui/dialog"
import { useSelector } from "react-redux"
import { RootState } from "@/store/store"
import { useMutation } from "@tanstack/react-query"
import { cancelOrder } from "@/services/order.service"
import { queryClient } from "../QueryClientProviders"
import { toast } from "sonner"
import BtnCancelOrder from "./btn-cancel-order"
import BtnReorder from "./btn-reorder"

interface OrderCardProps {
    order: MyOrderListItem
    refetchOrders: () => void
}


const paymentColors = {
    paid: "bg-green-50 text-green-700 border border-green-200",
    pending: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    refunded: "bg-purple-50 text-purple-700 border border-purple-200",
}

const statusIcons = {
    pending: <Clock className="h-3 w-3" />,
    confirmed: <CheckCircle2 className="h-3 w-3" />,
    processing: <Loader2 className="h-3 w-3 animate-spin" />,
    packing: <Package className="h-3 w-3" />,
    shipping: <Truck className="h-3 w-3" />,
    delivered: <CheckCircle2 className="h-3 w-3" />,
    completed: <CheckCircle2 className="h-3 w-3" />,
    cancelled: <XCircle className="h-3 w-3" />,
    refunded: <RotateCcw className="h-3 w-3" />,
    failed: <AlertCircle className="h-3 w-3" />,
}

const OrderCard = ({ order, refetchOrders }: OrderCardProps) => {
    const [openDialogCancel, setOpenDialogCancel] = useState(false)
    const cancelOrderMutation = useMutation({
        mutationFn: (orderCode: string) => cancelOrder(orderCode),
        onSuccess: () => {
            refetchOrders()
            setOpenDialogCancel(false)
        }
    })
    return (
        <Card className="shadow-sm hover:shadow-md transition-all duration-300 border">
            <CardContent className="p-6">
                {/* ================= HEADER ================= */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="font-semibold text-lg tracking-wide">
                                {order.orderCode}
                            </h3>

                            <Badge
                                className={`${getStatusColor(
                                    order.status
                                )} flex items-center`}
                                variant="secondary"
                            >
                                <span className="mr-1">
                                    {
                                        statusIcons[
                                        order.status as keyof typeof statusIcons
                                        ]
                                    }
                                </span>
                                {order.status}
                            </Badge>

                            <Badge
                                className={
                                    paymentColors[
                                    order.paymentStatus as keyof typeof paymentColors
                                    ]
                                }
                                variant="secondary"
                            >
                                {order.paymentStatus}
                            </Badge>
                        </div>

                        <p className="text-xs text-muted-foreground">
                            Đặt ngày: {formatDateTime(order.createdAt)}
                        </p>
                    </div>

                    <div className="text-left md:text-right">
                        <p className="text-xs text-muted-foreground mb-1">
                            Tổng thanh toán
                        </p>
                        <p className="text-xl font-bold text-orange-500">
                            {formatPrice(order.totalAmount)}
                        </p>
                    </div>
                </div>

                {/* ================= ITEMS ================= */}
                <div className="space-y-2 my-4 max-h-60 overflow-y-auto pr-1">
                    {order.items.map((item) => (
                        <OrderItemRow key={item.productId} item={item} />
                    ))}
                </div>

                {/* ================= SUMMARY ================= */}
                <div className="bg-muted/30 rounded-lg p-3 mb-4 border border-border/50">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                            {order.items.length} sản phẩm
                        </span>
                        <span className="font-medium">
                            {order.items.reduce(
                                (sum, item) => sum + item.quantity,
                                0
                            )}{" "}
                            cái
                        </span>
                    </div>

                    {order.shippingFee > 0 && (
                        <div className="flex justify-between text-sm mt-2 pt-2 border-t border-border/50">
                            <span className="text-muted-foreground">
                                Phí vận chuyển
                            </span>
                            <span className="font-medium">
                                {formatPrice(order.shippingFee - order.shippingDiscount)}
                            </span>
                        </div>
                    )}
                </div>

                {/* ================= ACTIONS ================= */}

                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Chi tiết luôn có */}
                    <Button
                        variant="outline"
                        asChild
                        className="flex-1 bg-transparent"
                    >
                        <Link href={`/orders/${order.orderCode}?token=${order.viewToken}&tab=detail`} className="flex items-center justify-center">
                            <Eye className="h-4 w-4 mr-2" />
                            Chi tiết
                        </Link>
                    </Button>

                    {/* Pending */}
                    {order.status === "pending" && (
                        <BtnCancelOrder
                            orderCode={order.orderCode}
                            cancelOrderMutation={cancelOrderMutation}
                            setOpenDialogCancel={setOpenDialogCancel}
                            openDialogCancel={openDialogCancel}
                        />
                    )}

                    {/* Shipping */}
                    {order.status === "shipping" && (
                        <Button className="flex-1 bg-orange-500 text-white hover:bg-orange-500/90">
                            <Truck className="h-4 w-4 mr-2" />
                            Theo dõi
                        </Button>
                    )}

                    {/* Delivered / Completed */}
                    {(order.status === "delivered" ||
                        order.status === "completed" || order.status == "cancelled") && (
                            <BtnReorder orderCode={order.orderCode} />
                        )}
                </div>
            </CardContent>
        </Card>
    )
}

export default OrderCard