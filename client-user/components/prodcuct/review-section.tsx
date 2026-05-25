"use client"

import { useMemo, useState } from "react"
import "dayjs/locale/vi"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { useQuery } from "@tanstack/react-query"
import { getCanReviewProduct, getProductReviews } from "@/services/product.service"
import { formatTimeAgo } from "@/lib/time"
import { Star } from "lucide-react"
import { Button } from "../ui/button"
import { useSelector } from "react-redux"
import { RootState } from "@/store/store"
import { Product } from "@/types/product"
import StarRating from "./star-rating"
import ProductReviewCard from "../reviews/product-review-card"
import { Review } from "@/types/review"
import { queryClient } from "../QueryClientProviders"

interface ReviewSectionProps {
    product: Product
    reviewSectionRef: React.RefObject<HTMLDivElement | null>
    handleUpdateRating: (oldRating: number, newRating: number) => void
}

export default function ProductReviewSection({ product ,handleUpdateRating}: ReviewSectionProps) {

    const { isAuthenticated } = useSelector((state: RootState) => state.auth)

    const [page, setPage] = useState(1)
    const [showOrderSelect, setShowOrderSelect] = useState(false)

    const { data: canReviewData } = useQuery({
        queryKey: ["can-review-product", product._id],
        queryFn: () => getCanReviewProduct(product._id),
        enabled: !!product._id,
    })

    const { data: productReviews } = useQuery({
        queryKey: ["product-reviews", product._id, page],
        queryFn: () => getProductReviews(product._id, page, 6),
        enabled: !!product._id,
    })

    const myReviews = useMemo(() => {
        if (!productReviews) return []
        return productReviews.data.filter(r => r.isMine)
    }, [productReviews])

    const otherReviews = useMemo(() => {
        if (!productReviews) return []
        return productReviews.data.filter(r => !r.isMine)
    }, [productReviews])

    const handleUpdateReviewSuccess = (updatedReview: Review) => {
        queryClient.setQueryData(["product-reviews", product._id, page], (oldData: any) => {
            if (!oldData) return oldData
            const oldReview = oldData.data.find((r: Review) => r._id === updatedReview._id)
            const updatedReviews = oldData.data.map((r: Review) => r._id === updatedReview._id ? updatedReview : r)
            handleUpdateRating(oldReview?.rating || 0, updatedReview.rating)
            return {
                ...oldData,
                data: updatedReviews
            }
        })
    }

    const handleClickReview = () => {

        if (!isAuthenticated) {
            alert("Vui lòng đăng nhập để đánh giá")
            return
        }

        if (!canReviewData?.canReview) {
            alert("Bạn chưa mua sản phẩm này")
            return
        }

        const orders = canReviewData.orders || []

        if (orders.length === 1) {
            const order = orders[0]
            window.location.href = `/orders/${order.orderCode}?token=${order.viewToken}&tab=detail`
            return
        }

        if (orders.length > 1) {
            setShowOrderSelect(true)
        }
    }

    const rating = product?.ratingAvg || 0

    return (
        <div className="space-y-8">

            {/* HEADER */}
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Đánh giá sản phẩm</h3>

                <Button
                    onClick={handleClickReview}
                    className="
                        rounded-xl 
                        bg-gradient-to-r 
                        from-orange-500 
                        to-orange-600 
                        hover:from-orange-600 
                        hover:to-orange-700
                        shadow-md 
                        hover:shadow-lg
                        transition-all
                        text-white
                    "
                >
                    Viết đánh giá
                </Button>
            </div>

            {/* OVERVIEW */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4">

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">

                    <div className="flex flex-col items-center md:items-start text-center md:text-left">

                        <div className="text-5xl font-semibold text-gray-900">
                            {product?.ratingAvg?.toFixed(1) || "0.0"}
                        </div>

                        <StarRating rating={rating} />

                        <div className="text-sm text-gray-400 mt-1">
                            {product?.ratingCount || 0} đánh giá
                        </div>

                    </div>

                    <div className="md:col-span-2 space-y-1">

                        {[5, 4, 3, 2, 1].map((stars) => {

                            const count = product?.ratingBreakdown?.[stars] || 0
                            const total = product?.ratingCount || 0
                            const percent = total ? (count / total) * 100 : 0

                            return (
                                <div key={stars} className="flex items-center gap-3">

                                    <span className="text-sm text-gray-500 w-12">
                                        {stars} sao
                                    </span>

                                    <div className="flex-1 h-2 rounded-full bg-gray-100">

                                        <div
                                            className="h-2 rounded-full bg-yellow-400 transition-all duration-500"
                                            style={{ width: `${percent}%` }}
                                        />

                                    </div>

                                    <span className="text-sm text-gray-400 w-10 text-right">
                                        {count}
                                    </span>

                                </div>
                            )

                        })}

                    </div>

                </div>

            </div>

            {/* REVIEW LIST */}
            <div className="space-y-4">

                {otherReviews.length === 0 && myReviews.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground">
                        Chưa có đánh giá nào
                    </div>
                )}

                {/* ===== My Reviews ===== */}
                {myReviews.map((i) => (
                    < ProductReviewCard key={i._id} review={i} item={product} handleUpdateReviewSuccess={handleUpdateReviewSuccess} />
                ))}

                {/* ===== Other Reviews ===== */}
                {otherReviews.map((i) => (
                    <ProductReviewCard key={i._id} review={i} item={product} handleUpdateReviewSuccess={handleUpdateReviewSuccess} />
                ))}

            </div>

            {/* PAGINATION */}
            {productReviews && productReviews?.pagination?.totalPages > 1 && (

                <div className="flex justify-center gap-2 pt-6">

                    {Array.from({ length: productReviews.pagination.totalPages }, (_, index) => (

                        <button
                            key={index}
                            onClick={() => setPage(index + 1)}
                            className={`px-3 py-1 rounded-lg border ${page === index + 1 ? "bg-orange-500 text-white" : ""}`}
                        >
                            {index + 1}
                        </button>

                    ))}

                </div>

            )}

            {/* POPUP CHỌN ĐƠN HÀNG */}
            {showOrderSelect && (

                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">

                    <div className="bg-white w-[420px] max-w-[90%] rounded-2xl shadow-xl p-6 space-y-4">

                        <div className="flex items-center justify-between">

                            <h4 className="text-lg font-semibold">
                                Chọn đơn hàng để đánh giá
                            </h4>

                            <button
                                onClick={() => setShowOrderSelect(false)}
                                className="text-gray-400 hover:text-gray-600 text-xl"
                            >
                                ✕
                            </button>

                        </div>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto">

                            {canReviewData?.orders?.map((o) => (

                                <button
                                    key={o.orderId}
                                    onClick={() => {
                                        window.location.href = `/orders/${o.orderCode}?token=${o.viewToken}&tab=detail`
                                    }}
                                    className="
                                        w-full text-left
                                        border rounded-xl
                                        px-4 py-3
                                        hover:bg-orange-50
                                        hover:border-orange-300
                                        transition
                                    "
                                >

                                    <div className="font-medium text-gray-800">
                                        Đơn hàng #{o.orderCode}
                                    </div>

                                    <div className="text-sm text-gray-500">
                                        Ngày đặt: {new Date(o.createdAt).toLocaleDateString("vi-VN")}
                                    </div>

                                </button>

                            ))}

                        </div>

                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setShowOrderSelect(false)}
                        >
                            Hủy
                        </Button>

                    </div>

                </div>

            )}

        </div>
    )
}