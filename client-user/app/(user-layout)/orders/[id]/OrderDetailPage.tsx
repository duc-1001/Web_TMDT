"use client"
import { use, useEffect, useState } from "react"
import { ArrowLeft, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { checkCanRefundOrder, getOrderShippingInfo } from "@/services/order.service"
import VerifyOrder from "@/components/order/verify-order"
import DetailOrderTab from "@/components/order/detail-order-tab"
import RefundSectionTab from "@/components/order/refund-section-tab"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { queryClient } from "@/components/QueryClientProviders"

export default function OrderDetailPage({ orderCode }: { orderCode: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [token, setToken] = useState<string | null>(null)
  const initialTab = searchParams.get("tab") === "refund" ? "refund" : "detail"

  useEffect(() => {
    const viewToken = searchParams.get("token")
    if (viewToken) {
      setCodeError(null)
      setToken(viewToken)
    }
  }, [searchParams])

  const [activeTab, setActiveTab] = useState(initialTab)
  const [codeError, setCodeError] = useState<string | null>(null)

  // Cập nhật tab khi URL thay đổi
  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  const handleChangeTab = (tab: string) => {
    setActiveTab(tab)
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", tab)
    router.replace(`${pathname}?${params.toString()}`)
  }

  // Query lấy chi tiết đơn hàng
  const { data, isLoading, refetch, error } = useQuery({
    queryKey: ["order-detail", orderCode, token],
    queryFn: () => getOrderShippingInfo(orderCode, token!),
    enabled: !!orderCode && !!token,
    retry: (failureCount, err: any) => {
      if (err?.status === 401 || err?.status === 400) return false
      return failureCount < 2
    }
  })

  // Query kiểm tra có thể hoàn tiền không
  const { data: canRefundData, error: canRefundError } = useQuery({
    queryKey: ["can-create-refund", orderCode, token],
    queryFn: () => checkCanRefundOrder(orderCode, token!),
    enabled: !!orderCode && !!token,
    retry: (failureCount, err: any) => {
      const code = err?.code
      const businessErrors = [
        "REFUND_WINDOW_EXPIRED", "REFUND_PENDING", "NOTHING_TO_REFUND",
        "ORDER_NOT_DELIVERED", "ORDER_NOT_FOUND", "ORDER_ACCESS_DENIED"
      ]
      if (businessErrors.includes(code) || err?.status === 401 || err?.status === 400) return false
      return failureCount < 2
    }
  })

  const handleRefundSuccess = () => {
    queryClient.setQueryData(
      ["order-detail", orderCode, token],
      (oldData: any) => oldData ? { ...oldData, refundStatus: "pending" } : oldData
    )
  }

  // Xử lý error code
  useEffect(() => {
    const err = error || canRefundError
    if (err && typeof err === "object") {
      const code = (err as any)?.code || (err as any)?.response?.data?.code
      if (code && code !== codeError) {
        setCodeError(code)
      }
    }
  }, [error, canRefundError, codeError])

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        Đang tải thông tin đơn hàng...
      </div>
    )
  }

  // Order không tồn tại
  if (codeError === "ORDER_NOT_FOUND") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <XCircle className="mx-auto mb-4 text-red-500" size={48} />
          <h2 className="text-2xl font-semibold">Đơn hàng không tồn tại</h2>
          <p className="text-muted-foreground mt-2">
            Đơn hàng bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
          </p>
          <Button variant="outline" className="mt-6" asChild>
            <Link href="/orders">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại danh sách đơn hàng
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  // Token verify
  if (
    codeError === "VIEW_TOKEN_REQUIRED" ||
    codeError === "VIEW_TOKEN_INVALID" ||
    codeError === "VIEW_TOKEN_EXPIRED"
  ) {
    return (
      <div className="-translate-y-20">
        <VerifyOrder setToken={setToken} code={orderCode} />
      </div>
    )
  }

  // Không có quyền truy cập
  if (codeError === "ORDER_ACCESS_DENIED") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <XCircle className="mx-auto mb-4 text-red-500" size={48} />
          <h2 className="text-2xl font-semibold">Không có quyền truy cập</h2>
          <p className="text-muted-foreground mt-2">
            Đơn hàng này thuộc về người dùng khác hoặc bạn không có quyền xem.
          </p>
          <Button variant="outline" className="mt-6" asChild>
            <Link href="/orders">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại danh sách đơn hàng
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  // THÊM: Trường hợp data bị undefined/null (nguyên nhân chính gây lỗi _id)
  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <XCircle className="mx-auto mb-4 text-red-500" size={48} />
          <h2 className="text-2xl font-semibold">Không lấy được dữ liệu</h2>
          <p className="text-muted-foreground mt-2">
            Không thể tải thông tin đơn hàng. Vui lòng thử lại.
          </p>
          <Button onClick={() => refetch()} className="mt-6">
            Thử tải lại
          </Button>
        </div>
      </div>
    )
  }

  // Render chính
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <Button variant="ghost" className="mb-6" asChild>
          <Link href="/orders">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại danh sách đơn hàng
          </Link>
        </Button>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleChangeTab}>
          <TabsList className="w-full sticky top-0 z-10">
            <TabsTrigger value="detail">Chi tiết đơn</TabsTrigger>
            <TabsTrigger value="refund">Hoàn tiền</TabsTrigger>
          </TabsList>

          <TabsContent value="detail">
            <DetailOrderTab
              data={data}
              refetch={refetch}
              setActiveTab={setActiveTab}
            />
          </TabsContent>

          <TabsContent value="refund">
            <RefundSectionTab
              codeError={codeError}
              order={data}
              canCreateRefund={canRefundData?.canRefund || false}
              tab={activeTab}
              handleRefundSuccess={handleRefundSuccess}
              setCodeError={setCodeError}
              token={token!}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}