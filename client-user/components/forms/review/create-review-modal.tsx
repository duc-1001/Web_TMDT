"use client"

import { useMemo, useState } from "react"
import { Star, X, Upload, } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { OrderItemSnapshot } from "@/types/order"
import { formatPrice } from "@/lib/utils"
import { Product } from "@/types/product"
import { useForm } from "react-hook-form"
import { ReviewFormData, reviewSchema } from "@/schemas/review.schema"
import { zodResolver } from "@hookform/resolvers/zod"
import { deleteFile, uploadFile } from "@/services/upload.service"
import { createReview } from "@/services/review.service"
import { CreateReviewPayload, OrderReview, Review } from "@/types/review"
import { toast } from "sonner"

interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  item: OrderItemSnapshot | Product
  handleAddReviewSuccess?: (newReview: Review|OrderReview) => void,
  orderId: string
}

const ratingTexts = {
  1: "Rất tệ",
  2: "Tệ",
  3: "Bình thường",
  4: "Tốt",
  5: "Rất hài lòng",
}

export function ReviewModal({
  isOpen,
  onClose,
  item,
  handleAddReviewSuccess,
  orderId
}: ReviewModalProps) {
  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    setError,
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

  const maxChars = 500
  const charCount = watch("comment")?.length ?? 0
  const uploadedImages = useMemo(() => watch("images") || [], [watch("images")])

  const previewImage = useMemo(() => {
    if (uploadedImages.length > 0) {
      return uploadedImages.map((image) => typeof image === "string" ? image :  (typeof image === 'object' && "url" in image) ? image.url : URL.createObjectURL(image))
    }
    return []
  }, [uploadedImages])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (!files) return
    if ((watch("images")?.length ?? 0) + files.length > 5) {
      setError("images", { message: "Bạn chỉ có thể tải lên tối đa 5 ảnh" })
      return
    }
    setValue("images", [...(watch("images") || []), ...Array.from(files)], { shouldValidate: true })
    e.currentTarget.value = ""
  }

  const removeImage = (index: number) => {
    const images = watch("images") || []
    images.splice(index, 1)
    setValue("images", images, { shouldValidate: true })
  }

  const handleSubmit = handleFormSubmit(async (data) => {
    const firstErrorKey = Object.keys(errors)[0] as keyof ReviewFormData
    const firstError = errors[firstErrorKey]

    if (firstError) {
      setError(firstErrorKey, { message: firstError.message })
      return
    }

    let cleanImages: { url: string, imagePublicId: string }[] = []

    try {
      const uploadedImages = await Promise.all(
        (data.images ?? []).map(async (file) => {
          if (typeof file === "string") {
            return file
          }
          else if (typeof file === "object") {
            if ("url" in file && "imagePublicId" in file) {
              return file
            }
          }
          const result = await uploadFile(file, "review")
          if (!result || !result.url || !result.imagePublicId) {
            throw new Error("Upload failed")
          }
          return {
            url: result.url,
            imagePublicId: result.imagePublicId
          }
        })
      )

      cleanImages = uploadedImages.filter(
        (img): img is { url: string, imagePublicId: string } => typeof img !== "string"
      )

      const payload: CreateReviewPayload = {
        productId: "productId" in item ? item.productId : item._id,
        orderId,
        rating: data.rating,
        comment: data.comment?.trim().replace(/\n/g, "<br>") || "",
        images: cleanImages
      }
      const newReview = await createReview(payload)
      if (handleAddReviewSuccess && newReview) {
        handleAddReviewSuccess(newReview)
      }
      onClose()
      toast.success("Đánh giá của bạn đã được gửi thành công!")
      reset()
    } catch (error: any) {
      console.error("Create review failed:", error)
      await Promise.all(cleanImages.map(img => deleteFile(img.imagePublicId)))
      toast.error(error.message || "Đã có lỗi xảy ra khi gửi đánh giá.")
      return
    }
  })

  const imageUrl =
    "images" in item
      ? item.images?.[0]?.url ?? "/placeholder.svg"
      : item.image?.url ?? "/placeholder.svg"

  return (
    <Dialog open={isOpen}
      onOpenChange={(open) => {
        if (!isSubmitting) {
          onClose()
        }
      }}
    >
      <DialogContent
        onInteractOutside={(e) => {
          if (isSubmitting) e.preventDefault()
        }}
        onEscapeKeyDown={(e) => {
          if (isSubmitting) e.preventDefault()
        }}
        className=" max-w-2xl  max-h-[90vh]  p-0  overflow-hidden  rounded-3xl  shadow-[0_25px_70px_rgba(0,0,0,0.15)]  border  bg-white" >
        {/* HEADER */}
        <DialogHeader className="px-6 py-5 border-b bg-gradient-to-r from-orange-100/60 via-white to-white">
          <DialogTitle className="text-lg font-semibold tracking-tight flex items-center gap-2">
            ✨ Viết đánh giá sản phẩm
          </DialogTitle>
        </DialogHeader>

        {/* BODY */}
        <div className="px-6 py-6 space-y-8 overflow-y-auto max-h-[60vh]">
          {/* PRODUCT CARD */}
          <div
            className="flex gap-4 items-center p-4 rounded-2xl bg-white shadow-sm border border-orange-100 hover:shadow-md transition-all"
          >
            <div className="relative h-20 w-20 rounded-xl overflow-hidden bg-background shrink-0 border">
              <img
                src={imageUrl}
                alt={item.name}
                className="object-cover transition-transform h-full m-auto duration-300 hover:scale-110"
              />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm leading-snug line-clamp-2">
                {item.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                Giá: {formatPrice(item.price)} / cái
              </p>
            </div>
          </div>

          {/* RATING */}
          <div>
            <label className="text-sm font-semibold block mb-4">
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
                      className="transition-all duration-200 hover:scale-125"
                    >
                      <Star
                        className={`h-10 w-10 transition-all duration-200 ${active
                          ? "fill-yellow-400 text-yellow-400 drop-shadow-md"
                          : "text-gray-300"
                          }`}
                      />
                    </button>
                  )
                })}
              </div>

              <Badge className="px-4 py-1.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200 text-xs font-medium shadow-sm" >
                {ratingTexts[watch("rating") as keyof typeof ratingTexts]}
              </Badge>
            </div>

            {watch("rating") === 5 && (
              <p className="text-sm text-orange-500 font-medium mt-2 animate-pulse">
                Cảm ơn bạn đã đánh giá 5 sao 🌟
              </p>
            )}
          </div>

          {/* TEXTAREA */}
          <div>
            <label className="text-sm font-semibold block mb-3">
              Nhận xét của bạn
            </label>

            <div className="relative">
              <Textarea
                placeholder="Chia sẻ cảm nhận của bạn về sản phẩm này..."
                {...register("comment")}
                maxLength={maxChars}
                className="min-h-36 resize-none rounded-2xl border border-gray-200 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:border-orange-400 pr-14 shadow-sm transition-all"
              />
              <div className="absolute bottom-3 right-4 text-xs text-muted-foreground">
                {charCount}/{maxChars}
              </div>
            </div>
            {errors.comment && (
              <p className="text-xs text-red-500 mt-1">
                {errors.comment.message}
              </p>
            )}
          </div>

          {/* IMAGE UPLOAD */}
          <div>
            <label className="text-sm font-semibold block mb-3">
              Ảnh minh họa (tùy chọn)
            </label>

            <div className="flex flex-wrap gap-4">
              {uploadedImages.length < 5 && (
                <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 hover:shadow-md transition-all duration-200">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">
                    Thêm ảnh
                  </span>
                </label>
              )}

              {previewImage.map((image, index) => (
                <div key={index} className="relative w-24 h-24 rounded-2xl overflow-hidden border shadow-sm group hover:shadow-lg transition" >
                  <Image
                    src={image}
                    alt={`Review image ${index + 1}`}
                    fill
                    className="object-cover"
                  />

                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              Tối đa 5 ảnh, PNG hoặc JPG
            </p>
            {errors.images && (
              <p className="text-xs text-red-500 mt-1">
                {errors.images.message}
              </p>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex gap-3">
          <Button
            variant="outline"
            className="flex-1 rounded-2xl border-gray-300 hover:bg-gray-50"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Hủy
          </Button>

          <Button
            className="flex-1 text-white rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md hover:shadow-xl transition-all duration-200"
            onClick={handleSubmit}
            disabled={isSubmitting || !watch("comment")?.trim()}
          >
            {isSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}