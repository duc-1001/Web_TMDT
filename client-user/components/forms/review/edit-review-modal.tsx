"use client"

import { useMemo, useState, useEffect } from "react"
import { Star, X, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { OrderItemSnapshot } from "@/types/order"
import { formatPrice } from "@/lib/utils"
import { Product } from "@/types/product"
import { useForm } from "react-hook-form"
import { ReviewFormData, reviewSchema } from "@/schemas/review.schema"
import { zodResolver } from "@hookform/resolvers/zod"
import { uploadFile } from "@/services/upload.service"
import { updateReview } from "@/services/review.service"
import { EditReviewPayload, Review,OrderReview } from "@/types/review"
import { toast } from "sonner"

interface EditReviewModalProps {
  isOpen: boolean
  onClose: () => void
  item: OrderItemSnapshot | Product
  review: Review
  handleUpdateReviewSuccess: (review: Review | OrderReview) => void
}

const ratingTexts = {
  1: "Rất tệ",
  2: "Tệ",
  3: "Bình thường",
  4: "Tốt",
  5: "Rất hài lòng",
}

export function EditReviewModal({
  isOpen,
  onClose,
  item,
  review,
  handleUpdateReviewSuccess
}: EditReviewModalProps) {

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 5,
      comment: "",
      images: []
    }
  })

  const [hoverRating, setHoverRating] = useState<number | null>(null)

  useEffect(() => {
    if (!review) return
    reset({
      rating: review.rating,
      comment: review.comment?.replace(/<br>/g, "\n") || "",
      images: review.images || []
    })
  }, [review, reset])

  const uploadedImages = watch("images") || []

  const previewImages = useMemo(() => {
    return uploadedImages.map((img) => {
      if (typeof img === "string") return img
      if ("url" in img) return img.url
      return URL.createObjectURL(img)
    })
  }, [uploadedImages])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const current = watch("images") || []

    if (current.length + files.length > 5) {
      toast.error("Chỉ được tối đa 5 ảnh")
      return
    }

    setValue("images", [...current, ...Array.from(files)])
    e.target.value = ""
  }

  const removeImage = (index: number) => {
    const images = [...(watch("images") || [])]
    images.splice(index, 1)
    setValue("images", images)
  }

  const onSubmit = handleSubmit(async (data) => {
    try {

      const uploaded = await Promise.all(
        (data.images || []).map(async (img) => {

          if (typeof img === "object" && "url" in img) return img

          const result = await uploadFile(img as File, "review")

          if (!result?.url || !result?.imagePublicId) {
            throw new Error("Upload ảnh thất bại")
          }

          return {
            url: result.url,
            imagePublicId: result.imagePublicId
          }
        })
      )

      const payload: EditReviewPayload = {
        rating: data.rating,
        comment: data.comment?.trim().replace(/\n/g, "<br>") || "",
        images: uploaded
      }

      const updated = await updateReview(review._id, payload)

      toast.success("Cập nhật đánh giá thành công")

      if (updated) {
        handleUpdateReviewSuccess(updated)
      }
      onClose()

    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Có lỗi xảy ra")
    }
  })

  const imageUrl =
    "images" in item
      ? item.images?.[0]?.url ?? "/placeholder.svg"
      : item.image?.url ?? "/placeholder.svg"

  const maxChars = 500
  const charCount = watch("comment")?.length ?? 0

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden rounded-3xl shadow-lg border bg-white">

        <DialogHeader className="px-6 py-5 border-b bg-orange-50">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            ✏️ Chỉnh sửa đánh giá
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-6 space-y-8 overflow-y-auto max-h-[60vh]">

          {/* product */}
          <div className="flex gap-4 items-center p-4 rounded-xl border bg-white">
            <div className="relative h-20 w-20 rounded-lg overflow-hidden border">
              <img src={imageUrl} alt={item.name} className="h-full w-full object-cover" />
            </div>

            <div className="flex-1">
              <h3 className="text-sm font-medium line-clamp-2">{item.name}</h3>
              <p className="text-xs text-muted-foreground">
                {formatPrice(item.price)} / cái
              </p>
            </div>
          </div>

          {/* rating */}
          <div>
            <label className="text-sm font-semibold block mb-3">
              Đánh giá của bạn
            </label>

            <div className="flex items-center gap-4">

              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => {

                  const active = (hoverRating ?? watch("rating")) >= star

                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setValue("rating", star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                    >
                      <Star
                        className={`h-9 w-9 transition ${active
                            ? "fill-orange-500 text-orange-500"
                            : "text-gray-300"
                          }`}
                      />
                    </button>
                  )
                })}
              </div>

              <Badge className="bg-orange-100 text-orange-700 border">
                {ratingTexts[watch("rating") as keyof typeof ratingTexts]}
              </Badge>

            </div>
          </div>

          {/* comment */}
          <div>
            <label className="text-sm font-semibold block mb-3">
              Nhận xét
            </label>

            <div className="relative">
              <Textarea
                {...register("comment")}
                maxLength={maxChars}
                placeholder="Chia sẻ cảm nhận của bạn..."
                className="min-h-36 rounded-xl border"
              />

              <div className="absolute bottom-2 right-3 text-xs text-muted-foreground">
                {charCount}/{maxChars}
              </div>
            </div>

            {errors.comment && (
              <p className="text-xs text-red-500 mt-1">
                {errors.comment.message}
              </p>
            )}
          </div>

          {/* images */}
          <div>
            <label className="text-sm font-semibold block mb-3">
              Ảnh minh họa
            </label>

            <div className="flex flex-wrap gap-4">

              {uploadedImages.length < 5 && (
                <label className="w-24 h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Thêm</span>
                </label>
              )}

              {previewImages.map((img, index) => (
                <div key={index} className="relative w-24 h-24 rounded-xl overflow-hidden border group">

                  <Image
                    src={img}
                    alt="review"
                    fill
                    className="object-cover"
                  />

                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>

                </div>
              ))}

            </div>

            <p className="text-xs text-muted-foreground mt-2">
              Tối đa 5 ảnh
            </p>

          </div>

        </div>

        <div className="border-t px-6 py-4 flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Hủy
          </Button>

          <Button
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
            onClick={onSubmit}
            disabled={isSubmitting || !watch("comment")?.trim()}
          >
            {isSubmitting ? "Đang lưu..." : "Cập nhật đánh giá"}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  )
}