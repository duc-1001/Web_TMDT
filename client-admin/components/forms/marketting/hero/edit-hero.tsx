import { queryClient } from '@/components/QueryClientProviders'
import { Button } from '@/components/ui/button'
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { HeroBanner, HeroBannerSchema } from '@/schemas/hero.schema'
import { editBanner } from '@/services/banner.service'
import { zodResolver } from '@hookform/resolvers/zod'
import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { HeroBanner as Banner } from '@/types/banner'

const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"]
const MAX_FILE_SIZE = 10 * 1024 * 1024

interface EditHeroProps {
    setOpenEditDialog: React.Dispatch<React.SetStateAction<boolean>>
    selectedBanner: Banner
}

const EditHero = ({ setOpenEditDialog, selectedBanner }: EditHeroProps) => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        watch,
        setValue,
        setError,
        clearErrors,
        reset,
    } = useForm<HeroBanner>({
        resolver: zodResolver(HeroBannerSchema),
        defaultValues: {
            title: '',
            subtitle: '',
            buttonText: '',
            buttonLink: '',
            backgroundImage: '',
        }
    })

    useEffect(() => {
        if (selectedBanner) {
            reset({
                title: selectedBanner.title,
                subtitle: selectedBanner.subtitle ?? '',
                buttonText: selectedBanner.buttonText ?? '',
                buttonLink: selectedBanner.buttonLink ?? '',
                backgroundImage: selectedBanner.backgroundImage ?? '',
            })
        }
    }, [selectedBanner, reset])

    const onSubmit = async (data: HeroBanner) => {
        try {
            const res = await editBanner(selectedBanner._id, data)
            if (res.success === true) {
                queryClient.invalidateQueries({ queryKey: ['hero-banners-admin'] })
                queryClient.invalidateQueries({ queryKey: ['hero-banners'] })
                setOpenEditDialog(false)
                reset()
                toast.success("Cập nhật hero banner thành công!")
            }
        } catch (error) {
            console.error(error)
            toast.error("Có lỗi xảy ra. Vui lòng thử lại.")
        }
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return

        const file = files[0]

        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
            setError("backgroundImage", {
                type: "manual",
                message: "Ảnh chỉ chấp nhận file PNG, JPG hoặc WEBP",
            })
            e.target.value = ""
            return
        }

        if (file.size > MAX_FILE_SIZE) {
            setError("backgroundImage", {
                type: "manual",
                message: "Dung lượng ảnh tối đa 10MB",
            })
            e.target.value = ""
            return
        }

        clearErrors("backgroundImage")
        setValue("backgroundImage", file, { shouldValidate: true })
        e.target.value = ""
    }

    const bgValue = watch("backgroundImage")
    const previewImage = bgValue instanceof File
        ? URL.createObjectURL(bgValue)
        : bgValue as string

    return (
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Chỉnh sửa Hero Banner</DialogTitle>
                <DialogDescription>
                    Nội dung sẽ hiển thị trên trang chủ ngay khi lưu
                </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
                {/* CONTENT */}
                <div className="space-y-4">
                    <div>
                        <Label className='mb-1'>Tiêu đề</Label>
                        <Input
                            placeholder="Snack ngon mỗi ngày, giao nhanh tận nhà"
                            {...register("title")}
                        />
                        {errors.title && (
                            <p className="text-xs text-red-600 mt-1 font-medium">
                                {errors.title.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <Label className='mb-1'>Tiêu đề phụ</Label>
                        <Input
                            placeholder="Hàng trăm loại snack Việt & nhập khẩu"
                            {...register("subtitle")}
                        />
                        {errors.subtitle && (
                            <p className="text-xs text-red-600 mt-1 font-medium">
                                {errors.subtitle.message}
                            </p>
                        )}
                    </div>
                </div>

                {/* CTA */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className='mb-1'>Văn bản nút</Label>
                        <Input placeholder="Mua ngay" {...register("buttonText")} />
                        {errors.buttonText && (
                            <p className="text-xs text-red-600 mt-1 font-medium">
                                {errors.buttonText.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <Label className='mb-1'>Liên kết nút</Label>
                        <Input placeholder="/products" {...register("buttonLink")} />
                        {errors.buttonLink && (
                            <p className="text-xs text-red-600 mt-1 font-medium">
                                {errors.buttonLink.message}
                            </p>
                        )}
                    </div>
                </div>

                {/* IMAGE */}
                <div className="space-y-2">
                    <Label className='mb-1'>Hình ảnh nền</Label>

                    {previewImage ? (
                        <div className="relative h-48 rounded-lg overflow-hidden border">
                            <img
                                src={previewImage}
                                alt="Preview"
                                className="h-full w-full object-cover"
                            />
                            <button
                                type="button"
                                onClick={() => setValue("backgroundImage", "")}
                                className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded"
                            >
                                Xóa
                            </button>
                        </div>
                    ) : (
                        <label className="border-2 border-dashed rounded-lg h-48 flex items-center justify-center cursor-pointer text-sm text-muted-foreground hover:bg-muted transition">
                            Nhấp để tải ảnh lên
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                            />
                        </label>
                    )}
                    {errors.backgroundImage && (
                        <p className="text-xs text-red-600 mt-1 font-medium">
                            {errors.backgroundImage.message}
                        </p>
                    )}
                </div>

                {/* ACTIONS */}
                <div className="flex justify-end gap-3 pt-2">
                    <Button
                        disabled={isSubmitting}
                        type="button"
                        variant="outline"
                        onClick={() => setOpenEditDialog(false)}
                    >
                        Hủy
                    </Button>
                    <Button
                        disabled={isSubmitting}
                        className="bg-orange-600 hover:bg-orange-700"
                    >
                        {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                </div>
            </form>
        </DialogContent>
    )
}

export default EditHero
