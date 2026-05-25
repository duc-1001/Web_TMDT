import { Review } from '@/types/review'
import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import StarRating from '../prodcuct/star-rating'
import { formatTimeAgo } from '@/lib/time'
import { Dialog, DialogTrigger } from '../ui/dialog'
import { Pencil } from 'lucide-react'
import { EditReviewModal } from '../forms/review/edit-review-modal'
import { OrderItemSnapshot } from '@/types/order'
import { Product } from '@/types/product'

interface Props {
  review: Review
  handleUpdateReviewSuccess: (updatedReview: Review) => void
  item: OrderItemSnapshot | Product
}

const ProductReviewCard = ({
  review,
  handleUpdateReviewSuccess,
  item
}: Props) => {
  const [showEditReviewDialog, setShowEditReviewDialog] = React.useState(false)

  return (
    <div
      className={`relative border rounded-xl p-3 transition hover:shadow-sm ${
        review.isMine
          ? "bg-orange-50 border-orange-200"
          : "bg-white"
      }`}
    >
      {/* Edit button */}
      {review.isMine && (
        <Dialog
          open={showEditReviewDialog}
          onOpenChange={setShowEditReviewDialog}
        >
          <DialogTrigger asChild>
            <button
              className="absolute top-2 right-2 p-1.5 rounded-md text-gray-400 hover:text-orange-600 hover:bg-orange-100 transition"
            >
              <Pencil className="h-4 w-4" />
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
      )}

      {/* Badge */}
      {review.isMine && (
        <div className="text-[11px] font-medium text-orange-600 mb-2">
          Đánh giá của bạn
        </div>
      )}

      <div className="flex gap-3">
        {/* Avatar */}
        <Avatar className="h-9 w-9">
          <AvatarImage src={review.user?.avatar || undefined} />
          <AvatarFallback className="bg-orange-100 text-orange-600 text-sm font-semibold">
            {(review.user?.fullName || "U").charAt(0)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-1.5">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-gray-900">
                {review.user?.fullName || "Người dùng"}
              </div>

              <div className="flex items-center gap-1">
                <StarRating rating={review.rating} size="sm" />
              </div>
            </div>

            <div className="text-[11px] text-gray-400 whitespace-nowrap">
              {formatTimeAgo(review.createdAt)}
            </div>
          </div>

          {/* Comment */}
          {review.comment && (
            <div dangerouslySetInnerHTML={{__html:review.comment}} className="text-sm text-gray-700 leading-relaxed whitespace-pre-line"></div>
          )}

          {/* Images */}
          {review.images && review.images.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {review.images.map((img, idx) => (
                <div
                  key={idx}
                  className="w-14 h-14 overflow-hidden rounded-lg border cursor-pointer group"
                >
                  <img
                    src={img.url}
                    className="object-cover w-full h-full transition-transform duration-200 group-hover:scale-105"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductReviewCard