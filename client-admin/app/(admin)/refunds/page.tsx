"use client"

import { useState, useMemo, useEffect, use } from "react"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Eye, MoreVertical } from "lucide-react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { adminGetRefunds, adminUpdateRefundStatus } from "@/services/refund.service"
import useDebounce from "@/hooks/use-debounce"
import { useRouter } from "next/navigation"
import { ReasonCode, RefundAdminListItem, RefundStatus } from "@/types/refund"
import { formatTimeAgo } from "@/lib/time"
import DetailAdminRefundSheet from "@/components/refund/detail-admin-refund-sheet"
import { toast } from "sonner"
import PaginationControls from "@/components/layout/pagination-controls-admin"

export const REFUND_REASONS = [
    { code: "DEFECTIVE", label: "Sản phẩm bị lỗi" },
    { code: "WRONG_ITEM", label: "Giao sai sản phẩm" },
    { code: "MISSING_ITEM", label: "Thiếu hàng" },
    { code: "NOT_AS_DESCRIBED", label: "Không đúng mô tả" },
    { code: "CHANGED_MIND", label: "Thay đổi quyết định" },
    { code: "OTHER", label: "Khác" },
] as const

export const statusLabels: Record<RefundStatus, string> = {
  pending: "Chờ xử lý",
  processing: "Đang xử lý",
  completed: "Hoàn tất",
  rejected: "Từ chối",
  cancelled: "Đã hủy",
}

export const statusColors: Record<RefundStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
}

export default function RefundsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [errorCode, setErrorCode] = useState<any>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<RefundStatus | "all">("all")
  const [reasonFilter, setReasonFilter] = useState<ReasonCode | "all">("all")
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const q = useDebounce(search, 500)

  const { data, error, isLoading } = useQuery({
    queryKey: ["adminRefunds", q, statusFilter, reasonFilter, page, itemsPerPage],
    queryFn: () => adminGetRefunds(q, statusFilter, reasonFilter, page, itemsPerPage),
  })

  useEffect(() => {
    if (error) {
      const errCode = (error as any)?.code
      setErrorCode(errCode)
    }
  }, [error, router])

  useEffect(() => {
    if (errorCode === "UNAUTHORIZED" || errorCode === "PERMISSION_DENIED") {
      router.push("/login")
    }
  }, [errorCode])

  const totalPages = data?.pagination.totalPages ?? 1
  const totalItems = data?.pagination.total ?? 0
  const refunds = data?.data ?? []

  const [selected, setSelected] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  // Dialog xác nhận chung (process, complete)
  const [confirmAction, setConfirmAction] = useState<{
    type: "process" | "complete"
    refundId: string
  } | null>(null)

  // Dialog từ chối + nhập lý do
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectRefundId, setRejectRefundId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  const formatVND = (num: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num)

  // Stats
  const stats = useMemo(() => {
    if (!data) return { total: 0, pending: 0, completed: 0, totalAmount: 0 }
    const total = data.pagination.total
    const pending = data.data.filter((r) => r.status === "pending").length
    const completed = data.data.filter((r) => r.status === "completed").length
    const totalAmount = data.data.reduce((sum, r) => sum + r.totalRefund, 0)
    return { total, pending, completed, totalAmount }
  }, [data])

  // ── Hàm cập nhật trạng thái chung ───────────────────────────────────────
  const updateRefundStatus = async (
    refundId: string,
    newStatus: RefundStatus,
    reason?: string
  ) => {
    setIsSubmitting(true)
    try {
      const response = await adminUpdateRefundStatus(refundId, newStatus, reason)

      if (response.data) {
        if(newStatus === "rejected") {
          toast.success("Yêu cầu hoàn tiền đã được từ chối")
        }
        else if(newStatus === "processing") {
          toast.success("Yêu cầu hoàn tiền đang được xử lý")
        }
        else if(newStatus === "completed") {
          toast.success("Yêu cầu hoàn tiền đã được hoàn tất")
        }
        // Làm mới danh sách
        queryClient.invalidateQueries({ queryKey: ["adminRefunds", q, statusFilter, reasonFilter, page, itemsPerPage] })
        queryClient.invalidateQueries({ queryKey: ["refundDetails", refundId] })
      }
    } catch (err: any) {
      setErrorCode(err.code)
      toast.error(err.message || "Không thể cập nhật trạng thái hoàn tiền")
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Xử lý các hành động ─────────────────────────────────────────────────
  const handleProcess = (refundId: string) => {
    updateRefundStatus(refundId, "processing")
    setConfirmAction(null)
  }

  const handleComplete = (refundId: string) => {
    updateRefundStatus(refundId, "completed")
    setConfirmAction(null)
  }

  const handleReject = () => {
    if (!rejectRefundId || !rejectReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối")
      return
    }

    updateRefundStatus(rejectRefundId, "rejected", rejectReason.trim())
    setRejectDialogOpen(false)
    setRejectReason("")
    setRejectRefundId(null)
  }

  const openRejectDialog = (id: string) => {
    setRejectRefundId(id)
    setRejectReason("")
    setRejectDialogOpen(true)
  }

  const openProcessConfirm = (id: string) => {
    setConfirmAction({ type: "process", refundId: id })
  }

  const openCompleteConfirm = (id: string) => {
    setConfirmAction({ type: "complete", refundId: id })
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Quản lý hoàn tiền</h1>
          <p className="mt-1 text-muted-foreground">
            Theo dõi và xử lý các yêu cầu hoàn tiền từ khách hàng
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Tổng yêu cầu" value={stats.total} />
          <StatCard title="Chờ xử lý" value={stats.pending} color="text-yellow-600" />
          <StatCard title="Hoàn tất" value={stats.completed} color="text-green-600" />
          <StatCard title="Tổng tiền" value={formatVND(stats.totalAmount)} color="text-orange-500" />
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <Input
                placeholder="Tìm mã hoàn tiền, đơn hàng, tên, số điện thoại..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="md:max-w-sm"
              />
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v as RefundStatus | "all")
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="pending">Chờ xử lý</SelectItem>
                  <SelectItem value="processing">Đang xử lý</SelectItem>
                  <SelectItem value="completed">Hoàn tất</SelectItem>
                  <SelectItem value="rejected">Từ chối</SelectItem>
                  <SelectItem value="cancelled">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={reasonFilter}
                onValueChange={(v) => {
                  setReasonFilter(v as ReasonCode | "all")
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Lý do" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả lý do</SelectItem>
                  {REFUND_REASONS.map((r) => (
                    <SelectItem key={r.code} value={r.code}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Mã HT</th>
                  <th className="px-4 py-3 text-left font-medium">Đơn hàng</th>
                  <th className="px-4 py-3 text-left font-medium">Khách hàng</th>
                  <th className="px-4 py-3 text-left font-medium">Lý do</th>
                  <th className="px-4 py-3 text-right font-medium">Số tiền</th>
                  <th className="px-4 py-3 text-left font-medium">Trạng thái</th>
                  <th className="px-4 py-3 text-left font-medium">Ngày tạo</th>
                  <th className="px-4 py-3 text-center font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {refunds.map((refund) => (
                  <tr key={refund._id} className="border-b hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3 font-medium">{refund.refundCode}</td>
                    <td className="px-4 py-3">{refund.orderCode}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{refund.customer?.fullName || "—"}</div>
                      <div className="text-xs text-muted-foreground">{refund.customer?.phone || "—"}</div>
                    </td>
                    <td className="px-4 py-3">{refund.reason}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {formatVND(refund.totalRefund)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={statusColors[refund.status]}>
                        {statusLabels[refund.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatTimeAgo(refund.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelected(refund._id)
                              setSheetOpen(true)
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Xem chi tiết
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />

                          {refund.status === "pending" && (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  openProcessConfirm(refund._id)
                                }
                              >
                                Bắt đầu xử lý
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => {
                                  openRejectDialog(refund._id)
                                }}
                              >
                                Từ chối
                              </DropdownMenuItem>
                            </>
                          )}

                          {refund.status === "processing" && (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  openCompleteConfirm(refund._id)
                                }
                              >
                                Hoàn tất hoàn tiền
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => {
                                  openRejectDialog(refund._id)
                                }}
                              >
                                Từ chối
                              </DropdownMenuItem>
                            </>
                          )}

                          {(refund.status === "completed" || refund.status === "rejected") && (
                            <DropdownMenuItem disabled>
                              Đã {refund.status === "completed" ? "hoàn tất" : "từ chối"}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination (bạn có thể thêm component Pagination ở đây) */}
          {/* Ví dụ: <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} /> */}
        </Card>

        {
          totalItems > 10 && (
            <div className="mt-3">
              <PaginationControls
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalItems}
                setCurrentPage={setPage}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
              />
            </div>
          )
        }
        {/* Sheet chi tiết */}
        <DetailAdminRefundSheet
          refundId={selected}
          sheetOpen={sheetOpen}
          setSheetOpen={setSheetOpen}
          openRejectDialog={openRejectDialog}
          openProcessConfirm={openProcessConfirm}
          openCompleteConfirm={openCompleteConfirm}
        />

        {/* Dialog xác nhận process / complete */}
        <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirmAction?.type === "process" && "Xác nhận bắt đầu xử lý?"}
                {confirmAction?.type === "complete" && "Xác nhận hoàn tất hoàn tiền?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                Hành động này sẽ thay đổi trạng thái yêu cầu hoàn tiền.
                {confirmAction?.type === "complete" &&
                  " Số tiền sẽ được hoàn theo phương thức đã chọn."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction
                disabled={isSubmitting}
                onClick={() => {
                  if (!confirmAction) return
                  const { type, refundId } = confirmAction
                  if (type === "process") handleProcess(refundId)
                  if (type === "complete") handleComplete(refundId)
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white hover:text-white"
              >
                {confirmAction?.type === "process" ? "Xử lý" : "Hoàn tất"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog từ chối + nhập lý do */}
        <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Từ chối yêu cầu hoàn tiền</AlertDialogTitle>
              <AlertDialogDescription>
                Vui lòng nhập lý do từ chối. Lý do này sẽ được gửi đến khách hàng qua email hoặc thông báo.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="py-4">
              <label htmlFor="reject-reason" className="mb-2 block text-sm font-medium">
                Lý do từ chối <span className="text-red-600">*</span>
              </label>
              <Input
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ví dụ: Sản phẩm đã sử dụng, không đủ điều kiện hoàn trả..."
                className="mt-1"
              />
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction
                disabled={!rejectReason.trim()}
                className="bg-red-600 hover:bg-red-700"
                onClick={handleReject}
              >
                Xác nhận từ chối
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  color = "text-foreground",
}: {
  title: string
  value: string | number
  color?: string
}) {
  return (
    <Card className="shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="p-6">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className={`mt-2 text-2xl font-bold ${color}`}>
          {typeof value === "number" ? value.toLocaleString("vi-VN") : value}
        </p>
      </CardContent>
    </Card>
  )
}