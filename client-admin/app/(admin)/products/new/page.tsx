"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { ArrowLeft, Upload, X, AlertCircle, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation, useQuery } from "@tanstack/react-query"
import { getAllCategoriesForProduct } from "@/services/category.service"
import { getAllBrandsForProduct } from "@/services/brand.service"
import { ProductCategory } from "@/types/category"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Controller, useForm } from "react-hook-form"
import { ProductFormInput, ProductFormValues, productSchema } from "@/schemas/product.schema"
import { zodResolver } from "@hookform/resolvers/zod"
import { createProduct } from "@/services/product.service"
import { queryClient } from "@/components/QueryClientProviders"
import { toast } from "sonner"

const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"]
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB (tuỳ bạn)

const allergenOptions = [
  "Đậu phộng",
  "Sữa",
  "Trứng",
  "Cá",
  "Tôm",
  "Điều",
  "Lúa mạch",
  "Gluten",
]

export default function NewProductPage() {

  const { data: categories } = useQuery({
    queryKey: ["categories-for-select"],
    queryFn: getAllCategoriesForProduct,
  })

  const { data: brands } = useQuery({
    queryKey: ["brands-for-select"],
    queryFn: getAllBrandsForProduct,
  })

  const [historyCategory, setHistoryCategory] = useState<ProductCategory[]>([])
  const currentCategory = historyCategory.length > 0 ? historyCategory[historyCategory.length - 1] : null
  const [isOpenCategoryPopover, setIsOpenCategoryPopover] = useState(false)

  useEffect(() => {
    if (categories) {
      setHistoryCategory([
        {
          _id: "",
          name: "Root",
          slug: "",
          children: [...categories]
        }
      ])
    }
  }, [categories])

  const router = useRouter()
  const {
    control,
    register, handleSubmit: formHandleSubmit,
    setValue,
    watch,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      originalPrice: 0,
      category: { _id: "", name: "" },
      brand: { _id: "", name: "" },
      sku: "",
      weight: 0,
      unit: "g",
      expirationDate: undefined,
      ingredient: "",
      allergens: [],
      storageInstruction: "",
      origin: "",
      stock: 0,
      isFeatured: false,
      isActive: true,
      tags: "",
      images: [],
      importPrice: 0,
      isInitialStock: false,
      highlights: [],
      shortDescription: "",
    }
  })

  const createProductMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success("Tạo sản phẩm thành công");
      router.push('/admin/products');
    },
    onError: (error: any) => {
      toast.error(error.message || "Lỗi khi tạo sản phẩm");
      console.error("Lỗi khi tạo sản phẩm:", error.message || error);
    }
  })

  const handleSubmit = async (data: ProductFormInput) => {
    const payload = {
      ...data,
      category: data.category._id,
      brand: data.brand._id,
      expirationDate: data.expirationDate ? data?.expirationDate?.toISOString()?.split("T")[0] : undefined,
      highlights: data.highlights?.filter((item) => item.trim() !== ""), // Loại bỏ các ưu điểm rỗng
    }
    try {
      console.log(payload);

      await createProductMutation.mutateAsync(payload);
    }
    catch (error) {
      // Error handling is done in onError of the mutation
    }
  }

  const images = watch("images") || []

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newImages = Array.from(files)
    let hasError = false

    for (const file of newImages) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        setError("images", {
          type: "manual",
          message: "Ảnh chỉ chấp nhận file PNG, JPG hoặc WEBP",
        })
        hasError = true
        break
      }

      if (file.size > MAX_FILE_SIZE) {
        setError("images", {
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

    clearErrors("images")

    setValue("images", [...images, ...newImages], {
      shouldValidate: true,
    })

    e.target.value = ""
  }


  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index)
    setValue("images", updatedImages, { shouldValidate: true })
  }

  const toggleAllergen = (allergen: string) => {
    const currentAllergens = watch("allergens") || []
    if (currentAllergens.includes(allergen)) {
      // Remove allergen
      const updatedAllergens = currentAllergens.filter((a) => a !== allergen)
      setValue("allergens", updatedAllergens)
    } else {
      // Add allergen
      setValue("allergens", [...currentAllergens, allergen])
    }
  }

  console.log(errors);


  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-6" asChild>
          <Link href="/products">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại danh sách
          </Link>
        </Button>

        <form onSubmit={formHandleSubmit(handleSubmit)}>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {Object.keys(errors).length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Vui lòng kiểm tra lại các trường bắt buộc</AlertDescription>
                </Alert>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Thông tin cơ bản</CardTitle>
                  <CardDescription>Nhập thông tin chi tiết về sản phẩm</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Tên sản phẩm <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="VD: Snack khoai tây vị BBQ"
                      {...register("name")}
                      className={errors.name ? "border-destructive" : ""}
                    />
                    {errors.name && <p className="text-xs text-red-500 mt-1 font-medium">{errors.name.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shortDescription">
                      Mô tả ngắn
                    </Label>
                    <Textarea
                      id="shortDescription"
                      rows={2}
                      placeholder="Snack khoai tây giòn tan, hương BBQ đậm đà, phù hợp ăn vặt mỗi ngày..."
                      {...register("shortDescription")}
                    />
                    <p className="text-xs text-muted-foreground">
                      {watch("shortDescription")?.length || 0}/160
                    </p>
                    {
                      errors.shortDescription && (
                        <p className="text-xs text-red-500 mt-1 font-medium">
                          {errors.shortDescription.message}
                        </p>
                      )
                    }
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Ưu điểm nổi bật</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setValue("highlights", [...(watch("highlights") || []), ""])
                        }
                      >
                        + Thêm ưu điểm
                      </Button>
                    </div>

                    {(watch("highlights") || []).map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={item}
                          placeholder={`Ưu điểm ${index + 1}`}
                          onChange={(e) => {
                            const newList = [...(watch("highlights") || [])]
                            newList[index] = e.target.value
                            setValue("highlights", newList)
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newList = watch("highlights")?.filter((_, i) => i !== index)
                            setValue("highlights", newList)
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {errors.highlights && <p className="text-xs text-red-500 mt-1 font-medium">{errors.highlights.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Mô tả sản phẩm</Label>
                    <Textarea
                      id="description"
                      placeholder="Mô tả chi tiết về sản phẩm (tối đa 500 ký tự)..."
                      rows={4}
                      {...register("description")}
                    />
                    <p className="text-xs text-muted-foreground">{watch("description")?.length || 0}/500</p>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="space-y-2 w-full">
                      <Label htmlFor="category">
                        Danh mục <span className="text-destructive">*</span>
                      </Label>
                      <Popover open={isOpenCategoryPopover} onOpenChange={setIsOpenCategoryPopover}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between font-normal"
                          >
                            {watch("category")._id ? watch("category").name : <div className="text-muted-foreground font-normal">Chọn danh mục</div>}
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-full p-0">
                          <div className="max-h-60 overflow-y-auto">
                            {
                              historyCategory.length > 1 && (
                                <div className="border-b">
                                  <button
                                    className="w-full text-sm font-medium rounded flex items-center justify-between px-4 py-2 hover:bg-accent hover:text-accent-foreground"
                                    onClick={() => {
                                      setHistoryCategory((prev) => prev.slice(0, prev.length - 1));
                                    }}
                                  >
                                    <div className="flex items-center">
                                      <ArrowLeft className="mr-2 h-4 w-4" />
                                      {
                                        historyCategory[historyCategory.length - 1].name
                                      }
                                    </div>
                                  </button>
                                </div>
                              )
                            }
                            {currentCategory ? (
                              currentCategory.children.map((category) => (
                                <button
                                  style={{
                                    width: '200px'
                                  }}
                                  key={category._id}
                                  className="w-full text-sm font-medium rounded flex items-center justify-between px-4 py-2 hover:bg-accent hover:text-accent-foreground"
                                  onClick={() => {
                                    const isParent = category.children && category.children.length > 0;
                                    if (isParent) {
                                      setHistoryCategory((prev) => [...prev, category]);
                                    } else {
                                      setValue("category", {
                                        _id: category._id,
                                        name: category.name,
                                      });
                                      setHistoryCategory([{ _id: "", name: "Root", slug: "", children: categories || [] }]);
                                      setIsOpenCategoryPopover(false);
                                      clearErrors("category._id");
                                    }
                                  }}
                                >
                                  <div>{category.name}</div>
                                  {
                                    category.children && category.children.length > 0 && (
                                      <ChevronRight className="ml-2 h-4 w-4" />
                                    )
                                  }
                                </button>
                              ))
                            ) : (
                              <p className="p-4 text-sm text-muted-foreground">Không có danh mục nào</p>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                      {errors.category?._id && <p className="text-xs text-red-500 font-medium">{errors.category._id.message}</p>}
                    </div>

                    <div className="space-y-2 w-full">
                      <Label htmlFor="brand">
                        Thương hiệu <span className="text-destructive">*</span>
                      </Label>
                      <Controller
                        control={control}
                        name="brand"
                        render={({ field }) => (
                          <Select
                            onValueChange={(value) => {
                              const selectedBrand = brands?.find((brand) => brand._id === value)
                              if (selectedBrand) {
                                field.onChange({
                                  _id: selectedBrand._id,
                                  name: selectedBrand.name,
                                })
                              }
                            }}
                            value={field.value?._id || ""}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Chọn thương hiệu" />
                            </SelectTrigger>
                            <SelectContent position="popper" sideOffset={4}>
                              {brands && brands.length > 0 ? (
                                brands.map((brand) => (
                                  <SelectItem key={brand._id} value={brand._id}>
                                    {brand.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="none" disabled>
                                  Không có thương hiệu nào
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.brand?._id && <p className="text-xs text-red-500 mt-1 font-medium">{errors.brand._id?.message}</p>}
                    </div>
                    <div className="space-y-2 w-full">
                      <Label htmlFor="sku">Mã SKU</Label>
                      <Input
                        id="sku"
                        placeholder="VD: SNK-001"
                        {...register("sku")}
                      />
                    </div>


                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Hình ảnh sản phẩm</CardTitle>
                  <CardDescription>Thêm ít nhất 1 hình ảnh</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-4">
                      {images.map((image, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                          <img
                            src={image instanceof File ? URL.createObjectURL(image) : image}
                            alt={`Product ${index + 1}`}
                            className="object-cover w-full h-full"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      <label className={`border-2 border-dashed rounded-lg p-8 text-center flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-accent hover:text-accent-foreground`}>
                        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-4 hidden xl:block">Kéo thả hoặc click để tải hình ảnh lên</p>
                        <Input hidden type="file" accept="image/*" multiple onChange={handleImageUpload} className="max-w-xs mx-auto" />
                      </label>
                    </div>
                    {errors.images && <p className="text-xs text-red-500 mt-1 font-medium">{errors.images.message}</p>}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Thông tin thực phẩm</CardTitle>
                  <CardDescription>Thông tin dinh dưỡng, bảo quản</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">

                  <div className="space-y-2">
                    <Label htmlFor="ingredient">Thành phần (tối đa 300 ký tự)</Label>
                    <Textarea
                      id="ingredient"
                      placeholder="Nguyên liệu chính, phụ gia..."
                      rows={3}
                      {...register("ingredient")}
                    />
                    <p className="text-xs text-muted-foreground">{watch("ingredient")?.length || 0}/300</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Chứa chất gây dị ứng</Label>
                    <div className="flex flex-wrap gap-3">
                      {allergenOptions.map((allergen) => (
                        <label key={allergen} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={watch("allergens")?.includes(allergen)}
                            onChange={() => toggleAllergen(allergen)}
                            className="rounded"
                          />
                          <span className="text-sm">{allergen}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="storageInstruction">Hướng dẫn bảo quản</Label>
                      <Textarea
                        id="storageInstruction"
                        placeholder="Bảo quản ở nơi khô ráo, thoáng mát..."
                        rows={2}
                        {...register("storageInstruction")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="origin">Xuất xứ</Label>
                      <Input
                        id="origin"
                        placeholder="VD: Việt Nam"
                        {...register("origin")}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader className="flex items-center justify-between">
                  <CardTitle>Giá & Tồn kho</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium uppercase text-muted-foreground">Nhập kho</span>
                    <Controller
                      control={control}
                      name="isInitialStock"
                      render={({ field }) => (
                        <Switch
                          id="isInitialStock"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">
                      Giá bán <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      {...register("price", { valueAsNumber: true })}
                      className={errors.price ? "border-destructive" : ""}
                    />
                    {errors.price && <p className="text-xs text-red-500 mt-1 font-medium">{errors.price.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="originalPrice">Giá niêm yết</Label>
                    <Input
                      id="originalPrice"
                      type="number"
                      placeholder="0"
                      {...register("originalPrice", { valueAsNumber: true })}
                      className={errors.originalPrice ? "border-destructive" : ""}
                    />
                    {errors.originalPrice && <p className="text-xs text-red-500 mt-1 font-medium">{errors.originalPrice.message}</p>}
                  </div>
                  {watch("isInitialStock") && (
                    <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg space-y-4 animate-in fade-in zoom-in-95 duration-300">
                      <div className="space-y-2">
                        <Label htmlFor="importPrice" className="text-blue-700">Giá nhập thực tế <span className="text-destructive">*</span></Label>
                        <Input id="importPrice" type="number" placeholder="0" {...register("importPrice", { valueAsNumber: true })} className="bg-white border-blue-200" />
                        {errors.importPrice && <p className="text-xs text-red-500 mt-1 font-medium">{errors.importPrice.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="stock" className="text-blue-700">Số lượng nhập <span className="text-destructive">*</span></Label>
                        <Input id="stock" type="number" {...register("stock", { valueAsNumber: true })} className="bg-white border-blue-200" />
                        {errors.stock && <p className="text-xs text-red-500 mt-1 font-medium">{errors.stock.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="expirationDate" className="text-blue-700">Ngày hết hạn <span className="text-destructive">*</span></Label>
                        <Input
                          id="expirationDate"
                          type="date"
                          value={
                            watch("expirationDate")
                              ? watch("expirationDate")?.toISOString().split("T")[0]
                              : ""
                          }
                          onChange={(e) => {
                            const value = e.target.value
                            setValue(
                              "expirationDate",
                              value ? new Date(value) : undefined,
                              { shouldValidate: true }
                            )
                          }}
                          className="bg-white border-blue-200"
                        />

                        {errors.expirationDate && <p className="text-xs text-red-500 mt-1 font-medium">{errors.expirationDate.message}</p>}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Trọng lượng & Kích thước</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">
                      Trọng lượng <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="weight"
                        type="number"
                        {...register("weight", { valueAsNumber: true })}
                        className={errors.weight ? "border-destructive" : ""}
                      />
                      <Controller
                        control={control}
                        name="unit"
                        render={({ field }) => (
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue placeholder="Đơn vị" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="g">g</SelectItem>
                              <SelectItem value="kg">kg</SelectItem>
                              <SelectItem value="ml">ml</SelectItem>
                              <SelectItem value="l">l</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    {errors.weight && <p className="text-xs text-red-500 mt-1 font-medium">{errors.weight.message}</p>}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Trạng thái & Hiển thị</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="isActive">Hoạt động</Label>
                      <p className="text-xs text-muted-foreground">Hiển thị trên website</p>
                    </div>
                    <Controller
                      control={control}
                      name="isActive"
                      render={({ field }) => (
                        <Switch
                          id="isActive"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="isFeatured">Nổi bật</Label>
                      <p className="text-xs text-muted-foreground">Hiển thị trên trang chủ</p>
                    </div>
                    <Controller
                      control={control}
                      name="isFeatured"
                      render={({ field }) => (
                        <Switch
                          id="isFeatured"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="tags">Từ khóa (cách nhau bằng dấu phẩy)</Label>
                    <Textarea
                      id="tags"
                      placeholder="VD: snack, khoai tây, bổ sung năng lượng"
                      rows={2}
                      {...register("tags")}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <Button disabled={isSubmitting} type="submit" className="w-full" size="lg">
                  Tạo sản phẩm
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
