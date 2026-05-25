"use client";

import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { DiscountFormData, DiscountSchema } from "@/schemas/discount.schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { queryClient } from "@/components/QueryClientProviders";
import { updateDiscount } from "@/services/discount.service";
import { toast } from "sonner";
import { DiscountAdmin } from "@/types/discount";

interface EditDiscountProps {
    discount: DiscountAdmin;
    setOpenEditDialog: (open: boolean) => void;
    setSelectedDiscount: (discount: any | null) => void;
}

const EditDiscount = (props: EditDiscountProps) => {
    const { discount, setOpenEditDialog, setSelectedDiscount } = props;

    const form = useForm<DiscountFormData>({
        resolver: zodResolver(DiscountSchema),
        defaultValues: {
            code: "",
            image: "",
            name: "",
            description: "",
            type: "percentage",
            applyTo: "order",
            discountValue: 0,
            maxDiscountValue: 0,
            minOrderValue: 0,
            priority: "medium",
            startDate: "",
            endDate: "",
            userCondition: "all",
            maxUsageCount: 0,
            maxUsagePerUser: 1,
            stackable: false,
            isActive: true,
            isFeature: false,
            applyToAllCategories: true,
            applicableCategories: [],
            applicableProducts: [],
        },
    });

    const {
        control,
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        watch,
        reset,
    } = form;

    useEffect(() => {
        if (!discount) return;

        reset({
            code: discount.code,
            image: discount.image,
            name: discount.name,
            description: discount.description,
            type: discount.type,
            applyTo: "order",
            discountValue: discount.value,
            maxDiscountValue: discount.maxDiscountValue || 0,
            minOrderValue: discount.minOrderValue,
            priority: discount.priority,
            startDate: discount.startDate ? discount.startDate.split("T")[0] : "",
            endDate: discount.endDate ? discount.endDate.split("T")[0] : "",
            userCondition: discount.userCondition,
            maxUsageCount: discount.maxUsageCount,
            maxUsagePerUser: discount.maxUsagePerUser,
            stackable: discount.stackable,
            isActive: discount.isActive,
            isFeature: discount.isFeature,
            applyToAllCategories: true,
            applicableCategories: [],
            applicableProducts: [],
        });
    }, [discount, reset]);

    const selectedType = watch("type");

    const onSubmit = async (data: DiscountFormData) => {
        try {
            await updateDiscount(discount._id, data);
            setOpenEditDialog(false);
            setSelectedDiscount(null);
            queryClient.invalidateQueries({ queryKey: ["discounts-admin"] });
            reset();
            toast.success("Cập nhật khuyến mãi thành công!");
        } catch (error: any) {
            toast.error(error.message || "Đã có lỗi xảy ra khi cập nhật khuyến mãi! Vui lòng thử lại sau.");
        }
    };

    return (
        <DialogContent className="max-w-4xl sm:max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 bg-white dark:bg-gray-900 border shadow-2xl rounded-xl">
            <DialogHeader className="mb-6">
                <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                    Chỉnh sửa khuyến mãi
                </DialogTitle>
                <DialogDescription className="text-gray-500 dark:text-gray-400 mt-1.5">
                    Cập nhật chương trình khuyến mãi để thu hút khách hàng
                </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                    <Label className="font-medium">
                        Ảnh khuyến mãi <span className="text-red-500">*</span>
                    </Label>

                    <Controller
                        name="image"
                        control={control}
                        render={({ field }) => {
                            const preview =
                                field.value instanceof File
                                    ? URL.createObjectURL(field.value)
                                    : typeof field.value === "string" && field.value
                                        ? field.value
                                        : discount.image;

                            return (
                                <label
                                    htmlFor="image-upload"
                                    className={`relative flex aspect-video max-w-100 m-auto w-full cursor-pointer items-center justify-center rounded-md border-2 border-dashed transition hover:border-orange-500 ${errors.image ? "border-red-500" : "border-gray-300"}`}
                                >
                                    {preview ? (
                                        <img
                                            src={preview}
                                            alt="Preview"
                                            className="absolute inset-0 h-full w-full rounded-md object-cover"
                                        />
                                    ) : (
                                        <div className="text-center text-sm text-gray-500">
                                            <p className="font-medium">Click để chọn ảnh</p>
                                            <p className="text-xs">Tỉ lệ 16:9 (PNG, JPG, WEBP)</p>
                                        </div>
                                    )}

                                    <input
                                        id="image-upload"
                                        type="file"
                                        accept="image/png, image/jpeg, image/jpg, image/webp"
                                        className="hidden"
                                        onChange={(e) => field.onChange(e.target.files?.[0])}
                                    />
                                </label>
                            );
                        }}
                    />

                    {errors.image && <p className="text-xs font-medium text-red-600">{errors.image.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <Label htmlFor="type" className="font-medium">
                            Loại khuyến mãi <span className="text-red-500">*</span>
                        </Label>
                        <Controller
                            control={control}
                            name="type"
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger className="h-10 w-full">
                                        <SelectValue placeholder="Chọn loại khuyến mãi" />
                                    </SelectTrigger>
                                    <SelectContent position="popper" sideOffset={4}>
                                        <SelectItem value="percentage">Giảm theo phần trăm</SelectItem>
                                        <SelectItem value="fixed">Giảm theo số tiền cố định</SelectItem>
                                        <SelectItem value="shipping">Miễn phí vận chuyển</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="font-medium">
                            Tên khuyến mãi <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="Nhập tên khuyến mãi"
                            {...register("name")}
                            className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        {errors.name?.message && <p className="text-xs font-medium text-red-600 mt-1">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="code" className="font-medium">
                            Mã khuyến mãi <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="code"
                            type="text"
                            placeholder="VD: SUMMER2026"
                            {...register("code")}
                            className={errors.code ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        {errors.code?.message && <p className="text-xs font-medium text-red-600 mt-1">{errors.code.message}</p>}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description" className="font-medium">
                        Mô tả <span className="text-red-500">*</span>
                    </Label>
                    <textarea
                        id="description"
                        {...register("description")}
                        placeholder="Mô tả ngắn về chương trình khuyến mãi"
                        className={`min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none ${errors.description ? "border-red-500 focus-visible:ring-red-500" : "border-input"}`}
                    />
                    {errors.description?.message && <p className="text-xs font-medium text-red-600 mt-1">{errors.description.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <Label htmlFor="discountValue" className="font-medium">
                            {selectedType === "shipping" ? "Giá trị giảm phí vận chuyển" : "Giá trị giảm"}
                            <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="discountValue"
                            type="number"
                            min={0}
                            placeholder={selectedType === "shipping" ? "0 = miễn phí vận chuyển" : "Nhập giá trị"}
                            {...register("discountValue", { valueAsNumber: true })}
                            className={errors.discountValue ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        {selectedType === "shipping" ? (
                            <p className="text-xs text-amber-600">
                                0 = miễn phí vận chuyển, lớn hơn 0 = giảm phí vận chuyển.
                            </p>
                        ) : null}
                        {errors.discountValue?.message && (
                            <p className="text-xs font-medium text-red-600 mt-1">{errors.discountValue.message}</p>
                        )}
                    </div>

                    {selectedType === "percentage" && (
                        <div className="space-y-2">
                            <Label htmlFor="maxDiscountValue" className="font-medium">
                                Giảm tối đa (đ)
                            </Label>
                            <Input
                                id="maxDiscountValue"
                                type="number"
                                placeholder="Ví dụ: 50000 (0 = không giới hạn)"
                                {...register("maxDiscountValue", { valueAsNumber: true })}
                            />
                            <p className="text-xs text-amber-600">
                                Giá trị này không được lớn hơn giá trị đơn tối thiểu.
                            </p>
                            {errors.maxDiscountValue?.message && (
                                <p className="text-xs font-medium text-red-600 mt-1">{errors.maxDiscountValue.message}</p>
                            )}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <Label htmlFor="minOrderValue" className="font-medium">
                            Giá trị đơn tối thiểu (đ) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="minOrderValue"
                            type="number"
                            placeholder="0 = không giới hạn"
                            {...register("minOrderValue", { valueAsNumber: true })}
                            className={errors.minOrderValue ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        {errors.minOrderValue?.message && (
                            <p className="text-xs font-medium text-red-600 mt-1">{errors.minOrderValue.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="priority" className="font-medium">
                            Mức ưu tiên
                        </Label>
                        <Controller
                            control={control}
                            name="priority"
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger className="h-10 w-full">
                                        <SelectValue placeholder="Chọn mức ưu tiên" />
                                    </SelectTrigger>
                                    <SelectContent position="popper" sideOffset={4}>
                                        <SelectItem value="low">Thấp</SelectItem>
                                        <SelectItem value="medium">Trung bình</SelectItem>
                                        <SelectItem value="high">Cao</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <Label htmlFor="startDate" className="font-medium">
                            Ngày bắt đầu <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="startDate"
                            type="date"
                            {...register("startDate")}
                            className={errors.startDate ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        {errors.startDate?.message && (
                            <p className="text-xs font-medium text-red-600 mt-1">{errors.startDate.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="endDate" className="font-medium">
                            Ngày kết thúc <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="endDate"
                            type="date"
                            {...register("endDate")}
                            className={errors.endDate ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        {errors.endDate?.message && (
                            <p className="text-xs font-medium text-red-600 mt-1">{errors.endDate.message}</p>
                        )}
                    </div>

                    {/* <div className="space-y-2">
                        <Label htmlFor="userCondition" className="font-medium">
                            Điều kiện người dùng
                        </Label>
                        <Controller
                            control={control}
                            name="userCondition"
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger className="h-10 w-full">
                                        <SelectValue placeholder="Chọn điều kiện người dùng" />
                                    </SelectTrigger>
                                    <SelectContent position="popper" sideOffset={4}>
                                        <SelectItem value="all">Tất cả</SelectItem>
                                        <SelectItem value="logged_in">Người dùng đăng nhập</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div> */}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-end">
                    <div className="space-y-2">
                        <Label htmlFor="maxUsageCount" className="font-medium">
                            Giới hạn sử dụng tổng
                        </Label>
                        <Input
                            id="maxUsageCount"
                            type="number"
                            placeholder="0 = không giới hạn"
                            {...register("maxUsageCount", { valueAsNumber: true })}
                        />
                        <div className="text-xs text-orange-400">0 bằng không giới hạn</div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="maxUsagePerUser" className="font-medium">
                            Sử dụng tối đa / người dùng
                        </Label>
                        <Input
                            id="maxUsagePerUser"
                            type="number"
                            placeholder="0 = không giới hạn"
                            {...register("maxUsagePerUser", { valueAsNumber: true })}
                            className={errors.maxUsagePerUser ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        <div className="text-xs text-orange-400">0 bằng không giới hạn</div>
                        {errors.maxUsagePerUser?.message && (
                            <p className="text-xs font-medium text-red-600 mt-1">{errors.maxUsagePerUser.message}</p>
                        )}
                    </div>

                    <div className="flex items-center space-x-2 pb-2">
                        <input
                            type="checkbox"
                            id="stackable"
                            {...register("stackable")}
                            className="h-5 w-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <Label htmlFor="stackable" className="text-sm font-medium cursor-pointer">
                            Có thể kết hợp với khuyến mãi khác
                        </Label>
                    </div>
                </div>

                <div className="flex items-center space-x-3 pt-4 border-t">
                    {/* <div className="flex items-center gap-2.5">
                        <input
                            type="checkbox"
                            id="isActive"
                            {...register("isActive")}
                            className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <Label htmlFor="isActive" className="text-base font-medium cursor-pointer">
                            Kích hoạt ngay
                        </Label>
                    </div> */}
                    <div className="flex items-center gap-2.5">
                        <input
                            type="checkbox"
                            id="isFeature"
                            {...register("isFeature")}
                            className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <Label htmlFor="isFeature" className="text-base font-medium cursor-pointer">
                            Đánh dấu nổi bật
                        </Label>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-8 border-t mt-6">
                    <Button
                        disabled={isSubmitting}
                        variant="outline"
                        type="button"
                        onClick={() => {
                            setOpenEditDialog(false);
                            setSelectedDiscount(null);
                        }}
                        className="min-w-28"
                    >
                        Hủy
                    </Button>
                    <Button
                        disabled={isSubmitting}
                        type="submit"
                        className="min-w-28 bg-orange-600 hover:bg-orange-700 text-white transition-colors"
                    >
                        Cập nhật khuyến mãi
                    </Button>
                </div>
            </form>
        </DialogContent>
    );
};

export default EditDiscount;