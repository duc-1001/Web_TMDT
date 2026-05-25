"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { ShoppingCart, Clock, CheckCircle2, DollarSign, Truck, Eye } from "lucide-react"
import { useState, useMemo, JSX, } from "react"
import { useQuery } from "@tanstack/react-query"
import { getOrdersAdmin, getOrderSummaryAdmin, updateBulkCancelOrderStatus, updateBulkNextOrderStatus, updateOrderStatus } from "@/services/order.service"
import { AdminOrderListItem, OrderStatus, OrderStatusForWorkflow, PaymentStatus } from "@/types/order"
import { formatDateTime } from "@/lib/utils"
import useDebounce from "@/hooks/use-debounce"
import DetailOrderAdminSheet from "@/components/order/detail-order-admin-sheet"
import { queryClient } from "@/components/QueryClientProviders"
import { toast } from "sonner"
import { PaginatedData } from "@/types/commons"
import PaginationControls from "@/components/layout/pagination-controls-admin"
import Link from "next/link"

// ============ TYPE DEFINITIONS ============

const STATUS_LABEL: Record<OrderStatus, string> = {
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    shipping: "Đang giao",
    delivered: "Đã giao",
    completed: "Hoàn tất",
    cancelled: "Huỷ đơn",
    failed: "Giao thất bại",
}



// ============ WORKFLOW RULES ============
const WORKFLOW_TRANSITIONS: Record<OrderStatusForWorkflow, OrderStatus[]> = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["shipping", "cancelled"],
    shipping: ["delivered", "failed"],
    failed: ["shipping", "cancelled"],
}

const getValidNextStatuses = (currentStatus: OrderStatusForWorkflow): OrderStatus[] => WORKFLOW_TRANSITIONS[currentStatus] || []

export const BadgeStatusPayment: (status: PaymentStatus) => JSX.Element = (status) => {
    if (status === "paid") {
        return <Badge className="bg-green-100 text-green-800">Đã thanh toán</Badge>
    }
    else if (status === "refunded") {
        return <Badge className="bg-orange-100 text-orange-800">Đã hoàn tiền</Badge>
    }
    else if (status === "partially_refunded") {
        return <Badge className="bg-yellow-100 text-yellow-800">Hoàn tiền một phần</Badge>
    }
    else if (status === "failed") {
        return <Badge className="bg-red-100 text-red-800">Thanh toán thất bại</Badge>
    }
    else if (status === "expired") {
        return <Badge className="bg-gray-100 text-gray-800">Đã hết hạn</Badge>
    }
    return <Badge className="bg-red-100 text-red-800">Chưa thanh toán</Badge>
}

// ============ MAIN COMPONENT ============
export default function OrdersPage() {
    const [selectedOrders, setSelectedOrders] = useState<string[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<OrderStatusForWorkflow | "all">("all")
    const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatus | "all">("all")
    const [sortBy, setSortBy] = useState("date-desc")
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [selectedOrderDetail, setSelectedOrderDetail] = useState<AdminOrderListItem | null>(null)
    const [sheetOpen, setSheetOpen] = useState(false)
    const [bulkActionDialog, setBulkActionDialog] = useState<{ open: boolean; action: string }>({ open: false, action: "" })
    const [statusChangeDialog, setStatusChangeDialog] = useState<{ open: boolean; orderCode?: string; newStatus?: OrderStatus }>({ open: false })
    const [loadingChangeStatus, setLoadingChangeStatus] = useState(false)
    const [loadingBulkAction, setLoadingBulkAction] = useState(false)

    const formatPrice = (price: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price)

    const getStatusColor = (status: OrderStatus): string => {
        const colors: Record<OrderStatus, string> = {
            pending: "bg-yellow-100 text-yellow-800",
            confirmed: "bg-blue-100 text-blue-800",
            shipping: "bg-cyan-100 text-cyan-800",
            delivered: "bg-green-100 text-green-800",
            completed: "bg-green-100 text-green-800",
            cancelled: "bg-red-100 text-red-800",
            failed: "bg-red-100 text-red-800",
        }
        return colors[status] || "bg-gray-100 text-gray-800"
    }

    const getSLAStatus = (order: AdminOrderListItem) => {
        if (!order.slaAt || order.status !== "pending") {
            return { color: "bg-gray-100 text-gray-500", text: "-" }
        }

        const slaTime = new Date(order.slaAt).getTime()

        if (isNaN(slaTime)) {
            return { color: "bg-gray-100 text-gray-500", text: "-" }
        }

        const nowTime = Date.now()

        const diffMs = slaTime - nowTime

        if (diffMs <= 0) {
            return { color: "bg-red-100 text-red-800", text: "Quá hạn" }
        }

        const totalMinutes = Math.floor(diffMs / 60000)

        if (totalMinutes < 60) {
            return {
                color: "bg-red-100 text-red-800",
                text: `${totalMinutes}p`
            }
        }

        const hours = Math.floor(totalMinutes / 60)
        const remainingMinutes = totalMinutes % 60

        if (hours < 2) {
            return {
                color: "bg-yellow-100 text-yellow-800",
                text: remainingMinutes > 0
                    ? `${hours}h ${remainingMinutes}p`
                    : `${hours}h`
            }
        }

        return {
            color: "bg-green-100 text-green-800",
            text: remainingMinutes > 0
                ? `${hours}h ${remainingMinutes}p`
                : `${hours}h`
        }
    }

    const q = useDebounce(searchQuery, 500)
    const ordersQueryKey = ["orders", q, statusFilter, paymentStatusFilter, sortBy, currentPage, itemsPerPage]

    const { data: ordersData, isLoading } = useQuery({
        queryKey: ordersQueryKey,
        queryFn: () => getOrdersAdmin(currentPage, itemsPerPage, q, statusFilter, paymentStatusFilter, sortBy),
    })

    const { data: orderSummaryData } = useQuery({
        queryKey: ["order-summary"],
        queryFn: () => getOrderSummaryAdmin(),
        staleTime: 5 * 60 * 1000, // 5 phút
    })

    const paginatedOrders = useMemo(() => {
        if (!ordersData) return []
        return ordersData.data
    }, [ordersData])

    const totalPages = useMemo(() => {
        if (!ordersData) return 1
        return ordersData.pagination.totalPages
    }, [ordersData])

    const totalItems = useMemo(() => {
        if (!ordersData) return 0
        return ordersData.pagination.total
    }, [ordersData])

    const stats = useMemo(() => {
        if (!orderSummaryData) return {
            pending: 0,
            shipping: 0,
            completedToday: 0,
            revenueToday: 0,
        }
        return {
            pending: orderSummaryData.pending,
            shipping: orderSummaryData.shipping,
            completedToday: orderSummaryData.completedToday,
            revenueToday: orderSummaryData.revenueToday,
        }
    }, [orderSummaryData])

    const handleStatusChange = (orderCode: string, newStatus: OrderStatus) => {
        const order = ordersData?.data.find((o) => o.orderCode === orderCode)
        if (order && getValidNextStatuses(order.status as OrderStatusForWorkflow).includes(newStatus)) {
            setStatusChangeDialog({ open: true, orderCode, newStatus })
        }
    }

    const confirmBulkAction = async () => {
        console.log(selectedOrders);
        setLoadingBulkAction(true)
        const action = bulkActionDialog.action

        if (!selectedOrders.length) return

        try {
            let response

            if (action === "next") {
                response = await updateBulkNextOrderStatus(selectedOrders)
            } else if (action === "cancel") {
                response = await updateBulkCancelOrderStatus(selectedOrders)
            } else {
                return
            }

            const { success, failed } = response || {}

            // ✅ Update cache bằng dữ liệu trả về từ backend
            if (success && success.length > 0) {
                queryClient.setQueryData(
                    ordersQueryKey,
                    (oldData: any) => {
                        if (!oldData) return oldData

                        const updatedOrders = oldData.data.map((o: AdminOrderListItem) => {
                            const updated = success.find((s) => s._id === o._id)
                            return updated ? updated : o
                        })

                        return { ...oldData, data: updatedOrders }
                    }
                )

                // ✅ Hiển thị toast
                if (success.length > 0) {
                    toast.success(`Thành công ${success.length} đơn`)
                }
            }

            if (failed && failed.length > 0) {
                toast.error(`${failed.length} đơn thất bại`, {
                    description: (
                        <div className="whitespace-pre-line">
                            {failed.map(f => `${f.orderCode}: ${f.reason}`).join("\n")}
                        </div>
                    )
                })
            }

        } catch (error: any) {
            toast.error("Bulk action thất bại", {
                description: error?.message || "Có lỗi xảy ra"
            })
        }
        finally {
            setLoadingBulkAction(false)
            setSelectedOrders([])
            setBulkActionDialog({ open: false, action: "" })
        }
    }

    const getStatusOptions = (currentStatus: OrderStatusForWorkflow): OrderStatus[] => {
        return [currentStatus, ...(WORKFLOW_TRANSITIONS[currentStatus] || [])]
    }

    const handleChangeOrderStatus = async (
        orderCode: string,
        newStatus: OrderStatus
    ) => {
        try {
            setLoadingChangeStatus(true)
            const updatedOrder = await updateOrderStatus(orderCode, newStatus)

            if (!updatedOrder) return

            queryClient.setQueryData(
                ordersQueryKey,
                (oldData: any) => {
                    if (!oldData) return oldData

                    return {
                        ...oldData,
                        data: oldData.data.map((order: AdminOrderListItem) =>
                            order.orderCode === orderCode
                                ? {
                                    ...order,
                                    ...updatedOrder, // dùng data server trả về
                                }
                                : order
                        ),
                    }
                }
            )
        } catch (error) {
            console.error("Failed to update order status:", error)
        } finally {
            setLoadingChangeStatus(false)
            setStatusChangeDialog({ open: false })
        }
    }

    const handleBulkNext = () => {
        setBulkActionDialog({ open: true, action: "next" })
    }

    const handleBulkCancel = () => {
        setBulkActionDialog({ open: true, action: "cancel" })
    }

    const optimisticallyMarkOrderAsPaid = (orderCode: string) => {
        queryClient.setQueryData(ordersQueryKey,
            (oldData: PaginatedData<AdminOrderListItem>) => {
                if (!oldData?.data) return oldData

                return {
                    ...oldData,
                    data: oldData.data.map((order: AdminOrderListItem) =>
                        order.orderCode === orderCode
                            ? { ...order, paymentStatus: 'paid' }
                            : order
                    ),
                }
            })
    }

    const optimisticallyRevertOrderToUnpaid = (orderCode: string) => {
        queryClient.setQueryData(
            ordersQueryKey,
            (oldData: PaginatedData<AdminOrderListItem>) => {
                if (!oldData) return oldData

                return {
                    ...oldData,
                    data: oldData.data.map((order: AdminOrderListItem) =>
                        order.orderCode === orderCode
                            ? { ...order, paymentStatus: 'unpaid' }
                            : order
                    ),
                }
            }
        )
    }


    return (
        <div>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">Quản lý đơn hàng</h1>
                    <p className="text-muted-foreground">Quản lý tất cả đơn hàng từ khách hàng</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[
                        {
                            label: "Chờ xác nhận",
                            value: stats.pending,
                            icon: Clock,
                            color: "from-amber-500 to-amber-600",
                        },
                        {
                            label: "Đang vận chuyển",
                            value: stats.shipping,
                            icon: Truck,
                            color: "from-cyan-500 to-cyan-600",
                        },
                        {
                            label: "Hoàn thành hôm nay",
                            value: stats.completedToday,
                            icon: CheckCircle2,
                            color: "from-emerald-500 to-emerald-600",
                        },
                        {
                            label: "Doanh thu hôm nay",
                            value: formatPrice(stats.revenueToday),
                            icon: DollarSign,
                            color: "from-purple-500 to-purple-600",
                            isPrice: true,
                        },
                    ].map((stat, i) => (
                        <Card
                            key={i}
                            className="bg-white border hover:shadow-md transition-all duration-200"
                        >
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            {stat.label}
                                        </p>
                                        <p className="text-2xl font-semibold mt-1">
                                            {stat.value ?? 0}
                                        </p>
                                    </div>

                                    <div
                                        className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-sm`}
                                    >
                                        <stat.icon className="h-5 w-5" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Filters & Bulk Actions */}
                <Card className="mb-8">
                    <CardContent className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2  gap-3">
                            <Input placeholder="Tìm kiếm mã đơn, số điện thoại..." value={searchQuery} onChange={(e) => {
                                setSearchQuery(e.target.value)
                                setCurrentPage(1)
                            }} className="text-sm" />
                            <div className="flex gap-3 md:justify-end">
                                <Select value={statusFilter} onValueChange={(v) => {
                                    setStatusFilter(v as any)
                                    setCurrentPage(1)
                                }}>
                                    <SelectTrigger className="text-sm">
                                        <SelectValue placeholder="Trạng thái" />
                                    </SelectTrigger>
                                    <SelectContent position="popper" sideOffset={4}>
                                        <SelectItem value="all">Tất cả</SelectItem>
                                        {(["pending", "confirmed", "packing", "shipping", "delivered", "cancelled"] as const).map((s) => (
                                            <SelectItem key={s} value={s}>{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={paymentStatusFilter} onValueChange={(v) => {
                                    setPaymentStatusFilter(v as any)
                                    setCurrentPage(1)
                                }}>
                                    <SelectTrigger className="text-sm">
                                        <SelectValue placeholder="Thanh toán" />
                                    </SelectTrigger>
                                    <SelectContent position="popper" sideOffset={4}>
                                        <SelectItem value="all">Tất cả</SelectItem>
                                        {(["paid", "unpaid", "failed", "refunded"] as const).map((s) => (
                                            <SelectItem key={s} value={s}>{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={sortBy} onValueChange={setSortBy}>
                                    <SelectTrigger className="text-sm">
                                        <SelectValue placeholder="Sắp xếp" />
                                    </SelectTrigger>
                                    <SelectContent position="popper" sideOffset={4}>
                                        <SelectItem value="date-desc">Mới nhất</SelectItem>
                                        <SelectItem value="date-asc">Cũ nhất</SelectItem>
                                        <SelectItem value="amount-desc">Cao nhất</SelectItem>
                                        <SelectItem value="amount-asc">Thấp nhất</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {selectedOrders.length > 0 && (
                            <div className="sticky bottom-4 z-50 flex justify-center">
                                <div className="flex items-center gap-6 bg-white shadow-xl border border-gray-200 rounded-2xl px-6 py-4 transition-all duration-200">

                                    {/* Số lượng */}
                                    <div className="text-sm font-medium text-gray-700">
                                        <span className="font-semibold text-gray-900">
                                            {selectedOrders.length}
                                        </span>{" "}
                                        đơn đã chọn
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-3">

                                        <Button
                                            size="sm"
                                            onClick={() => handleBulkNext()}
                                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-lg shadow-sm"
                                        >
                                            Chuyển bước tiếp theo
                                        </Button>

                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleBulkCancel()}
                                            className="text-red-600 border-red-200 hover:bg-red-50 text-xs px-4 py-2 rounded-lg"
                                        >
                                            Huỷ đơn hàng
                                        </Button>

                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Table */}
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-slate-50">
                                    <th className="px-4 py-3 text-left"><Checkbox checked={selectedOrders.length === paginatedOrders.length && paginatedOrders.length > 0} onCheckedChange={(checked) => setSelectedOrders(checked ? paginatedOrders.map((o) => o._id) : [])} /></th>
                                    <th className="px-4 py-3 text-left font-semibold">Mã đơn</th>
                                    <th className="px-4 py-3 text-left font-semibold">Khách hàng</th>
                                    <th className="px-4 py-3 text-left font-semibold">SĐT</th>
                                    <th className="px-4 py-3 text-left font-semibold">Ngày</th>
                                    <th className="px-4 py-3 text-right font-semibold">Tổng</th>
                                    <th className="px-4 py-3 text-left font-semibold">TT</th>
                                    <th className="px-4 py-3 text-left font-semibold">Trạng thái</th>
                                    <th className="px-4 py-3 text-left font-semibold">SLA</th>
                                    <th className="px-4 py-3 text-center font-semibold">Chi tiết</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedOrders.map((order) => {
                                    const slaStatus = getSLAStatus(order)
                                    const hasAlerts = (order.paymentStatus === "unpaid" && ["shipping", "delivered"].includes(order.status)) || !order.assignedStaff || order.paymentStatus === "failed"

                                    return (
                                        <tr key={order._id} className={`border-b hover:bg-slate-50 transition-colors ${hasAlerts ? "bg-amber-50" : ""}`}>
                                            <td className="px-4 py-3"><Checkbox checked={selectedOrders.includes(order._id)} onCheckedChange={(checked) => setSelectedOrders(checked ? [...selectedOrders, order._id] : selectedOrders.filter((id) => id !== order._id))} /></td>
                                            <td className="px-4 py-3 font-mono font-semibold">
                                                <Link href={`/orders/${order.orderCode}`} className="text-blue-600 hover:underline">
                                                    {order.orderCode}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3">{order.customer.name}</td>
                                            <td className="px-4 py-3">{order.customer.phone}</td>
                                            <td className="px-4 py-3 text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</td>
                                            <td className="px-4 py-3 text-right font-semibold">{formatPrice(order.totalAmount)}</td>
                                            <td className="px-4 py-3">
                                                {BadgeStatusPayment(order.paymentStatus)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Select
                                                    value={order.status}
                                                    onValueChange={(newStatus) => {
                                                        handleStatusChange(order.orderCode, newStatus as OrderStatus)
                                                    }}
                                                >
                                                    <SelectTrigger className={`text-xs !py-0 ${getStatusColor(order.status)}`}>
                                                        <SelectValue />
                                                    </SelectTrigger>

                                                    <SelectContent position="popper" sideOffset={4}>
                                                        {getStatusOptions(order.status as OrderStatusForWorkflow).map((s) => (
                                                            <SelectItem
                                                                key={s}
                                                                value={s}
                                                                disabled={s === order.status}
                                                            >
                                                                {STATUS_LABEL[s]}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </td>
                                            <td className="px-4 py-3"><Badge className={slaStatus.color}>{slaStatus.text}</Badge></td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="w-8 h-8 flex m-auto items-center justify-center rounded cursor-pointer hover:bg-gray-300" onClick={() => {
                                                    setSelectedOrderDetail(order)
                                                    setSheetOpen(true)
                                                }}>
                                                    <Eye className="h-4 w-4" />
                                                    {/* Chi tiết */}
                                                </div>
                                                {/* <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                        ><DropdownMenuItem onClick={() => {
                                                            setSelectedOrderDetail(order)
                                                            setSheetOpen(true)
                                                        }}>
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            Chi tiết
                                                        </DropdownMenuItem>
                                                    <DropdownMenuContent>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-red-600">
                                                            <XCircle className="h-4 w-4 mr-2" />
                                                            Hủy đơn
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu> */}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    {paginatedOrders.length === 0 && (
                        <div className="p-12 text-center text-muted-foreground">
                            <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-30" />
                            <p>Không tìm thấy đơn hàng nào</p>
                        </div>
                    )}

                    {/* Pagination */}
                    <div className="mt-5 px-4">
                        <PaginationControls
                            currentPage={currentPage}
                            totalPages={totalPages}
                            itemsPerPage={itemsPerPage}
                            setCurrentPage={setCurrentPage}
                            setItemsPerPage={setItemsPerPage}
                            totalItems={totalItems}
                        />
                    </div>
                </Card>

                <DetailOrderAdminSheet
                    optimisticallyMarkOrderAsPaid={optimisticallyMarkOrderAsPaid}
                    optimisticallyRevertOrderToUnpaid={optimisticallyRevertOrderToUnpaid}
                    orderCode={selectedOrderDetail?.orderCode}
                    getStatusColor={getStatusColor}
                    sheetOpen={sheetOpen}
                    setSheetOpen={setSheetOpen}
                />

                {/* Status Change Dialog */}
                <AlertDialog open={statusChangeDialog.open} onOpenChange={(open) => setStatusChangeDialog(open ? statusChangeDialog : { open: false })}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Thay đổi trạng thái</AlertDialogTitle>
                            <AlertDialogDescription>
                                Bạn chắc chắn muốn chuyển đơn sang <strong>{statusChangeDialog.newStatus}</strong>?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="flex gap-3">
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction disabled={loadingChangeStatus} onClick={() => {
                                if (statusChangeDialog.orderCode && statusChangeDialog.newStatus) {
                                    handleChangeOrderStatus(statusChangeDialog.orderCode, statusChangeDialog.newStatus)
                                }
                            }}>Xác nhận</AlertDialogAction>
                        </div>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Bulk Action Dialog */}
                <AlertDialog open={bulkActionDialog.open} onOpenChange={(open) => setBulkActionDialog(open ? bulkActionDialog : { open: false, action: "" })}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Xác nhận hành động hàng loạt</AlertDialogTitle>
                            <AlertDialogDescription>
                                Bạn sắp thực hiện hành động trên {selectedOrders.length} đơn hàng. Hành động này không thể hoàn tác.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="flex gap-3">
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <Button disabled={loadingBulkAction} onClick={() => {
                                confirmBulkAction()
                            }}>Tiếp tục</Button>
                        </div>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    )
}
