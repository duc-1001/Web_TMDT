"use client"

import { useState, useMemo, useEffect } from "react"
import { Search } from "lucide-react"
import { useMutation, useQuery } from "@tanstack/react-query"
import useDebounce from "@/hooks/use-debounce"
import { getAllReviewsForAdmin, hideReview, unhideReview } from "@/services/review.service"
import PaginationControls from "@/components/layout/pagination-controls-admin"
import { useRouter } from "next/navigation"
import AdminReviewRow from "@/components/reviews/admin-review-row"
import { ReasonCode, Review } from "@/types/review"
import { queryClient } from "@/components/QueryClientProviders"
import { toast } from "sonner"

type FilterStatus = "all" | "visible" | "hidden"
const AdminReviewPage = () => {
    const router = useRouter()
    const [search, setSearch] = useState("")
    const [filterStatus, setFilterStatus] = useState<FilterStatus>("all")
    const [currentPage, setCurrentPage] = useState(1)
    const [itemPerPage, setItemPerPage] = useState(20)
    const q = useDebounce(search, 500)
    const { data, isLoading, error } = useQuery({
        queryKey: ['admin-reviews', q, filterStatus, currentPage, itemPerPage],
        queryFn: () => getAllReviewsForAdmin(q, currentPage, itemPerPage, filterStatus),
    })

    const errCode = (error as any)?.code
    useEffect(() => {
        if (errCode === "UNAUTHORIZED" || errCode === "PERMISSION_DENIED") {
            router.push("/")
        }
    }, [errCode])

    const totalPages = useMemo(() => {
        if (!data) return 1
        return data.pagination.totalPages
    }, [data])

    const totalItems = useMemo(() => {
        if (!data) return 0
        return data.pagination.total
    }, [data])

    const reviews = useMemo(() => {
        if (!data) return []
        return data.data
    }, [data])

    const hideReviewMutation = useMutation({
        mutationFn: ({ id, reasonCode, reasonText }: { id: string, reasonCode: ReasonCode, reasonText: string }) => hideReview(id, reasonCode, reasonText),
        onSuccess: (data) => {
            if (!data || !data._id) return
            queryClient.setQueryData(
                ['admin-reviews', q, filterStatus, currentPage, itemPerPage],
                (oldData: any) => {
                    if (!oldData) return oldData
                    return {
                        ...oldData,
                        data: oldData.data.map((review: Review) =>
                            review._id === data._id
                                ? {
                                    ...review,
                                    isHidden: true,
                                    hiddenReasonCode: data.hiddenReasonCode,
                                    hiddenReasonText: data.hiddenReasonText
                                }
                                : review
                        )
                    }
                }
            )
            toast.success("Đánh giá đã được ẩn thành công")
        },
        onError: (error) => {
            toast.error("Có lỗi xảy ra khi ẩn đánh giá")
        }
    })

    const unhideReviewMutation = useMutation({
        mutationFn: (id: string) => unhideReview(id),
        onSuccess: (data) => {
            if (!data || !data._id) return
            queryClient.setQueryData(
                ['admin-reviews', q, filterStatus, currentPage, itemPerPage],
                (oldData: any) => {
                    if (!oldData) return oldData
                    return {
                        ...oldData,
                        data: oldData.data.map((review: Review) =>
                            review._id === data._id
                                ? {
                                    ...review,
                                    isHidden: false,
                                    hiddenReasonCode: undefined,
                                    hiddenReasonText: undefined
                                }
                                : review
                        )
                    }
                }
            )
            toast.success("Đánh giá đã được hiển thị lại thành công")
        },
        onError: (error) => {
            toast.error("Có lỗi xảy ra khi hiển thị lại đánh giá")
        }
    })

    return (
        <div className="space-y-6 p-6">
            {/* Title */}
            <h1 className="text-2xl font-semibold">Quản lý đánh giá sản phẩm</h1>

            {/* Search + Filter */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                        placeholder="Tìm user hoặc sản phẩm..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm"
                    />
                </div>

                <div className="flex gap-2">
                    {(["all", "visible", "hidden"] as FilterStatus[]).map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`rounded-md border px-3 py-1.5 text-sm ${filterStatus === status
                                ? "bg-black text-white"
                                : "bg-white hover:bg-gray-50"
                                }`}
                        >
                            {status === "all" && "Tất cả"}
                            {status === "visible" && "Hiển thị"}
                            {status === "hidden" && "Ẩn"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                        <tr className="text-left">
                            <th className="p-4">Người dùng</th>
                            <th className="p-4">Sản phẩm</th>
                            <th className="p-4">Đánh giá</th>
                            <th className="p-4">Bình luận</th>
                            <th className="p-4">Hình ảnh</th>
                            <th className="p-4">Trạng thái</th>
                            <th className="p-4">Ngày tạo</th>
                            <th className="p-4 text-right">Hoạt động</th>
                        </tr>
                    </thead>

                    <tbody>
                        {reviews.map(review => (
                            <AdminReviewRow
                                key={review._id}
                                review={review}
                                unhideReviewMutation={unhideReviewMutation}
                                hideReviewMutation={hideReviewMutation}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
            <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemPerPage}
                setCurrentPage={setCurrentPage}
                setItemsPerPage={setItemPerPage}
                totalItems={totalItems}

            />
        </div>
    )
}

export default AdminReviewPage