"use client";

import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronsUpDown, X, } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useQuery } from "@tanstack/react-query";
import { getProductForSelect } from "@/services/product.service";
import useDebounce from "@/hooks/use-debounce";
import { ProductForSelect } from "@/types/product";
import { getCategoryForSelect } from "@/services/category.service";
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
    const [openProductsPopover, setOpenProductsPopover] = React.useState(false);
    const [searchProductQuery, setSearchProductQuery] = React.useState("");
    const [selectedProducts, setSelectedProducts] = React.useState<ProductForSelect[]>([]);
    const q = useDebounce(searchProductQuery, 300);
    const limit = 10
    const { data } = useQuery({
        queryKey: ["products-for-select", q, limit,],
        queryFn: () => getProductForSelect(q, limit, ""),
    });
    const { data: categoryOptions } = useQuery({
        queryKey: ["categories-for-select"],
        queryFn: () => getCategoryForSelect(),
    })
    const productOptions = data || [];
    const categories = categoryOptions || [];
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
            applicableCategories: [],
            applicableProducts: [],
            applyToAllCategories: false,
        },
    });

    const {
        control,
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        watch,
        setValue,
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
            applyTo: discount.applyTo,
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
            applicableCategories: discount.applicableCategories.map(cat => cat._id) || [],
            applicableProducts: discount.applicableProducts.map(p => p._id) || [],
            applyToAllCategories: discount.applyToAllCategories,
        });
        setSelectedProducts(discount.applicableProducts || []);
    }, [discount, reset]);

    const selectedType = watch("type");

    const onSubmit = async (data: DiscountFormData) => {
        try {
            await updateDiscount(discount._id, data);
            setOpenEditDialog(false);
            queryClient.invalidateQueries({ queryKey: ['discounts-admin'] });
            reset();
            toast.success("Cập nhật khuyến mãi thành công!");
        } catch (error: any) {
            toast.error(error.message || "Đã có lỗi xảy ra khi cập nhật khuyến mãi! Vui lòng thử lại sau.");
        }
    };


    const applicableProducts = watch("applicableProducts") || [];

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
                {/* Tên & Mã */}
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
                                    : discount.image;

                            return (
                                <label
                                    htmlFor="image-upload"
                                    className={`relative flex aspect-[16/9] max-w-[400px] m-auto w-full cursor-pointer
                                                                items-center justify-center rounded-md border-2 border-dashed
                                                                transition hover:border-orange-500
                                                                ${errors.image ? "border-red-500" : "border-gray-300"}`}
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
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            field.onChange(file)
                                        }}
                                    />
                                </label>
                            )
                        }}
                    />

                    {errors.image && (
                        <p className="text-xs font-medium text-red-600">
                            {errors.image.message}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <Label htmlFor="code" className="font-medium">
                            Mã giảm giá <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="code"
                            placeholder="VD: TET2026"
                            {...register("code", {
                                onChange: (e) => e.target.value.toUpperCase(),
                            })}
                            className={errors.code ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        {errors.code && <p className="text-xs font-medium text-red-600 mt-1">{errors.code.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name" className="font-medium">
                            Tên mã giảm giá <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            placeholder="Ví dụ: Tết 2026 - Giảm 30%"
                            {...register("name")}
                            className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        {errors.name && <p className="text-xs font-medium text-red-600 mt-1">{errors.name.message}</p>}
                    </div>
                </div>

                {/* Mô tả */}
                <div className="space-y-2">
                    <Label htmlFor="description" className="font-medium">
                        Mô tả <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                        id="description"
                        placeholder="Mô tả chi tiết về chương trình khuyến mãi..."
                        {...register("description")}
                        rows={3}
                        className={`resize-none ${errors.description ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    />
                    {errors.description && <p className="text-xs font-medium text-red-600 mt-1">{errors.description.message}</p>}
                </div>

                {/* Loại KM & Áp dụng cho */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <Label htmlFor="type" className="font-medium">
                            Loại khuyến mãi <span className="text-red-500">*</span>
                        </Label>
                        <Controller
                            control={control}
                            name="type"
                            render={({ field }) => (
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                >
                                    <SelectTrigger className="h-10 w-full">
                                        <SelectValue placeholder="Chọn loại khuyến mãi" />
                                    </SelectTrigger>
                                    <SelectContent position="popper" sideOffset={4}>
                                        <SelectItem value="percentage">Giảm theo phần trăm</SelectItem>
                                        <SelectItem value="fixed">Giảm theo số tiền cố định</SelectItem>
                                        <SelectItem value="shipping">Miễn phí vận chuyển</SelectItem>
                                        <SelectItem value="buy_x_get_y">Mua X tặng Y</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="applyTo" className="font-medium">
                            Áp dụng cho <span className="text-red-500">*</span>
                        </Label>
                        <Controller
                            control={control}
                            name="applyTo"
                            render={({ field }) => (
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                >
                                    <SelectTrigger className="h-10 w-full">
                                        <SelectValue placeholder="Chọn loại áp dụng" />
                                    </SelectTrigger>
                                    <SelectContent position="popper" sideOffset={4}>
                                        <SelectItem value="order">Đơn hàng</SelectItem>
                                        <SelectItem value="product">Sản phẩm</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />

                    </div>
                </div>

                {/* Giá trị giảm */}
                {selectedType !== "buy_x_get_y" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label htmlFor="discountValue" className="font-medium">
                                Giá trị giảm <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="discountValue"
                                type="number"
                                placeholder="Nhập giá trị"
                                {...register("discountValue", { valueAsNumber: true })}
                                className={errors.discountValue ? "border-red-500 focus-visible:ring-red-500" : ""}
                            />
                            {errors.discountValue && <p className="text-xs font-medium text-red-600 mt-1">{errors.discountValue.message}</p>}
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
                                    className="transition-all"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Các field còn lại tương tự */}
                {/* Đơn tối thiểu + Ưu tiên */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <Label htmlFor="minOrderValue" className="font-medium">
                            Giá trị đơn tối thiểu (đ)
                        </Label>
                        <Input
                            id="minOrderValue"
                            type="number"
                            placeholder="0 = không giới hạn"
                            {...register("minOrderValue", { valueAsNumber: true })}
                            className={errors.minOrderValue ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        {errors.minOrderValue && <p className="text-xs font-medium text-red-600 mt-1">{errors.minOrderValue.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="priority" className="font-medium">
                            Mức ưu tiên
                        </Label>
                        <Controller
                            control={control}
                            name="priority"
                            render={({ field }) => (
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                >
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

                {/* Ngày + Điều kiện user */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
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
                        {errors.startDate && <p className="text-xs font-medium text-red-600 mt-1">{errors.startDate.message}</p>}
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
                        {errors.endDate && <p className="text-xs font-medium text-red-600 mt-1">{errors.endDate.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="userCondition" className="font-medium">
                            Điều kiện người dùng
                        </Label>
                        <Controller
                            control={control}
                            name="userCondition"
                            render={({ field }) => (
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                >
                                    <SelectTrigger className="h-10 w-full">
                                        <SelectValue placeholder="Chọn điều kiện người dùng" />
                                    </SelectTrigger>
                                    <SelectContent position="popper" sideOffset={4}>
                                        <SelectItem value="all">Tất cả</SelectItem>
                                        <SelectItem value="new">Người dùng mới</SelectItem>
                                        <SelectItem value="vip">Người dùng VIP</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                </div>

                {/* Giới hạn + Stackable */}
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
                    {errors.maxUsagePerUser && <p className="text-xs font-medium text-red-600 mt-1">{errors.maxUsagePerUser.message}</p>}
                </div>

                {/* Danh mục & Sản phẩm - vẫn dùng state riêng hoặc tích hợp nếu cần */}
                {/* Để đơn giản, giữ nguyên logic cũ với setValue */}
                <div className={`grid grid-cols-1 ${watch("applyTo") === "product" && "lg:grid-cols-2"} gap-6`}>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between py-2">
                            <Label className="font-medium">Danh mục áp dụng</Label>
                            <div className="flex items-center gap-2">
                                <Controller
                                    control={control}
                                    name="applyToAllCategories"

                                    render={({ field }) => (
                                        <Checkbox
                                            id="select-all-categories"
                                            checked={field.value}
                                            onCheckedChange={(checked) => {
                                                field.onChange(checked);
                                                setValue("applicableCategories", []);
                                            }}
                                        />
                                    )}
                                />
                                <Label htmlFor="select-all-categories" className="text-sm font-medium cursor-pointer">
                                    Chọn tất cả
                                </Label>
                            </div>
                        </div>
                        <div className="border rounded-lg p-4 bg-muted/40 max-h-52 overflow-y-auto shadow-inner">
                            <div className="space-y-3">
                                {categories.map((cat) => (
                                    <div key={cat._id} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id={`cat-${cat._id}`}
                                            checked={(watch("applicableCategories") || []).includes(cat._id) || watch("applyToAllCategories")}
                                            onChange={(e) => {
                                                setValue("applyToAllCategories", false);
                                                const current = watch("applicableCategories") || [];
                                                const newCats = e.target.checked
                                                    ? [...current, cat._id]
                                                    : current.filter((c) => c !== cat._id);
                                                setValue("applicableCategories", newCats, { shouldValidate: true });
                                            }}
                                            className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                        />
                                        <Label htmlFor={`cat-${cat._id}`} className="ml-3 text-sm cursor-pointer">
                                            {cat.name}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    {
                        watch("applyTo") === "product" && (<div>
                            <Popover open={openProductsPopover} onOpenChange={setOpenProductsPopover}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between ">
                                        <span className="flex items-center gap-2 text-muted-foreground group-hover:text-white">
                                            {/* < className="h-4" /> */}
                                            {applicableProducts.length > 0 ? `Đã chọn ${applicableProducts.length} sản phẩm` : "Chọn sản phẩm áp dụng"}
                                        </span>
                                        <ChevronsUpDown className="h-4" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent sideOffset={4} className="p-0">
                                    <Command>
                                        <CommandInput placeholder="Tìm sản phẩm..." value={searchProductQuery} onValueChange={setSearchProductQuery} />
                                        <CommandList className="w-full">
                                            <CommandEmpty>Không có sản phẩm</CommandEmpty>
                                            <CommandGroup heading="Danh sách sản phẩm">
                                                {productOptions.map((product) => (
                                                    <CommandItem key={product._id} onSelect={() => {
                                                        const exists = applicableProducts.some((p) => p === product._id);
                                                        if (exists) {
                                                            setValue("applicableProducts", applicableProducts.filter((p) => p !== product._id));
                                                            setSelectedProducts(selectedProducts.filter((p) => p._id !== product._id));
                                                        }
                                                        else {
                                                            setValue("applicableProducts", [...applicableProducts, product._id]);
                                                            const selectedProduct = productOptions.find((p) => p._id === product._id);
                                                            if (selectedProduct) {
                                                                setSelectedProducts([...selectedProducts, selectedProduct]);
                                                            }
                                                        }
                                                    }}>
                                                        <div className="flex items-center gap-2">
                                                            <Checkbox checked={applicableProducts.some((p) => p === product._id)} />
                                                            <span className="line-clamp-1">{product.name}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            <div className="mt-3 space-y-2 max-h-52 overflow-y-auto">
                                {selectedProducts.map((product) => (
                                    <div key={product._id} className="flex items-center justify-between bg-orange-300/40 rounded-md px-3  py-2">
                                        <span className="text-sm">{product.name}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="rounded-full h-5 w-5 flex items-center justify-center"
                                            onClick={() => {
                                                setValue("applicableProducts", applicableProducts.filter((p) => p !== product._id));
                                                setSelectedProducts(selectedProducts.filter((p) => p._id !== product._id));
                                            }}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        )
                    }
                </div>

                {/* Kích hoạt */}
                <div className="flex items-center  space-x-3 pt-4 border-t">
                    <div className="flex items-center gap-2.5">
                        <input
                            type="checkbox"
                            id="isActive"
                            {...register("isActive")}
                            className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <Label htmlFor="isActive" className="text-base font-medium cursor-pointer">
                            Kích hoạt ngay
                        </Label>
                    </div>
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

                {/* Buttons */}
                <div className="flex justify-end gap-4 pt-8 border-t mt-6">
                    <Button disabled={isSubmitting} variant="outline" type="button" onClick={() => setOpenEditDialog(false)} className="min-w-28">
                        Hủy
                    </Button>
                    <Button disabled={isSubmitting} type="submit" className="min-w-28 bg-orange-600 hover:bg-orange-700 text-white transition-colors">
                        Cập nhật khuyến mãi
                    </Button>
                </div>
            </form>
        </DialogContent>
    );
}

export default EditDiscount
