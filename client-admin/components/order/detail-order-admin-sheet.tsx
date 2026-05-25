import React from 'react'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle
} from '../ui/sheet'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Separator } from '../ui/separator'
import {
    Badge,
    CheckCircle2,
    Copy,
    ExternalLink,
    Mail,
    MapPin,
    Phone
} from 'lucide-react'
import { formatDateTime, formatPrice, ORDER_STEPS, PAYMENT_NAME } from '@/lib/utils'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '../ui/select'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { getOrderDetailsAdmin, markOrderAsPaid, revertOrderToUnpaid } from '@/services/order.service'
import { OrderStatus } from '@/types/order'
import { OrderItemRow } from './order-item-row'
import { queryClient } from '../QueryClientProviders'
import { toast } from 'sonner'
import { BadgeStatusPayment } from '@/app/(admin)/orders/page'

interface DetailOrderAdminSheetProps {
    sheetOpen: boolean
    setSheetOpen: (open: boolean) => void
    orderCode?: string
    getStatusColor: (status: OrderStatus) => string
    optimisticallyMarkOrderAsPaid: (orderCode: string) => void
    optimisticallyRevertOrderToUnpaid: (orderCode: string) => void
}


const DetailOrderAdminSheet = ({
    optimisticallyMarkOrderAsPaid,
    optimisticallyRevertOrderToUnpaid,
    sheetOpen,
    setSheetOpen,
    orderCode,
    getStatusColor
}: DetailOrderAdminSheetProps) => {
    const { data: selectedOrderDetail } = useQuery({
        queryKey: ['orderDetail', orderCode],
        queryFn: () => getOrderDetailsAdmin(orderCode!),
        enabled: !!orderCode && sheetOpen
    })

    const markAsPaidMutation = useMutation({
        mutationFn: (orderCode: string) => markOrderAsPaid(orderCode),

        onSuccess: (data) => {
            queryClient.setQueryData(
                ['orderDetail', orderCode],
                data
            )
            queryClient.invalidateQueries({ queryKey: ["order-summary"] })
            optimisticallyMarkOrderAsPaid(orderCode!)
            toast.success("Đã đánh dấu thanh toán")
        },

        onError: (error: any) => {
            toast.error(error?.message || "Đã có lỗi xảy ra")
        }
    })

    const revertToUnpaidMutation = useMutation({
        mutationFn: (orderCode: string) => revertOrderToUnpaid(orderCode),

        onSuccess: (data) => {
            queryClient.setQueryData(
                ['orderDetail', orderCode],
                data
            )
            queryClient.invalidateQueries({ queryKey: ["order-summary"] })
            optimisticallyRevertOrderToUnpaid(orderCode!)
            toast.success("Đã hoàn tác thanh toán")
        },

        onError: (error: any) => {
            toast.error(error?.message || "Đã có lỗi xảy ra")
        }
    })

    if (!selectedOrderDetail) return null


    return (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetContent className="w-full sm:max-w-2xl px-6 py-6 overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="text-2xl font-bold">
                        {selectedOrderDetail.orderCode}
                    </SheetTitle>
                    <SheetDescription>
                        Chi tiết và quản lý đơn hàng
                    </SheetDescription>
                </SheetHeader>

                <Tabs defaultValue="overview" className="mt-6">
                    <TabsList className="grid w-full grid-cols-5 bg-muted rounded-xl p-1">
                        {[
                            { label: 'Tổng quát', value: 'overview' },
                            { label: 'Sản phẩm', value: 'items' },
                            { label: 'Thanh toán', value: 'payment' },
                            { label: 'Vận chuyển', value: 'shipping' },
                            { label: 'Lịch sử', value: 'timeline' }
                        ].map(tab => (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                className="text-xs rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                            >
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {/* ================= OVERVIEW ================= */}
                    <TabsContent value="overview" className="space-y-6 mt-6">
                        {/* Stepper */}
                        <div>
                            <h3 className="font-semibold mb-4">Quy trình đơn hàng</h3>

                            <div className="flex items-start justify-between relative">
                                {ORDER_STEPS.map((step, idx) => {
                                    const currentIndex = ORDER_STEPS.findIndex(
                                        s => s.value === selectedOrderDetail.status
                                    )

                                    const isActive = currentIndex >= idx
                                    const isPassed = currentIndex > idx
                                    const isCurrent = currentIndex === idx

                                    return (
                                        <div
                                            key={step.value}
                                            className="flex-1 flex flex-col items-center relative text-center"
                                        >
                                            {/* Circle */}
                                            <div
                                                className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300  ${isActive ? 'bg-green-500 text-white shadow-md' : 'bg-gray-200 text-gray-500'}`} >
                                                {idx + 1}
                                            </div>

                                            {/* Line */}
                                            {idx < ORDER_STEPS.length - 1 && (
                                                <div
                                                    className={`absolute top-5 left-1/2 w-full h-0.5 -z-10  ${isPassed ? 'bg-green-500' : 'bg-gray-200'}`}
                                                />
                                            )}

                                            {/* Label */}
                                            <span
                                                className={`mt-3 text-[11px] font-medium transition-colors   ${isCurrent ? 'text-green-600' : 'text-muted-foreground'}`}
                                            >
                                                {step.label}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <Separator />

                        {/* Customer Info */}
                        <div className="bg-white rounded-xl border p-5 shadow-sm space-y-6">
                            <div>
                                <h3 className="font-semibold flex items-center gap-2 mb-3">
                                    <Phone className="h-4 w-4" />
                                    Thông tin khách hàng
                                </h3>

                                <div className="space-y-2 text-sm ml-6">
                                    <p>
                                        <span className="text-muted-foreground">
                                            Tên:
                                        </span>{' '}
                                        {selectedOrderDetail.customer.name}
                                    </p>

                                    <p className="flex items-center gap-2">
                                        <Phone className="h-3 w-3 text-muted-foreground" />
                                        {selectedOrderDetail.customer.phone}
                                    </p>

                                    <p className="flex items-center gap-2">
                                        <Mail className="h-3 w-3 text-muted-foreground" />
                                        {selectedOrderDetail.customer.email}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold flex items-center gap-2 mb-3">
                                    <MapPin className="h-4 w-4" />
                                    Địa chỉ giao hàng
                                </h3>

                                <p className="text-sm ml-6">
                                    {selectedOrderDetail.shippingAddress.address + ', ' + selectedOrderDetail.shippingAddress.ward?.name + ', ' + selectedOrderDetail.shippingAddress.province?.name}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="font-semibold mb-2">
                                        Trạng thái
                                    </h3>
                                    <div
                                        className={`px-3 py-1 w-fit text-xs font-medium rounded-full ${getStatusColor(
                                            selectedOrderDetail.status
                                        )}`}
                                    >
                                        {selectedOrderDetail.status}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold mb-2">
                                        Thanh toán
                                    </h3>
                                    <div
                                        className={`px-3 py-1 w-fit text-xs font-medium rounded-full ${selectedOrderDetail.paymentStatus ===
                                            'paid'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                            }`}
                                    >
                                        {selectedOrderDetail.paymentStatus}
                                    </div>
                                </div>
                            </div>

                            {selectedOrderDetail.note && (
                                <div>
                                    <h3 className="font-semibold mb-2">
                                        Ghi chú
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedOrderDetail.note}
                                    </p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* ================= ITEMS ================= */}
                    <TabsContent value="items" className="space-y-4 mt-6">
                        {selectedOrderDetail.items.map((item: any, idx: number) => (
                            <OrderItemRow key={idx} item={item} />
                        )
                        )}
                    </TabsContent>

                    {/* ================= PAYMENT ================= */}
                    <TabsContent value="payment" className="mt-6">
                        <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-5">

                            {/* Title */}
                            <h3 className="text-lg font-semibold">
                                Thông tin thanh toán
                            </h3>

                            {/* Payment Method */}
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">
                                    Phương thức
                                </span>
                                <span className="font-medium">
                                    {PAYMENT_NAME[selectedOrderDetail.paymentMethod] ||
                                        selectedOrderDetail.paymentMethod}
                                </span>
                            </div>

                            {/* Payment Status */}
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">
                                    Trạng thái thanh toán
                                </span>
                                {BadgeStatusPayment(selectedOrderDetail.paymentStatus)}
                            </div>

                            {/* Refund Status */}
                            {selectedOrderDetail.refundStatus !== "none" && (
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">
                                        Trạng thái hoàn tiền
                                    </span>
                                    <span className="font-medium">
                                        {selectedOrderDetail.refundStatus === "partial"
                                            ? "Hoàn tiền một phần"
                                            : "Hoàn tiền toàn bộ"}
                                    </span>
                                </div>
                            )}

                            <Separator />

                            {/* Subtotal */}
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">
                                    Tạm tính
                                </span>
                                <span className="font-medium">
                                    {formatPrice(selectedOrderDetail.subtotal)}
                                </span>
                            </div>

                            {/* Discount */}
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">
                                    Giảm giá
                                </span>
                                <span className="font-medium text-red-600">
                                    {selectedOrderDetail.discountAmount > 0
                                        ? `- ${formatPrice(selectedOrderDetail.discountAmount)}`
                                        : "Không có"}
                                </span>
                            </div>

                            {/* Shipping */}
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">
                                    Phí vận chuyển
                                </span>
                                <span className="font-medium">
                                    {formatPrice(selectedOrderDetail.shippingFee)}
                                </span>
                            </div>

                            {/* Refunded */}
                            {selectedOrderDetail.refundedAmount > 0 && (
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">
                                        Đã hoàn tiền
                                    </span>
                                    <span className="font-medium text-red-500">
                                        - {formatPrice(selectedOrderDetail.refundedAmount)}
                                    </span>
                                </div>
                            )}

                            <Separator />

                            {/* Total */}
                            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl">
                                <span className="text-base font-semibold">
                                    Tổng thanh toán
                                </span>
                                <span className="text-xl font-bold text-orange-500">
                                    {formatPrice(selectedOrderDetail.totalAmount)}
                                </span>
                            </div>

                            {/* Paid action */}
                            {selectedOrderDetail.paymentStatus === "unpaid" && (
                                <Button
                                    disabled={markAsPaidMutation.isPending}
                                    onClick={() =>
                                        markAsPaidMutation.mutate(selectedOrderDetail.orderCode)
                                    }
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    {markAsPaidMutation.isPending
                                        ? "Đang xử lý..."
                                        : "Đánh dấu đã thanh toán"}
                                </Button>
                            )}

                        </div>
                    </TabsContent>

                    {/* ================= SHIPPING ================= */}
                    <TabsContent value="shipping" className="mt-6">
                        <div className="space-y-5 bg-white p-5 rounded-xl border shadow-sm">
                            <div>
                                <label className="text-sm font-semibold mb-2 block">
                                    Nhà vận chuyển
                                </label>
                                <Select
                                    defaultValue={
                                        selectedOrderDetail.shippingInfo
                                            ?.carrier || 'GHN'
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent position='popper' sideOffset={4}>
                                        {['GHN', 'GHTK', 'VNPost'].map(
                                            carrier => (
                                                <SelectItem
                                                    key={carrier}
                                                    value={carrier}
                                                >
                                                    {carrier}
                                                </SelectItem>
                                            )
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-sm font-semibold mb-2 block">
                                    Mã theo dõi
                                </label>
                                <Input
                                    value={
                                        selectedOrderDetail.shippingInfo
                                            ?.trackingCode || ''
                                    }
                                    readOnly
                                />
                            </div>

                            <Button className="w-full rounded-lg shadow-sm">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Xem vị trí
                            </Button>
                        </div>
                    </TabsContent>

                    {/* ================= TIMELINE ================= */}
                    <TabsContent value="timeline" className="mt-6">
                        <div className="space-y-6">
                            {selectedOrderDetail.timeline.map(
                                (event: any, idx: number) => (
                                    <div key={idx} className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-9 h-9 rounded-full bg-green-500/10 flex items-center justify-center">
                                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                            </div>

                                            {idx <
                                                selectedOrderDetail.timeline
                                                    .length -
                                                1 && (
                                                    <div className="w-0.5 h-10 bg-gray-200 my-1" />
                                                )}
                                        </div>

                                        <div className="flex-1 bg-white border rounded-lg p-4 shadow-sm">
                                            <p className="font-semibold text-sm">
                                                {event.event}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {formatDateTime(event.time)}
                                            </p>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </SheetContent>
        </Sheet>
    )
}

export default DetailOrderAdminSheet