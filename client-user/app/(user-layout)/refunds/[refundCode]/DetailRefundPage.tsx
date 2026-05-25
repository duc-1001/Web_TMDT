'use client'
import { formatPrice } from '@/lib/utils'
import { cancelRefund, getRefundDetails } from '@/services/refund.service'
import { RefundUserDetail } from '@/types/refund'
import { useMutation, useQuery } from '@tanstack/react-query'
import { AlertCircle, ArrowLeft, Banknote, Clock, Package, Receipt, XCircle } from 'lucide-react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { StatusBadge } from '../page'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import VerifyOrder from '@/components/order/verify-order'
import { toast } from 'sonner'
import { queryClient } from '@/components/QueryClientProviders'

interface RefundDetailPageProps {
    refundCode: string
}

const DetailRefundPage = ({ refundCode }: RefundDetailPageProps) => {
    const searchParams = useSearchParams()
    const viewToken = searchParams.get("token") || ""
    const [codeError, setCodeError] = useState<string | null>(null)
    const { data, isLoading, error } = useQuery({
        queryKey: ["refundDetail", refundCode, viewToken],
        queryFn: () => getRefundDetails(refundCode, viewToken),
        enabled: !!refundCode,
        staleTime: Infinity
    })

    const refund = data as RefundUserDetail | undefined

    const handleCancelRefund = useMutation({
        mutationFn: () => cancelRefund(refundCode, viewToken),
        onSuccess: () => {
            setCodeError(null)
            toast.success("Yêu cầu hoàn tiền đã được hủy thành công.")
            queryClient.setQueryData(["refundDetail", refundCode, viewToken], (oldData: any) => {
                if (!oldData) return oldData
                return {
                    ...oldData,
                    status: "cancelled",
                }
            })
        },
        onError: (err: any) => {
            const message = err.message || "Không thể hủy yêu cầu hoàn tiền."
            setCodeError(err.code || "UNKNOWN_ERROR")
            toast.error(message)
        }
    })

    useEffect(() => {
        if (error && typeof error === "object") {
            const code = (error as any)?.code
            if (code !== codeError) {
                setCodeError(code)
            }
        }
        else {
            setCodeError(null)
        }
    }, [error, codeError, setCodeError])

    if (isLoading) {
        return <div className="min-h-screen bg-background">Loading...</div>
    }

    if (
        codeError === "VIEW_TOKEN_REQUIRED" ||
        codeError === "VIEW_TOKEN_INVALID" ||
        codeError === "VIEW_TOKEN_EXPIRED"
    ) {
        return (
            <div className="-translate-y-20">
                <VerifyOrder code={refundCode} type={"refund"} />
            </div>
        )
    }

    if (codeError === "REFUND_NOT_FOUND" || !refund) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <XCircle className="mx-auto mb-4 text-red-500" size={48} />
                    <h2 className="text-2xl font-semibold">
                        Yêu cầu hoàn tiền không tồn tại
                    </h2>
                    <p className="text-muted-foreground mt-2">
                        Yêu cầu hoàn tiền bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
                    </p>
                    <Button variant="outline" className="mt-6" asChild>
                        <Link href="/refunds">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Quay lại danh sách yêu cầu
                        </Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">

            {/* HEADER */}
            <div className="bg-white border rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-start flex-wrap gap-3">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Yêu cầu hoàn tiền #{refund.orderCode}
                        </h2>

                        <p className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                            <Clock size={14} />
                            {new Date(refund.createdAt).toLocaleString("vi-VN")}
                        </p>
                    </div>

                    <span className="flex items-center gap-2">
                        <StatusBadge status={refund.status || "pending"} />
                    </span>
                </div>
            </div>

            {/* BODY */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">

                {/* LEFT COLUMN */}
                <div className="space-y-6">

                    {/* REASON */}
                    <div className="bg-white border rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-3">
                            <AlertCircle size={18} />
                            <h3 className="font-semibold">Lý do hoàn tiền</h3>
                        </div>

                        <p className="text-gray-700">{refund.reason}</p>

                        {refund.note && (
                            <div className="mt-4 bg-gray-50 p-4 rounded-lg border">
                                <p className="text-sm text-gray-500">Ghi chú</p>
                                <p>{refund.note}</p>
                            </div>
                        )}
                    </div>

                    {/* PRODUCTS */}
                    <div className="bg-white border rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Package size={18} />
                            <h3 className="font-semibold">Sản phẩm yêu cầu hoàn</h3>
                        </div>

                        <div className="space-y-4">
                            {refund.items.map((item) => (
                                <div
                                    key={item.productId}
                                    className="flex gap-4 px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
                                >
                                    <Image
                                        src={item.image?.url || "/placeholder.png"}
                                        alt={item.name}
                                        width={80}
                                        height={80}
                                        className="rounded-md object-cover"
                                    />

                                    <div className="flex-1">
                                        <p className="font-medium line-clamp-2">{item.name}</p>
                                        <p className="text-sm text-gray-500">
                                            SL hoàn: {item.quantity}
                                        </p>
                                    </div>

                                    <div className="font-semibold">
                                        {formatPrice(item.price)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* IMAGES */}
                    {refund.images?.length > 0 && (
                        <div className="bg-white border rounded-xl p-6">
                            <h3 className="font-semibold mb-4">Ảnh minh chứng</h3>

                            <div className="grid grid-cols-4 gap-3">
                                {refund.images.map((img) => (
                                    <div
                                        key={img.imagePublicId}
                                        className="relative aspect-square rounded-md overflow-hidden border"
                                    >
                                        <Image
                                            src={img.url}
                                            alt="refund"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-6">

                    {/* PAYMENT */}
                    <div className="bg-white border rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Banknote size={18} />
                            <h3 className="font-semibold">Phương thức hoàn</h3>
                        </div>

                        {refund.refundDestination === "bank" && refund.refundBankInfo ? (
                            <div className="text-sm space-y-1">
                                <p>Ngân hàng: {refund.refundBankInfo.bankName}</p>
                                <p>Số TK: {refund.refundBankInfo.accountNumber}</p>
                                <p>Chủ TK: {refund.refundBankInfo.accountHolder}</p>
                            </div>
                        ) : (
                            <p className="text-sm">
                                Hoàn về phương thức thanh toán ban đầu
                            </p>
                        )}
                    </div>

                    {/* MONEY */}
                    <div className="bg-white border rounded-xl p-6 sticky top-32">

                        <div className="flex items-center gap-2 mb-4">
                            <Receipt size={18} />
                            <h3 className="font-semibold">Chi tiết hoàn tiền</h3>
                        </div>

                        <div className="space-y-2 text-sm">

                            <div className="flex justify-between">
                                <span>Tiền sản phẩm</span>
                                <span>
                                    {formatPrice(refund.refundAmountData.itemRefund)}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span>Phí vận chuyển</span>
                                <span>
                                    {formatPrice(refund.refundAmountData.shippingRefund)}
                                </span>
                            </div>

                            <div className="border-t pt-3 flex justify-between font-bold text-green-600 text-lg">
                                <span>Tổng tiền hoàn</span>
                                <span>
                                    {formatPrice(refund.refundAmountData.totalRefund)}
                                </span>
                            </div>
                            {refund.status === "pending" && (
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full mt-4 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                        >
                                            Hủy yêu cầu hoàn tiền
                                        </Button>
                                    </DialogTrigger>

                                    <DialogContent className="sm:max-w-md">
                                        <div className="flex flex-col gap-4 py-2">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    Hủy yêu cầu hoàn tiền
                                                </h3>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Bạn có chắc muốn hủy yêu cầu hoàn tiền này không?
                                                </p>
                                                <p className="text-sm text-red-500 mt-2">
                                                    Hành động này không thể hoàn tác.
                                                </p>
                                            </div>
                                            <div className="flex justify-end gap-3 pt-2">
                                                <Button
                                                    variant="destructive"
                                                    onClick={() => handleCancelRefund.mutate()}
                                                    disabled={handleCancelRefund.isPending}
                                                >
                                                    {handleCancelRefund.isPending ? "Đang hủy..." : "Xác nhận hủy"}
                                                </Button>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>

                    </div>

                </div>

            </div>

        </div>
    )
}

export default DetailRefundPage
