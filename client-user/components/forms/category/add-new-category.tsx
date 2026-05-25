import { queryClient } from '@/components/QueryClientProviders'
import { Button } from '@/components/ui/button'
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { CategoryForm, categorySchema } from '@/schemas/category.schema'
import { createCategory } from '@/services/category.service'
import { Category } from '@/types/category'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Upload, X } from 'lucide-react'
import React, { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

interface AddNewCategoryProps {
    setIsAddDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
    categories: Category[]
}

const AddNewCategory = ({ setIsAddDialogOpen, categories }: AddNewCategoryProps) => {
    const {
        register, handleSubmit,
        formState: { errors, isSubmitting },
        watch, reset,
        setError, clearErrors, setValue,
        control
    } = useForm<CategoryForm>({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            name: "",
            description: "",
            parent: "none",
            isActive: true,
            isFeatured: false,
            order: 1,
            image: undefined,
        },
    })
    const createCategoryMutation = useMutation({
        mutationFn: createCategory,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
            toast.success("Tạo danh mục thành công");
            reset();
            setIsAddDialogOpen(false);
        },
        onError: (error: any) => {
            toast.error(error.message || "Tạo danh mục thất bại! Vui lòng thử lại.");
        }
    });
    const onSubmit = async (data: CategoryForm) => {
        const payload = {
            ...data,
            parent: data.parent === "none" ? null : data.parent
        };
        try {
            await createCategoryMutation.mutateAsync(payload);
        } catch (error) {
            console.error("Error creating category:", error);
        }
    }
    const previewImage = watch("image") instanceof File ? URL.createObjectURL(watch("image")) : null;
    
    return (
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogHeader>
                    <DialogTitle>Thêm danh mục mới</DialogTitle>
                    <DialogDescription>Tạo danh mục mới để phân loại sản phẩm trong cửa hàng</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                    <div className="w-full">
                        <Label className='mb-2'>Tên danh mục *</Label>
                        <Input
                            placeholder="Nhập tên danh mục"
                            {...register("name")}
                        />
                        {errors.name && (<p className="text-xs font-medium text-red-500 mt-1">{errors.name.message}</p>)}
                    </div>
                    <div>
                        <Label className='mb-2'>Mô tả</Label>
                        <Textarea
                            placeholder="Mô tả ngắn về danh mục..."
                            {...register("description")}
                            rows={3}
                        />
                        {errors.description && (<p className="text-xs font-medium text-red-500 mt-1">{errors.description.message}</p>)}
                    </div>
                    <div className='grid grid-cols-2 gap-2'>
                        <div>
                            <Label className='mb-2'>Danh mục cha</Label>
                            <Controller
                                control={control}
                                name="parent"
                                render={({ field }) => (
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value || undefined}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Chọn danh mục cha" />
                                        </SelectTrigger>
                                        <SelectContent position="popper" sideOffset={4}>
                                            <SelectItem value={"none"}>Không có</SelectItem>
                                            {categories.map((category) => (
                                                <SelectItem key={category._id} value={category._id}>{category.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.parent && (<p className="text-xs font-medium text-red-500 mt-1">{errors.parent.message}</p>)}
                        </div>
                        <div>
                            <Label className='mb-2'>Số thứ tự</Label>
                            <Input
                                type="number"
                                placeholder="1"
                                {...register("order", { valueAsNumber: true })}
                            />
                            {errors.order && (<p className="text-xs font-medium text-red-500 mt-1">{errors.order.message}</p>)}
                        </div>
                    </div>
                    <div>
                        <Label className='mb-2'>Hình ảnh</Label>
                        {
                            previewImage ? (
                                <div className="m-auto w-36 border relative">
                                    <img src={previewImage} alt="Preview" className="w-full aspect-square object-cover rounded-md" />
                                    <button
                                        type="button"
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                        onClick={() => {
                                            setValue("image", undefined);
                                        }
                                        }
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ) :
                                <label className="block mt-2 border-2 border-dashed rounded-lg p-6 text-center hover:border-orange-500/50 transition-colors cursor-pointer">
                                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                    <p className="text-sm text-muted-foreground">Kéo thả hoặc click để tải ảnh lên</p>
                                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG tối đa 2MB</p>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                if (file.type !== "image/png" && file.type !== "image/jpeg" && file.type !== "image/jpg" && file.type !== "image/webp") {
                                                    setError("image", { type: "manual", message: "Chỉ chấp nhận file ảnh PNG, JPG" });
                                                    return;
                                                }
                                                if (file.size > 2 * 1024 * 1024) {
                                                    setError("image", { type: "manual", message: "Kích thước file không được vượt quá 2MB" });
                                                    return;
                                                }
                                                clearErrors("image");
                                                setValue("image", file);
                                            }
                                        }}
                                    />
                                </label>
                        }
                        {errors.image && (<p className="text-xs font-medium text-red-500 mt-1">{String(errors.image.message)}</p>)}
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                            <p className="font-medium">Hiển thị danh mục</p>
                            <p className="text-sm text-muted-foreground">Danh mục sẽ xuất hiện trên trang web</p>
                        </div>
                        <Controller
                            name="isActive"
                            control={control}
                            render={({ field }) => (
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            )}
                        />
                        {errors.isActive && (<p className="text-xs font-medium text-red-500 mt-1">{errors.isActive.message}</p>)}
                    </div>
                </div>
                <DialogFooter className='mt-4'>
                    <Button disabled={isSubmitting} variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Hủy
                    </Button>
                    <Button disabled={isSubmitting} className="bg-orange-500 text-white hover:bg-orange-500/90">
                        Thêm danh mục
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    )
}

export default AddNewCategory