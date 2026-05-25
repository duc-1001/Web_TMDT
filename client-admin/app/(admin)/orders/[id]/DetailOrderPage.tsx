"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Package, MapPin, CreditCard, User, Phone, Mail, Truck, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { getOrderDetailsAdmin, markOrderAsPaid, revertOrderToUnpaid, updateOrderStatus } from "@/services/order.service"
import { formatTimeAgo } from "@/lib/time"
import { OrderStatus, TimelineItem } from "@/types/order"


// Hàm format giá (giữ nguyên)
const formatPrice = (price: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price)
}

// Hàm lấy màu trạng thái (mở rộng thêm nếu cần)
const getStatusColor = (status: string) => {
  const colors = {
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
    processing: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
    shipping: "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
    completed: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
  }
  return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-700"
}

const getPaymentStatusColor = (status: string) => {
  return status === "paid"
    ? "bg-green-100 text-green-700"
    : "bg-red-100 text-red-700"
}

interface OrderDetailPageProps {
  orderCode: string
}

export default function OrderDetailPage({ orderCode }: OrderDetailPageProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  // Fetch chi tiết đơn hàng
  const {
    data: order,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["orderDetail", orderCode],
    queryFn: () => getOrderDetailsAdmin(orderCode),
    enabled: !!orderCode,
    retry: false,
  })

  useEffect(() => {
    if (isError || (!isLoading && order === null)) {
      toast.error("Không tìm thấy đơn hàng", {
        description: "Đang chuyển về danh sách đơn hàng...",
      })
      router.replace("/orders")
    }
  }, [isError, isLoading, order])

  // Mutation thay đổi trạng thái đơn hàng
  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: OrderStatus) => updateOrderStatus(orderCode, newStatus),
    onMutate: async (newStatus) => {
      await queryClient.cancelQueries({ queryKey: ["orderDetail", orderCode] })
      const previousOrder = queryClient.getQueryData(["orderDetail", orderCode])
      queryClient.setQueryData(["orderDetail", orderCode], (old: any) => ({
        ...old,
        status: newStatus,
      }))
      return { previousOrder }
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(["orderDetail", orderCode], context?.previousOrder)
      toast.error("Cập nhật trạng thái thất bại")
    },
    onSuccess: () => {
      toast.success("Cập nhật trạng thái thành công")
      queryClient.invalidateQueries({ queryKey: ["order-summary"] }) // nếu có list
    },
  })

  // Mutation đánh dấu đã thanh toán
  const markPaidMutation = useMutation({
    mutationFn: () => markOrderAsPaid(orderCode),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["orderDetail", orderCode] })
      const previous = queryClient.getQueryData(["orderDetail", orderCode])
      queryClient.setQueryData(["orderDetail", orderCode], (old: any) => ({
        ...old,
        payment: { ...old?.payment, status: "paid" },
      }))
      return { previous }
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(["orderDetail", orderCode], context?.previous)
      toast.error("Đánh dấu thanh toán thất bại")
    },
    onSuccess: () => {
      toast.success("Đã đánh dấu thanh toán")
      queryClient.invalidateQueries({ queryKey: ["orderDetail", orderCode] })
      queryClient.invalidateQueries({ queryKey: ["order-summary"] })
    },
  })

  // Mutation hoàn tác thanh toán
  const revertPaidMutation = useMutation({
    mutationFn: () => revertOrderToUnpaid(orderCode),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["orderDetail", orderCode] })
      const previous = queryClient.getQueryData(["orderDetail", orderCode])
      queryClient.setQueryData(["orderDetail", orderCode], (old: any) => ({
        ...old,
        payment: { ...old?.payment, status: "pending" },
      }))
      return { previous }
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(["orderDetail", orderCode], context?.previous)
      toast.error("Hoàn tác thanh toán thất bại")
    },
    onSuccess: () => {
      toast.success("Đã hoàn tác thanh toán")
      queryClient.invalidateQueries({ queryKey: ["orderDetail", orderCode] })
      queryClient.invalidateQueries({ queryKey: ["order-summary"] })
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-8 w-64 rounded bg-muted animate-pulse" />
            <div className="h-4 w-32 rounded bg-muted animate-pulse" />
          </div>
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-64 rounded-lg bg-muted animate-pulse" />
            <div className="h-48 rounded-lg bg-muted animate-pulse" />
          </div>
          <div className="space-y-4">
            <div className="h-40 rounded-lg bg-muted animate-pulse" />
            <div className="h-40 rounded-lg bg-muted animate-pulse" />
            <div className="h-40 rounded-lg bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !order) return null

  const subtotal = order.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)
  const total = subtotal + order.shippingFee

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/orders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-1">Chi tiết đơn hàng {order.orderCode}</h1>
          <p className="text-sm text-muted-foreground">{formatTimeAgo(order.createdAt)}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Sản phẩm */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-orange-500" />
                Sản phẩm đã đặt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-20 h-20 border rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={item.image?.url || "/placeholder.svg?height=80&width=80"}
                        alt={item.name}
                        className="m-auto h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium mb-1 line-clamp-2">{item.name}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {formatPrice(item.price)} x {item.quantity}
                      </p>
                      <p className="font-semibold text-orange-500">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="space-y-2 text-sm">
                {subtotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tạm tính</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                )}

                {order.discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Giảm giá</span>
                    <span className="font-medium text-red-600">- {formatPrice(order.discountAmount)}</span>
                  </div>
                )}

                {order.shippingFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phí vận chuyển</span>
                    <span className="font-medium">{formatPrice(order.shippingFee)}</span>
                  </div>
                )}

                {order.shippingDiscount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Giảm giá vận chuyển</span>
                    <span className="font-medium text-red-600">- {formatPrice(order.shippingDiscount)}</span>
                  </div>
                )}
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between text-lg font-bold">
                <span>Tổng cộng</span>
                <span className="text-orange-500">{formatPrice(order.totalAmount)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-orange-500" />
                Trạng thái đơn hàng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.timeline.map((item: TimelineItem, index: number) => (
                  <div key={index} className="flex gap-4">
                    {/* Cột số / icon */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 
                       ${item.time ? "bg-orange-600 text-white" : "bg-muted text-muted-foreground"}`}
                      >
                        {item.time ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
                      </div>
                      {/* Line nối các step */}
                      {index < order.timeline.length - 1 && (
                        <div className={`w-0.5 h-12 ${item.time ? "bg-orange-600" : "bg-muted"}`} />
                      )}
                    </div>

                    {/* Nội dung timeline */}
                    <div className="flex-1 pb-8">
                      <p className={`font-medium ${item.time ? "" : "text-muted-foreground"}`}>
                        {item.event}
                      </p>
                      {item.time && (
                        <p className="text-sm text-muted-foreground mt-1">{formatTimeAgo(item.time)}</p>
                      )}
                      {/* Tùy chọn hiển thị from → to nếu muốn */}
                      {item.from && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.from} → {item.to}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar info */}
        <div className="space-y-6">
          {/* Khách hàng */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-orange-500" />
                Thông tin khách hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-600/10 flex items-center justify-center font-semibold">
                  {order.customer.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{order.customer.name}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{order.customer.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="break-all">{order.customer.email}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Địa chỉ */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-orange-500" />
                Địa chỉ giao hàng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{order.shippingAddress.address + ", " + order.shippingAddress.ward?.name + ", " + order.shippingAddress.province?.name}</p>
              {order.note && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-sm font-medium mb-1">Ghi chú</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{order.note}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Thanh toán */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-orange-500" />
                Thanh toán
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Phương thức</span>
                <span className="font-medium">{order.payment.method}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-muted-foreground">Trạng thái</span>
                <Badge className={getPaymentStatusColor(order.payment.status)}>
                  {order.payment.status === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tổng tiền</span>
                <span className="font-bold text-orange-500">{formatPrice(total)}</span>
              </div>

              <div className="pt-4 space-y-3">
                {order.payment.status === "unpaid" && (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={markPaidMutation.isPending}
                    onClick={() => markPaidMutation.mutate()}
                  >
                    {markPaidMutation.isPending ? "Đang xử lý..." : "Đánh dấu đã thanh toán"}
                  </Button>
                )}
                {order.payment.status === "paid" && (
                  <Button
                    variant="outline"
                    className="w-full border-red-600 text-red-600 hover:bg-red-50"
                    disabled={revertPaidMutation.isPending}
                    onClick={() => revertPaidMutation.mutate()}
                  >
                    {revertPaidMutation.isPending ? "Đang xử lý..." : "Hoàn tác thanh toán"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {order.status === "pending" && (
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => updateStatusMutation.mutate("confirmed")}
              >
                Xác nhận đơn
              </Button>
            )}

            {order.status === "confirmed" && (
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => updateStatusMutation.mutate("shipping")}
              >
                Chuyển sang giao hàng
              </Button>
            )}

            {order.status === "shipping" && (
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => updateStatusMutation.mutate("delivered")}
              >
                Xác nhận đã giao hàng
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}