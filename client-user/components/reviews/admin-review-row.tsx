import { formatTimeAgo } from "@/lib/time"
import { AdminReview } from "@/types/review"
import { Eye, EyeOff, Star, Trash2 } from "lucide-react"
import React from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "../ui/dialog"

interface AdminReviewRowProps {
    review: AdminReview
    unhideReviewMutation: any
    hideReviewMutation: any
}

const AdminReviewRow = ({
    review,
    unhideReviewMutation,
    hideReviewMutation
}: AdminReviewRowProps) => {
    const [reason, setReason] = React.useState("")
    const [customReason, setCustomReason] = React.useState("")
    const [open, setOpen] = React.useState(false)

    const handleHide = async () => {
        await hideReviewMutation.mutateAsync({ id: review._id, reasonCode: reason, reasonText: customReason })
        const finalReason = reason === "OTHER" ? customReason : reason
        setReason("")
        setCustomReason("")
        setOpen(false)
    }

    return (
        <tr className="border-t hover:bg-gray-50">

            {/* User */}
            <td className="p-4">
                <div className="flex items-center gap-3">
                    <img
                        src={review.user?.avatar || "/placeholder.svg"}
                        className="h-9 w-9 rounded-full object-cover"
                        alt={review.user?.fullName || "user"}
                    />
                    <span className="text-sm font-medium">
                        {review.user?.fullName || "Người dùng"}
                    </span>
                </div>
            </td>

            {/* Product */}
            <td className="p-4 text-sm">{review.product?.name}</td>

            {/* Rating */}
            <td className="p-4">
                <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                            key={star}
                            className={`h-4 w-4 ${star <= review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                                }`}
                        />
                    ))}
                </div>
            </td>

            {/* Comment */}
            <td className="p-4 max-w-xs text-sm text-gray-600">
                {review.comment || <span className="italic text-gray-400">Không có nội dung</span>}
            </td>

            {/* Images */}
            <td className="p-4">
                {review.images?.length > 0 ? (
                    <div className="flex items-center">
                        {review.images.slice(0, 3).map((img, i) => (
                            <img
                                key={i}
                                src={img.url}
                                className="h-10 w-10 rounded-md border object-cover -ml-2 first:ml-0"
                                alt={`review-${review._id}-${i}`}
                            />
                        ))}

                        {review.images.length > 3 && (
                            <div className="h-10 w-10 flex items-center justify-center rounded-md border bg-gray-100 text-xs font-medium -ml-2">
                                +{review.images.length - 3}
                            </div>
                        )}
                    </div>
                ) : (
                    <span className="text-xs italic text-muted-foreground">
                        Không có ảnh
                    </span>
                )}
            </td>

            {/* Status */}
            <td className="p-4">
                <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${!review.isHidden
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-600"
                        }`}
                >
                    {review.isHidden ? "Ẩn" : "Hiển thị"}
                </span>
            </td>

            {/* Date */}
            <td className="p-4 text-sm text-gray-500">
                {formatTimeAgo(review.createdAt)}
            </td>

            {/* Actions */}
            <td className="p-4">
                <div className="flex justify-end gap-2">

                    {!review.isHidden ? (
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <button className="rounded p-2 hover:bg-gray-100">
                                    <EyeOff size={16} />
                                </button>
                            </DialogTrigger>

                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Ẩn đánh giá</DialogTitle>
                                    <DialogDescription>
                                        Chọn lý do ẩn đánh giá này
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-3 py-2">
                                    <select
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        className="w-full rounded-md border px-3 py-2 text-sm"
                                    >
                                        <option value="">Chọn lý do</option>
                                        <option value="SPAM">Spam / quảng cáo</option>
                                        <option value="OFFENSIVE">Ngôn từ không phù hợp</option>
                                        <option value="IRRELEVANT">Không liên quan sản phẩm</option>
                                        <option value="OTHER">Khác</option>
                                    </select>

                                    {reason === "OTHER" && (
                                        <textarea
                                            placeholder="Nhập lý do..."
                                            value={customReason}
                                            onChange={(e) => setCustomReason(e.target.value)}
                                            className="w-full rounded-md border px-3 py-2 text-sm"
                                        />
                                    )}
                                </div>

                                <DialogFooter>
                                    <button
                                        onClick={handleHide}
                                        disabled={!reason || hideReviewMutation.isPending}
                                        className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                                    >
                                        Ẩn đánh giá
                                    </button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    ) : (
                        <button
                            disabled={unhideReviewMutation.isPending}
                            className="rounded p-2 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={() => unhideReviewMutation.mutate(review._id)}
                        >
                            <Eye size={16} />
                        </button>
                    )}
                </div>
            </td>

        </tr>
    )
}

export default AdminReviewRow