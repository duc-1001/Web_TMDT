import React from 'react'
import { Pencil, Star } from 'lucide-react'
import { Button } from '../ui/button'
import { formatPrice, HIDE_REVIEW_REASONS } from '@/lib/utils'
import { ReviewModal } from '../forms/review/create-review-modal'
import { OrderItemSnapshot } from '@/types/order'
import { OrderReview, Review } from '@/types/review'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { toast } from 'sonner'
import StarRating from '../prodcuct/star-rating'
import { Dialog } from '@radix-ui/react-dialog'
import { DialogTrigger } from '../ui/dialog'
import { EditReviewModal } from '../forms/review/edit-review-modal'
import { formatDateTime, formatTimeAgo } from '@/lib/time'

interface OrderItemDetailPageProps {
    item: OrderItemSnapshot
    canReview: boolean,
    orderId: string,
    review: OrderReview | undefined,
    handleAddReviewSuccess: (newReview: Review | OrderReview) => void
    handleUpdateReviewSuccess: (updatedReview: Review | OrderReview) => void
}

const OrderItemDetailPage = ({ item, canReview, orderId, review, handleAddReviewSuccess, handleUpdateReviewSuccess }: OrderItemDetailPageProps) => {
    const { isAuthenticated } = useSelector((state: RootState) => state.auth)
    const [showCreateReviewDialog, setShowCreateReviewDialog] = React.useState(false)
    const [showEditReviewDialog, setShowEditReviewDialog] = React.useState(false)
    return (
        <div className="pb-4 border-b last:border-0">
            <div className="flex gap-4 mb-3">
                <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-muted shrink-0">
                    <img src={item.image?.url} alt={item.name} className="h-full m-auto object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm mb-1">{item.name}</h4>
                    <p className="text-sm text-muted-foreground">Số lượng: {item.quantity}</p>
                </div>
                <div className="text-right">
                    <p className="font-semibold text-orange-500">{formatPrice(item.price * item.quantity)}</p>
                    <p className="text-xs text-muted-foreground">{formatPrice(item.price)}/cái</p>
                </div>
            </div>
            {canReview ? (
                review ? (
                    <div className="rounded-lg border bg-gray-50 p-3 space-y-3">

                        {/* rating row */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                <StarRating rating={review.rating} size="sm" />
                                <span className="text-gray-400">•</span>
                                <span>{formatTimeAgo(review.createdAt)}</span>
                            </div>

                            <Dialog open={showEditReviewDialog} onOpenChange={setShowEditReviewDialog}>
                                <DialogTrigger asChild>
                                    <button className="p-1 rounded hover:bg-gray-200 transition">
                                        <Pencil className="h-3.5 w-3.5 text-gray-500" />
                                    </button>
                                </DialogTrigger>
                                <EditReviewModal
                                    isOpen={showEditReviewDialog}
                                    onClose={() => setShowEditReviewDialog(false)}
                                    item={item}
                                    review={review}
                                    handleUpdateReviewSuccess={handleUpdateReviewSuccess}
                                />
                            </Dialog>
                        </div>

                        {/* comment */}
                        {review.comment && (
                            <div className="text-xs text-gray-700 leading-snug bg-white border rounded-md p-2">
                                {review.comment}
                            </div>
                        )}

                        {/* images */}
                        {review.images?.length > 0 && (
                            <div className="flex gap-1.5 flex-wrap">
                                {review.images.map((img, index) => (
                                    <div key={index} className="h-12 w-12 rounded-md overflow-hidden border hover:scale-105 transition">
                                        <img src={img.url} alt={`review-${index}`} className="h-full w-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* review status */}
                        <div className="text-[11px] text-green-600 font-medium">
                            ✔ Bạn đã đánh giá sản phẩm này
                        </div>

                        {/* hidden review notice */}
                        {review.isHidden && (
                            <div className="rounded-md border border-red-200 bg-red-50 p-2 text-[11px] text-red-700 space-y-1">
                                <div className="font-semibold flex items-center gap-1">
                                    ⚠ Đánh giá này đã bị ẩn bởi quản trị viên
                                </div>

                                <div className="text-red-600">
                                    Lý do: {
                                        review.hiddenReasonCode === "OTHER"
                                            ? review.hiddenReasonText
                                            : HIDE_REVIEW_REASONS.find(r => r.value === review.hiddenReasonCode)?.label
                                    }
                                </div>
                            </div>
                        )}

                    </div>
                ) : (
                    <>
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full bg-transparent gap-2 text-xs"
                            onClick={() => {
                                if (!isAuthenticated) {
                                    toast.error("Vui lòng đăng nhập để đánh giá sản phẩm")
                                    return
                                }
                                setShowCreateReviewDialog(true)
                            }}
                        >
                            <Star className="h-3 w-3" />
                            Đánh giá sản phẩm
                        </Button>
                        <ReviewModal
                            isOpen={showCreateReviewDialog && canReview}
                            onClose={() => setShowCreateReviewDialog(false)}
                            item={item}
                            orderId={orderId}
                            handleAddReviewSuccess={handleAddReviewSuccess}
                        />
                    </>
                )
            ) : (
                <div className="w-full rounded-lg border border-orange-200 bg-orange-50 px-4 py-1 text-sm text-orange-700 flex items-center gap-2">
                    <span className="text-lg">📦</span>
                    <span>Bạn có thể đánh giá sau khi đơn hàng được giao thành công</span>
                </div>
            )}
        </div>
    )
}

export default OrderItemDetailPage
