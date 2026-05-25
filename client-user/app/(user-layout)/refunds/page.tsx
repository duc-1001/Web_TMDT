"use client"

import {
  ArrowLeft,
  Search,
  XCircle,
  Filter,
  Eye
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useSelector } from "react-redux"
import { RootState } from "@/store/store"
import { Card, CardContent } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { getMyRefunds } from "@/services/refund.service"
import { useMemo } from "react"
import { formatDateTime } from "@/lib/utils"

export const StatusBadge = ({ status }: { status: string }) => {
  const config: any = {
    pending: {
      label: "Đang xử lý",
      class: "bg-amber-50 text-amber-700 border border-amber-200",
    },
    completed: {
      label: "Đã hoàn tiền",
      class: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    },
    rejected: {
      label: "Từ chối",
      class: "bg-rose-50 text-rose-700 border border-rose-200",
    },
    cancelled: {
      label: "Đã hủy",
      class: "bg-slate-50 text-slate-500 border border-slate-200",
    },
  }

  const item = config[status] || config.pending

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${item.class}`}
    >
      {item.label}
    </span>
  )
}

export default function RefundHistory() {
  const { isAuthenticated } = useSelector((root: RootState) => root.auth)

  const { data } = useQuery({
    queryKey: ["refund-history"],
    queryFn: () => getMyRefunds(),
    enabled: isAuthenticated,
  })

  const refunds = useMemo(() => {
    if (!data) return []
    return data
  }, [data])

  const formatPrice = (p: number) =>
    new Intl.NumberFormat("vi-VN").format(p) + "₫"

  if (!isAuthenticated) {
    return (
      <div className="py-40 flex items-center justify-center px-4">
        <Card className="w-full max-w-md shadow-sm">
          <CardContent className="p-6 text-center">
            <XCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold mb-2">
              Bạn chưa đăng nhập
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Vui lòng đăng nhập để xem yêu cầu hoàn tiền của bạn
            </p>
            <Button asChild>
              <Link href="/login">Đăng nhập</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">

          <div>
            <Link
              href="/orders"
              className="flex items-center text-sm text-slate-500 gap-2 mb-2 hover:text-slate-900"
            >
              <ArrowLeft size={16} />
              Quay lại đơn hàng
            </Link>

            <h1 className="text-3xl font-bold tracking-tight">
              Lịch sử hoàn tiền
            </h1>

            <p className="text-sm text-slate-500">
              Theo dõi trạng thái các yêu cầu hoàn tiền của bạn
            </p>
          </div>

          {/* SEARCH */}
          <div className="flex items-center gap-3">

            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />

              <input
                type="text"
                placeholder="Tìm mã đơn..."
                className="bg-white border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm w-64 focus:ring-2 focus:ring-slate-200 outline-none"
              />
            </div>

            <Button
              variant="outline"
              className="gap-2 border-slate-200"
            >
              <Filter size={16} /> Lọc
            </Button>

          </div>

        </div>

        {/* TABLE CARD */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead className="bg-slate-50 text-sm text-slate-500">

                <tr>
                  <th className="px-6 py-4">Ngày yêu cầu</th>
                  <th className="px-6 py-4">Mã đơn</th>
                  <th className="px-6 py-4 hidden md:table-cell">
                    Sản phẩm
                  </th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">
                    Tiền hoàn
                  </th>
                  <th className="px-6 py-4"></th>
                </tr>

              </thead>

              <tbody className="divide-y">

                {refunds.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-14 text-slate-500"
                    >
                      Bạn chưa có yêu cầu hoàn tiền nào
                    </td>
                  </tr>
                )}

                {refunds.map((item: any) => (

                  <tr
                    key={item._id}
                    className="hover:bg-slate-50 transition"
                  >

                    <td className="px-6 py-5 text-sm text-slate-500">
                      {formatDateTime(item.createdAt)}
                    </td>

                    <td className="px-6 py-5">

                      <div className="font-semibold">
                        {item.orderCode}
                      </div>

                      <div className="text-xs text-slate-400 font-mono">
                        {item.refundCode}
                      </div>

                    </td>

                    <td className="px-6 py-5 hidden md:table-cell max-w-xs">

                      <p className="text-sm font-medium truncate">
                        {item.items
                          ?.map((i: any) => i.name)
                          .join(", ")}
                      </p>

                      <p className="text-xs text-slate-400 italic truncate">
                        {item.reason}
                      </p>

                    </td>

                    <td className="px-6 py-5">
                      <StatusBadge status={item.status} />
                    </td>

                    <td className="px-6 py-5 text-right font-semibold">

                      {formatPrice(item.totalRefund)}

                    </td>

                    <td className="px-6 py-5 text-right">

                      <Link
                        href={`/refunds/${item.refundCode}?token=${item.viewToken}`}
                        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Eye size={16} />
                        Chi tiết
                      </Link>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

      </div>

    </div>
  )
}