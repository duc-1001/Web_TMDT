import { OrderShippingInfo } from '@/types/order'
import React, { useMemo, useState } from "react"
import { Package, CheckCircle, CreditCard, Truck, BadgeDollarSign, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { formatPrice, getStatusColor, ORDER_STEPS, PAYMENT_NAME } from "@/lib/utils"
import BtnCancelOrder from "@/components/order/btn-cancel-order"
import BtnReorder from "@/components/order/btn-reorder"
import OrderItemDetailPage from "@/components/order/order-item-detai-page"
import { useMutation, useQuery } from '@tanstack/react-query'
import { cancelOrder, getOrderReviews } from '@/services/order.service'
import { RootState } from '@/store/store'
import { useSelector } from 'react-redux'
import { OrderReview, Review } from '@/types/review'
import { queryClient } from '../QueryClientProviders'
import { formatDateTime } from '@/lib/time'
interface DetailOrderTabProps {
    data: OrderShippingInfo
    refetch: () => void
    setActiveTab: React.Dispatch<React.SetStateAction<string>>
}

function getOrderActions(order: OrderShippingInfo) {
    const status = order?.status
    const paymentStatus = order?.payment?.status
    const paymentMethod = order?.payment?.method

    const isOnline =paymentMethod === "banking" || paymentMethod === "momo" || paymentMethod === "vnpay" 
    return {
        canPay:
            status === "pending" &&
            paymentStatus === "unpaid" &&
            isOnline,

        canCancel:
            status === "pending",

        canTrack:
            status === "shipping",

        canReview:
            status === "completed" || status === "delivered",

        canRefund: status === "delivered",

        canReorder: status === "completed" || status === "cancelled" || status === "delivered",
    }
}

const DetailOrderTab = ({ data, refetch, setActiveTab }: DetailOrderTabProps) => {
    const { isAuthenticated } = useSelector((state: RootState) => state.auth)
    const { data: reviewsData } = useQuery({
        queryKey: ["order-reviews", data._id],
        queryFn: () => getOrderReviews(data._id),
        enabled: !!data._id && isAuthenticated
    })

    const handleAddReviewSuccess = (newReview: Review | OrderReview) => {
        queryClient.setQueryData(["order-reviews", data._id], (oldData: any) => {
            if (!oldData) return [newReview]
            return [...oldData, newReview]
        })
    }

    const handleUpdateReviewSuccess = (updatedReview: Review | OrderReview) => {
        queryClient.setQueryData(["order-reviews", data._id], (oldData: any) => {
            if (!oldData) return oldData
            return oldData.map((review: Review | OrderReview) =>
                review._id === updatedReview._id ? updatedReview : review
            )
        }
        )
    }

    const reviews = useMemo(() => {
        if (!reviewsData) return []
        return reviewsData.map(r => ({
            ...r,
            createdAt: r.createdAt
        }))
    }, [reviewsData])

    const actions = getOrderActions(data)
    const currentIndex = ORDER_STEPS.findIndex(
        s => s.value === data?.status
    )
    const [openDialogCancel, setOpenDialogCancel] = useState(false)
    const cancelOrderMutation = useMutation({
        mutationFn: (orderCode: string) => cancelOrder(orderCode),
        onSuccess: () => {
            refetch()
            setOpenDialogCancel(false)
        },
    })
    return (
        <div>
            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Status */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Đơn hàng {data?.orderCode}</CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {data?.createdAt ? `Đặt vào ${formatDateTime(data.createdAt)}` : "Ngày đặt hàng không xác định"}
                                    </p>
                                </div>
                                <Badge className={`${getStatusColor(data?.status!)}`}>{data?.status}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="w-full py-8">
                                <div className="relative flex items-start justify-between">

                                    {/* Line nền */}
                                    <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200" />

                                    {/* Line progress xanh */}
                                    <div
                                        className="absolute top-6 left-0 h-0.5 bg-green-500 transition-all duration-500"
                                        style={{ width: `${(currentIndex / (ORDER_STEPS.length - 1)) * 100}%` }}
                                    />

                                    {ORDER_STEPS.map((step, index) => {
                                        const isPassed = index < currentIndex;
                                        const isCurrent = index === currentIndex;
                                        const timelineItem = data?.timeline?.find((t) => t.to === step.value);

                                        return (
                                            <div key={step.value} className="relative flex flex-col items-center flex-1 text-center min-h-[120px]">

                                                {/* Circle */}
                                                <div className={`z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${isCurrent
                                                    ? "bg-orange-600 border-orange-600 text-white scale-110 shadow-lg"
                                                    : isPassed
                                                        ? "bg-green-600 border-green-600 text-white"
                                                        : "bg-white border-gray-300 text-gray-400"
                                                    }`}>
                                                    {isPassed ? <CheckCircle className="h-5 w-5" /> : <Package className="h-5 w-5" />}
                                                </div>

                                                {/* Label */}
                                                <p className={`mt-4 text-sm font-medium ${isCurrent
                                                    ? "text-orange-600 font-semibold"
                                                    : isPassed
                                                        ? "text-gray-800"
                                                        : "text-gray-400"
                                                    }`}>
                                                    {step.label}
                                                </p>

                                                {/* Time (luôn giữ chỗ để không lệch) */}
                                                <p className="mt-2 text-xs text-gray-500 h-4">
                                                    {timelineItem ? formatDateTime(timelineItem.time) : ""}
                                                </p>

                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Order Items */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Sản phẩm đã đặt</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 px-3 max-h-[400px] lg:max-h-[620px] overflow-y-auto">
                                {data?.items.map((item) => {
                                    const review = reviews.find((r) => r.productId === item.productId);
                                    return (
                                        <OrderItemDetailPage
                                            key={item.productId}
                                            item={item}
                                            canReview={actions.canReview}
                                            orderId={data._id}
                                            review={review}
                                            handleAddReviewSuccess={handleAddReviewSuccess}
                                            handleUpdateReviewSuccess={handleUpdateReviewSuccess}
                                        />
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    {/* Shipping Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Thông tin giao hàng</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Người nhận</p>
                                <p className="font-medium">{data?.shippingAddress?.fullName}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Số điện thoại</p>
                                <p className="font-medium">{data?.shippingAddress?.phone}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Địa chỉ</p>
                                <p className="font-medium">{data?.shippingAddress?.address + ", " + data?.shippingAddress?.ward?.name + ", " + data?.shippingAddress?.province?.name}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Info */}
                    <Card className="border border-gray-200 shadow-md rounded-2xl overflow-hidden">
                        <CardHeader className="flex items-center justify-between bg-gray-50 px-6 py-4">
                            <CardTitle className="text-base font-semibold text-gray-800">Phương thức thanh toán</CardTitle>
                            <span
                                className={`px-3 py-1 text-xs font-semibold rounded-full ${data?.payment?.status === "paid"
                                    ? "bg-green-100 text-green-800"
                                    : data?.payment?.status === "expired"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-red-100 text-red-700"
                                    }`}
                            >
                                {data?.payment?.status === "paid"
                                    ? "Đã thanh toán"
                                    : data?.payment?.status === "expired"
                                        ? "Hết hạn"
                                        : "Chưa thanh toán"}
                            </span>
                        </CardHeader>

                        <CardContent className="px-6 py-4 space-y-4">
                            {/* Method row */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Hình thức</p>
                                    <p className="text-base font-medium text-gray-900">{PAYMENT_NAME[data?.payment?.method!]}</p>
                                </div>
                                {data?.payment?.status === "paid" && (
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                )}
                            </div>

                            {/* Payment URL */}
                            {data?.payment?.paymentUrl && actions.canPay && (
                                <div className="flex items-center justify-between">
                                    <a
                                        href={data.payment.paymentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
                                    >
                                        Xem chi tiết thanh toán
                                    </a>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Order Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Tổng quan đơn hàng</CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-3">

                            {/* Subtotal */}
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Tạm tính</span>
                                <span>{formatPrice(data?.pricing?.subtotal || 0)}</span>
                            </div>

                            {/* Item Discounts */}
                            {data?.pricing?.appliedDiscounts
                                ?.filter((d) => d.type !== "shipping")
                                ?.map((discount) => (
                                    <div
                                        key={discount._id}
                                        className="flex justify-between text-sm text-green-600"
                                    >
                                        <span>
                                            {discount.name} ({discount.code})
                                        </span>
                                        <span>-{formatPrice(discount.amount)}</span>
                                    </div>
                                ))}

                            {/* Shipping Fee */}
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Phí vận chuyển</span>
                                <span>{formatPrice(data?.pricing?.shippingFee || 0)}</span>
                            </div>

                            {/* Shipping Discount */}
                            {data?.pricing?.appliedDiscounts
                                ?.filter((d) => d.type === "shipping")
                                ?.map((discount) => (
                                    <div
                                        key={discount._id}
                                        className="flex justify-between text-sm text-green-600"
                                    >
                                        <span>
                                            {discount.name} ({discount.code})
                                        </span>
                                        <span>-{formatPrice(data?.pricing?.shippingDiscount || 0)}</span>
                                    </div>
                                ))}

                            <Separator />

                            {/* Total */}
                            <div className="flex justify-between text-lg font-bold">
                                <span>Tổng cộng</span>
                                <span className="text-orange-500">
                                    {formatPrice(data?.pricing?.total || 0)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {(actions.canPay || actions.canReorder || actions.canTrack || actions.canRefund || actions.canCancel) && (
                        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-md">
                            <div className="space-y-4">

                                {/* ===== Primary Action ===== */}
                                {/* {actions.canPay && (
                                    <Button className="h-12 w-full text-white bg-black hover:bg-gray-800 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 text-base font-medium shadow-sm">
                                        <CreditCard size={18} />
                                        Thanh toán ngay
                                    </Button>
                                )} */}

                                {actions.canReorder && (
                                    <BtnReorder orderCode={data?.orderCode!} />
                                )}

                                {/* ===== Divider ===== */}
                                <div className="border-t pt-4 space-y-3">

                                    {actions.canTrack && (
                                        <Button
                                            variant="outline"
                                            className="w-full border-gray-200 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2"
                                        >
                                            <Truck size={18} />
                                            Theo dõi đơn hàng
                                        </Button>
                                    )}

                                    {actions.canRefund && (
                                        <Button
                                            onClick={() => setActiveTab("refund")}
                                            variant="outline"
                                            className="w-full border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300 flex items-center justify-center gap-2 font-medium"
                                        >
                                            <BadgeDollarSign className="h-4 w-4" />
                                            {data?.refundStatus === "none" ? "Yêu cầu hoàn tiền" : "Xem yêu cầu hoàn tiền"}
                                        </Button>
                                    )}

                                    {actions.canCancel && (
                                        <BtnCancelOrder
                                            cancelOrderMutation={cancelOrderMutation}
                                            openDialogCancel={openDialogCancel}
                                            setOpenDialogCancel={setOpenDialogCancel}
                                            orderCode={data?.orderCode!}
                                        />
                                    )}

                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default DetailOrderTab
