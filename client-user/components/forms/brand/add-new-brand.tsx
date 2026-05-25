import { queryClient } from '@/components/QueryClientProviders'
import { Button } from '@/components/ui/button'
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { brandSchema, BrandForm } from '@/schemas/brand.schema'
import { createBrand } from '@/services/brand.service'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { X } from 'lucide-react'
import React from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"]
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB (tuỳ bạn)

interface AddNewBrandProps {
    setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const AddNewBrand = (props: AddNewBrandProps) => {
    const { setDialogOpen } = props
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        watch,
        setValue,
        reset,
        control,
        setError,
        clearErrors
    } = useForm<BrandForm>({
        resolver: zodResolver(brandSchema),
        defaultValues: {
            name: "",
            logo: undefined,
            description: "",
            isActive: true,
        }
    })

    const createBrandMutation = useMutation({
        mutationFn: createBrand,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
            queryClient.invalidateQueries({ queryKey: ['brand-for-product'] });
            queryClient.invalidateQueries({ queryKey: ['brands-for-select'] });
            toast.success("Thêm thương hiệu thành công");
            setDialogOpen(false);
            reset();
        },
        onError: (error: any) => {
            toast.error(`Thêm thương hiệu thất bại: ${error.message || 'Lỗi không xác định'}`);
        }
    })
    const onSubmit = async (data: BrandForm) => {
        try {
            await createBrandMutation.mutateAsync(data);
        } catch (error) {
            // Error handling is done in onError of the mutation
        }
    }

    return (
        <DialogContent className="max-w-md">
            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogHeader>
                    <DialogTitle> Thêm thương hiệu</DialogTitle>
                    <DialogDescription>
                        Thêm một thương hiệu mới cho cửa hàng của bạn
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mb-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Tên thương hiệu *</Label>
                        <Input
                            id="name"
                            placeholder="VD: Oishi, Lay's..."
                            {...register("name")}
                        />
                        {errors.name && (<p className="text-xs font-medium text-red-500 mt-1">{errors.name.message}</p>)}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="logo">Logo thương hiệu</Label>

                        <div className="flex items-center gap-4">
                            {/* Preview */}
                            <div className="w-16 h-16 rounded-lg relative border bg-muted flex items-center justify-center overflow-hidden">
                                {watch("logo") instanceof File ? (
                                    <>
                                        <img
                                            src={URL.createObjectURL(watch("logo") as File)}
                                            alt="Logo preview"
                                            className="w-full h-full object-contain"
                                        />
                                        <button
                                            type="button"
                                            className="absolute top-1 right-1 bg-white rounded-full p-1 hover:bg-gray-200"
                                            onClick={() => {
                                                setValue("logo", undefined)
                                            }}
                                        >
                                            <X className="w-3 h-3 text-gray-600" />
                                        </button>
                                    </>
                                ) : (
                                    <span className="text-xs text-muted-foreground">
                                        No logo
                                    </span>
                                )}
                            </div>

                            {/* Input */}
                            <div className="flex-1">
                                <Input
                                    id="logo"
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) {
                                            if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
                                                setError("logo", { type: "manual", message: "Logo chỉ chấp nhận file PNG, JPG hoặc WEBP" })
                                                setValue("logo", undefined)
                                                return
                                            }
                                            if (file.size > MAX_FILE_SIZE) {
                                                setError("logo", { type: "manual", message: "Dung lượng logo tối đa 2MB" })
                                                setValue("logo", undefined)
                                                return
                                            }
                                            clearErrors("logo")
                                            setValue("logo", file, { shouldValidate: true })
                                        }
                                    }}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Chỉ nhận PNG, JPG hoặc WEBP (tối đa 2MB)
                                </p>

                                {errors.logo && (
                                    <p className="text-xs font-medium text-red-500 mt-1">
                                        {errors.logo.message as string}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Mô tả</Label>
                        <Textarea
                            id="description"
                            placeholder="Mô tả thương hiệu..."
                            rows={3}
                            {...register("description")}
                        />
                        {errors.description && (<p className="text-xs font-medium text-red-500 mt-1">{errors.description.message}</p>)}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <Label htmlFor="active">Hoạt động</Label>
                        <Controller
                            control={control}
                            name="isActive"
                            render={({ field }) => (
                                <Switch
                                    id="active"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            )}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button disabled={isSubmitting} type='button' variant="outline" onClick={() => setDialogOpen(false)} className="bg-transparent">
                        Hủy
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        Thêm thương hiệu
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    )
}

export default AddNewBrand