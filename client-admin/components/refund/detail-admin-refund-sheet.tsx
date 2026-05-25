"use client"

import React from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Separator } from "../ui/separator"
import {
  Calendar,
  Mail,
  Package,
  Phone,
  User,
  CreditCard,
} from "lucide-react"
import { formatDateTime, formatPrice } from "@/lib/utils"
import { useQuery } from "@tanstack/react-query"
import { adminGetRefundDetails } from "@/services/refund.service"
import { statusColors, statusLabels } from "@/app/(admin)/refunds/page"

interface DetailAdminRefundSheetProps {
  sheetOpen: boolean
  setSheetOpen: React.Dispatch<React.SetStateAction<boolean>>
  refundId: string | null
  openRejectDialog: (id: string) => void
  openProcessConfirm: (id: string) => void
  openCompleteConfirm: (id: string) => void
}

const refundMethodLabels: Record<string, string> = {
  original: "Hoàn về phương thức ban đầu",
  bank: "Chuyển khoản ngân hàng",
}

const DetailAdminRefundSheet = ({
  sheetOpen,
  setSheetOpen,
  refundId,
  openProcessConfirm,
  openCompleteConfirm,
  openRejectDialog
}: DetailAdminRefundSheetProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ["refundDetails", refundId],
    queryFn: () => adminGetRefundDetails(refundId!),
    enabled: !!refundId && sheetOpen,
  })

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetContent className="w-full px-4 py-3 sm:max-w-2xl lg:max-w-3xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl">
            {data?.refundCode ?? "Chi tiết hoàn tiền"}
          </SheetTitle>
          <SheetDescription>
            Chi tiết yêu cầu hoàn tiền
          </SheetDescription>
        </SheetHeader>

        {isLoading && (
          <div className="py-10 text-center text-muted-foreground">
            Đang tải dữ liệu...
          </div>
        )}

        {data && (
          <div className="space-y-8">

            {/* STATUS */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Badge className={`${statusColors[data.status]} px-3 py-1`}>
                {statusLabels[data.status]}
              </Badge>

              <div className="flex gap-2">
                {data.status === "pending" && (
                  <>
                    <Button
                      variant="outline"
                      className="border-red-200 hover:text-red-500 text-red-600 hover:bg-red-50"
                      onClick={() =>
                        openRejectDialog(data._id)
                      }
                    >
                      Từ chối
                    </Button>

                    <Button
                      className="bg-blue-600 hover:bg-blue-700 text-white hover:text-white"
                      onClick={() =>
                        openProcessConfirm(data._id)
                      }
                    >
                      Bắt đầu xử lý
                    </Button>
                  </>
                )}

                {data.status === "processing" && (
                  <>
                    <Button
                      variant="outline"
                      className="border-red-200 hover:text-red-500 text-red-600 hover:bg-red-50"
                      onClick={() =>
                        openRejectDialog(data._id)
                      }
                    >
                      Từ chối
                    </Button>

                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white hover:text-white"
                      onClick={() =>
                        openCompleteConfirm(data._id)
                      }
                    >
                      Hoàn tất
                    </Button>
                  </>
                )}
              </div>
            </div>

            <Separator />

            {/* BASIC INFO */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="rounded-lg bg-muted/30 p-4">
                <p className="mb-1 text-xs text-muted-foreground">
                  Mã đơn hàng
                </p>
                <p className="font-semibold">{data.orderCode}</p>
              </div>

              <div className="rounded-lg bg-muted/30 p-4">
                <p className="mb-1 text-xs text-muted-foreground">
                  Lý do
                </p>
                <p className="font-semibold">{data.reason}</p>
              </div>
            </div>

            {/* CUSTOMER */}
            {data.customer && (
              <div>
                <p className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <User className="h-4 w-4" />
                  Khách hàng
                </p>

                <div className="space-y-2 rounded-lg bg-muted/30 p-4 text-sm">
                  {data.customer.fullName && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {data.customer.fullName}
                    </div>
                  )}

                  {data.customer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {data.customer.phone}
                    </div>
                  )}

                  {data.customer.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {data.customer.email}
                    </div>
                  )}
                </div>
              </div>
            )}

            <Separator />

            {/* ITEMS */}
            <div>
              <p className="mb-3 flex items-center gap-2 text-sm font-medium">
                <Package className="h-4 w-4" />
                Sản phẩm hoàn
              </p>

              <div className="space-y-3">
                {data.items?.map((item: any) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between rounded-lg border bg-muted/20 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image?.url}
                        alt={item.name}
                        className="h-12 w-12 rounded-md border object-cover"
                      />

                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          ×{item.quantity}
                        </p>
                      </div>
                    </div>

                    <p className="font-semibold">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* REFUND SUMMARY */}
            <div className="rounded-xl border bg-gradient-to-br from-orange-50 to-orange-100 p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Số tiền hoàn
                </span>

                <span className="text-3xl font-bold text-orange-600">
                  {formatPrice(
                    data.refundAmountData?.totalRefund ?? 0
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Phương thức hoàn
                </span>

                <Badge variant="secondary">
                  {refundMethodLabels[data.refundDestination]}
                </Badge>
              </div>
            </div>

            {/* REFUND DESTINATION */}
            <div>
              <p className="mb-3 flex items-center gap-2 text-sm font-medium">
                <CreditCard className="h-4 w-4" />
                Thông tin hoàn tiền
              </p>

              {data.refundDestination === "bank" && data.refundBankInfo && (
                <div className="space-y-2 rounded-lg border bg-muted/20 p-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Ngân hàng
                    </span>
                    <span className="font-medium">
                      {data?.refundBankInfo.bankName}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Chủ tài khoản
                    </span>
                    <span className="font-medium">
                      {data?.refundBankInfo.accountHolder}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Số tài khoản
                    </span>
                    <span className="font-medium">
                      {data?.refundBankInfo.accountNumber}
                    </span>
                  </div>
                </div>
              )}

              {data.refundDestination === "original" && (
                <div className="flex justify-between rounded-lg border bg-muted/20 p-4 text-sm">
                  <span className="text-muted-foreground">
                    Hoàn về phương thức thanh toán ban đầu
                  </span>

                  <Badge variant="outline">
                    {data.paymentMethod ?? "Online Payment"}
                  </Badge>
                </div>
              )}
            </div>

            {/* NOTE */}
            {data.note && (
              <>
                <Separator />

                <div>
                  <p className="mb-2 text-sm font-medium">Ghi chú</p>

                  <div className="rounded-lg border bg-muted/20 p-3 text-sm">
                    {data.note}
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* TIMELINE */}
            <div>
              <p className="mb-3 flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4" />
                Lịch sử
              </p>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between rounded-lg border bg-muted/20 p-3">
                  <span>Tạo yêu cầu</span>
                  <span className="text-muted-foreground">
                    {formatDateTime(data.createdAt)}
                  </span>
                </div>

                {data.updatedAt && (
                  <div className="flex justify-between rounded-lg border bg-muted/20 p-3">
                    <span>Cập nhật trạng thái</span>
                    <span className="text-muted-foreground">
                      {formatDateTime(data.updatedAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default DetailAdminRefundSheet