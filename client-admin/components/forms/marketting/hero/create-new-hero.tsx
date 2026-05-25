import { queryClient } from '@/components/QueryClientProviders'
import { Button } from '@/components/ui/button'
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDateInput, formatDateTimeLocal } from '@/lib/utils'
import { HeroBanner, HeroBannerSchema } from '@/schemas/hero.schema'
import { createBanner } from '@/services/banner.service'
import { CreateNewBanner } from '@/types/banner'
import { zodResolver } from '@hookform/resolvers/zod'
import React, { use, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB (tuỳ bạn)

interface CreateNewHeroProps {
    setOpenDialog: React.Dispatch<React.SetStateAction<boolean>>;
}

const CreateNewHero = ({ setOpenDialog }: CreateNewHeroProps) => {
    const {
        register,
        handleSubmit,
        formState: { errors,isSubmitting },
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
    const onSubmit = async (data: HeroBanner) => {
        try {
            const payload: CreateNewBanner = {
                ...data,
            }
            const res = await createBanner(payload);
            if (res.success === true) {
                queryClient.invalidateQueries({ queryKey: ['hero-banners-admin'] });
                setOpenDialog(false);
                reset();
                toast.success("Thêm banner thành công!");
            }
        } catch (error) {
            console.error(error);
        }
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return

        const newImages = Array.from(files)
        let hasError = false

        for (const file of newImages) {
            if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
                setError("backgroundImage", {
                    type: "manual",
                    message: "Ảnh chỉ chấp nhận file PNG, JPG hoặc WEBP",
                })
                hasError = true
                break
            }

            if (file.size > MAX_FILE_SIZE) {
                setError("backgroundImage", {
                    type: "manual",
                    message: "Dung lượng ảnh tối đa 2MB",
                })
                hasError = true
                break
            }
        }

        if (hasError) {
            e.target.value = ""
            return
        }

        clearErrors("backgroundImage")

        setValue("backgroundImage", newImages[0], { shouldValidate: true })

        e.target.value = ""
    }

    const previewImage = watch("backgroundImage") && typeof watch("backgroundImage") !== "string"
        ? URL.createObjectURL(watch("backgroundImage") as File)
        : ''
    console.log(errors);

    return (
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Thêm banner mới</DialogTitle>
                <DialogDescription>
                    Tạo banner hiển thị trên trang chủ
                </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
                {/* ===== CONTENT ===== */}
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

                {/* ===== CTA ===== */}
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

                {/* ===== IMAGE ===== */}
                <div className="space-y-2">
                    <Label className='mb-1'>Hình ảnh nền</Label>

                    {watch("backgroundImage") ? (
                        <div className="relative h-48 rounded-lg overflow-hidden border">
                            <img
                                src={previewImage}
                                alt="Preview"
                                className="h-full m-auto object-cover"
                            />
                            <button
                                type="button"
                                onClick={() => setValue("backgroundImage", undefined)}
                                className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded"
                            >
                                Xóa
                            </button>
                        </div>
                    ) : (
                        <label className="border-2 border-dashed rounded-lg h-48 flex items-center justify-center cursor-pointer text-sm text-muted-foreground hover:bg-muted transition">
                            Nhấp để tải ảnh
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

                {/* ===== ACTIONS ===== */}
                <div className="flex justify-end gap-3 pt-2">
                    <Button
                        disabled={isSubmitting}
                        type="button"
                        variant="outline"
                        onClick={() => setOpenDialog(false)}
                    >
                        Hủy
                    </Button>
                    <Button disabled={isSubmitting} className="bg-orange-600 hover:bg-orange-700">
                        Thêm banner
                    </Button>
                </div>
            </form>
        </DialogContent>
    )
}

export default CreateNewHero
