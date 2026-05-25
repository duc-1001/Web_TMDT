"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Wallet, Building2, MapPin, Phone, Mail, User, Tag, ShoppingBag, Loader2, } from "lucide-react"
import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { useSelector } from "react-redux"
import { RootState } from "@/store/store"
import { useQuery } from "@tanstack/react-query"
import { calculateCartPricing, getCart, getGuestCart, removeDiscountFromCart } from "@/services/cart.service"
import { getProductBySlug } from "@/services/product.service"
import { getProvinces, Province, Ward, getWardsByProvince } from "@/lib/address"
import { formatPrice } from "@/lib/utils"
import { Controller, useForm } from "react-hook-form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod/dist/zod.js"
import { ScrollArea } from "@/components/ui/scroll-area"
import AddressSelection from "@/components/checkout/address-selection"
import { toast } from "sonner"
import DiscountSelection from "@/components/checkout/discount-selection"
import { queryClient } from "@/components/QueryClientProviders"
import ApplyDiscountCard from "@/components/checkout/apply-discount-card"
import { OrderPayload } from "@/types/order"
import { createOrder } from "@/services/order.service"
import { useCartActions } from "@/hooks/use-cart-actions"
import { useRouter, useSearchParams } from "next/navigation"

const inforUserSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Họ và tên phải có ít nhất 2 ký tự")
    .regex(/[a-zA-ZÀ-ỹ]/, "Họ và tên không được chỉ chứa số"),

  phone: z
    .string()
    .trim()
    .regex(/^(0|\+84)[0-9]{9}$/, "Số điện thoại không hợp lệ"),

  email: z
    .string()
    .trim()
    .email("Email không hợp lệ"),

  address: z
    .string()
    .trim()
    .min(5, "Địa chỉ giao hàng phải có ít nhất 5 ký tự"),

  province: z.object({
    code: z
      .string()
      .trim()
      .min(1, "Vui lòng chọn tỉnh/thành phố"),
    name: z
      .string()
      .trim()
      .min(1),
  }),

  ward: z.object({
    code: z
      .string()
      .trim()
      .min(1, "Vui lòng chọn phường/xã"),
    name: z
      .string()
      .trim()
      .min(1),
  }),

  note: z
    .string()
    .trim()
    .max(500, "Ghi chú không được quá 500 ký tự")
    .optional(),
})

export type InforUserCheckout = z.infer<typeof inforUserSchema>

export default function CheckoutPage() {
  const params = useSearchParams()
  const router = useRouter()

  // URL params for direct ("Mua ngay") checkout
  const directSlug = params.get("direct")   // slug of the product
  const directQty = Math.max(1, Number(params.get("qty")) || 1)
  const selectedItemIds = useMemo(
    () =>
      params
        .get("items")
        ?.split(",")
        .map((itemId) => itemId.trim())
        .filter(Boolean) || [],
    [params]
  )

  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth)
  const { removeMultipleItems } = useCartActions(isAuthenticated)
  const cartQueryKey = isAuthenticated ? ['user-cart'] : ['guest-cart']

  // Fetch product when doing direct checkout (Mua ngay)
  const { data: directProduct, isLoading: isLoadingDirectProduct } = useQuery({
    queryKey: directSlug ? ["product-details", directSlug] : ["product-details", "none"],
    queryFn: () => directSlug ? getProductBySlug(directSlug) : Promise.resolve(null as any),
    enabled: !!directSlug,
  })

  const { data, isLoading } = useQuery({
    queryKey: cartQueryKey,
    queryFn: () => {
      if (isAuthenticated) {
        return getCart()
      }
      else {
        const items = JSON.parse(localStorage.getItem("guest-cart") || "[]")
        return getGuestCart(items)
      }
    },
    // Only fetch cart when NOT in direct-checkout mode
    enabled: !directSlug,
  })

  const checkoutItems = useMemo(() => {
    // Direct checkout: build item from authoritative product data
    if (directSlug) {
      if (!directProduct) return []
      return [
        {
          productId: directProduct._id,
          name: directProduct.name,
          price: directProduct.price,
          quantity: directQty,
          image: directProduct.images?.[0]?.url || "/placeholder.svg",
          availableStock: directProduct.stock,
          isOutOfStock: directProduct.stock <= 0,
        },
      ]
    }

    // Cart checkout
    if (!data) return []
    if (selectedItemIds.length > 0) {
      return data.items.filter((item) => selectedItemIds.includes(item.productId))
    }
    return data.items
  }, [data, directSlug, directQty, directProduct, selectedItemIds])


  const [showAddressDialog, setShowAddressDialog] = useState(false)
  const [showDiscountDialog, setShowDiscountDialog] = useState(false)
  const [provinces, setProvinces] = useState<Province[]>([])
  const [wards, setWards] = useState<Ward[]>([])


  useEffect(() => {
    getProvinces().then(setProvinces)
  }, [])

  const {
    register,
    control,
    formState: { errors },
    resetField,
    reset,
    watch,
    handleSubmit,
  } = useForm<InforUserCheckout>({
    resolver: zodResolver(inforUserSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      address: "",
      province: { code: "", name: "" },
      ward: { code: "", name: "" },
      note: "",
    },
  })
  const provinceCode = Number(watch("province")?.code) || 0
  const wardCode = Number(watch("ward")?.code) || 0

  const { data: discountData, isLoading: isLoadingDiscount } = useQuery({
    queryKey: ["cart-pricing", wardCode, checkoutItems],
    queryFn: () => {
      const items = checkoutItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      }))
      const discounts = isAuthenticated ? [] : (JSON.parse(localStorage.getItem("guest-discounts") || "[]") as string[]);
      return calculateCartPricing(items, discounts, { provinceCode: Number(provinceCode), wardCode: Number(wardCode) })
    },
  })

  const addresses = user?.addresses || []
  const subtotal = discountData?.subtotal || 0
  const total = discountData?.totalPrice || 0
  const appliedDiscounts = discountData?.appliedDiscounts || []
  const shipping = (discountData?.shippingFee || 0) - (discountData?.shippingDiscount || 0)

  useEffect(() => {
    if (!isAuthenticated || !user) return

    const defaultAddress = user.addresses.find(address => address.isDefault) || user.addresses[0]
    if (defaultAddress) {
      reset({
        fullName: defaultAddress.receiver,
        phone: defaultAddress.phone,
        email: user?.email || "",
        address: defaultAddress.street,
        province: defaultAddress.province,
        ward: defaultAddress.ward,
        note: "",
      })
      getWardsByProvince(Number(defaultAddress.province.code)).then(setWards)
    }
  }, [addresses, reset])

  const handleRemoveDiscount = async (code: string) => {
    if (!isAuthenticated) {
      const discounts = localStorage.getItem("guest-discounts") ? new Set(JSON.parse(localStorage.getItem("guest-discounts") || "[]")) : new Set<string>();
      discounts.delete(code);
      localStorage.setItem("guest-discounts", JSON.stringify(Array.from(discounts)));
    }
    else {
      await removeDiscountFromCart(code, checkoutItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      })))
    }
    queryClient.invalidateQueries({ queryKey: ["cart-pricing"], exact: false });
  }

  const handleSelectAddress = (address: any) => {
    reset({
      fullName: address.receiver,
      phone: address.phone,
      email: user?.email || "",
      address: address.street,
      province: address.province,
      ward: address.ward,
      note: "",
    })
    getWardsByProvince(Number(address.province.code)).then(setWards)
    setShowAddressDialog(false)
  }
  const [paymentMethod, setPaymentMethod] = useState<"banking" | "cod" | "momo">("cod")
  const [isProcessing, setIsProcessing] = useState(false)

  const handlePlaceOrder = async (data: InforUserCheckout) => {
    const purchasedProductIds = directSlug
      ? []
      : checkoutItems.map((item) => item.productId)

    const payload: OrderPayload = {
      items: checkoutItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      couponCodes: appliedDiscounts.map((discount) => discount.code),
      shippingAddress: {
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        address: data.address,
        province: data.province,
        ward: data.ward,
        note: data.note,
      },
      paymentMethod: paymentMethod,
    }

    try {
      setIsProcessing(true)
      const response = await createOrder(payload)

      if (!response?.orderCode) {
        toast.error("Đặt hàng thất bại. Không lấy được mã đơn hàng.")
        return
      }

      const orderCode = response.orderCode
      toast.success("Đặt hàng thành công!")

      if (!directSlug && purchasedProductIds.length > 0) {
        if (isAuthenticated) {
          removeMultipleItems(purchasedProductIds, true).catch(console.error)
        } else {
          const guestCart = JSON.parse(localStorage.getItem("guest-cart") || "[]") as Array<{
            productId: string
            quantity: number
          }>

          const remainingCart = guestCart.filter(
            (item) => !purchasedProductIds.includes(item.productId)
          )

          localStorage.setItem("guest-cart", JSON.stringify(remainingCart))
          localStorage.removeItem("guest-discounts")
        }
        
        // Invalidate queries in background
        queryClient.invalidateQueries({ queryKey: cartQueryKey })
        queryClient.invalidateQueries({ queryKey: ["cart-pricing"], exact: false })
      }

      router.push(`/order-success/${orderCode}`)

    } catch (error: any) {
      if (error?.code === "INSUFFICIENT_STOCK") {
        toast.error(error?.message || "Sản phẩm không đủ số lượng. Vui lòng kiểm tra lại.")
        // Refetch cart to get updated stock
        queryClient.invalidateQueries({ queryKey: cartQueryKey })
        return
      }
      if (error?.code) {
        toast.error(error?.message || `Đặt hàng thất bại với mã lỗi: ${error.code}`)
        await handleRemoveDiscount(error.code)
        return
      }
      toast.error(error?.message || "Đặt hàng thất bại. Vui lòng thử lại sau.")
    }
    finally {
      setIsProcessing(false)
    }
  }

  const hasInvalidItem = checkoutItems.some(
    item => item.isOutOfStock || item.quantity > item.availableStock
  )

  const isLoadingAny = directSlug ? isLoadingDirectProduct : isLoading

  if (!isLoadingAny && checkoutItems.length === 0) {
    return (
      <div className="min-h-[400px] bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-semibold">Không có sản phẩm để thanh toán</h1>
              <p className="text-sm text-muted-foreground">
                Giỏ hàng của bạn đang trống hoặc không còn sản phẩm hợp lệ.
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button asChild variant="outline">
                <Link href="/cart">Quay lại giỏ hàng</Link>
              </Button>
              <Button asChild>
                <Link href="/products" className="text-white">Mua sắm tiếp</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Thanh toán</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link href="/" className="hover:text-orange-500">
                  Trang chủ
                </Link>
                <span>/</span>
                <Link href="/cart" className="hover:text-orange-500">
                  Giỏ hàng
                </Link>
                <span>/</span>
                <span className="text-foreground">Thanh toán</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: cartQueryKey })
                }}
                className="mt-3"
              >
                🔄 Kiểm tra lại tồn kho
              </Button>
            </div>

            <form onSubmit={handleSubmit(handlePlaceOrder)} className="space-y-8">
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  {/* Shipping Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-orange-500" />
                          Thông tin giao hàng
                        </div>
                        {
                          isAuthenticated &&
                          <div onClick={() => {
                            if (!isAuthenticated) return
                            setShowAddressDialog(true)
                          }} className="text-sm text-orange-600 underline cursor-pointer">
                            Sử dụng địa chỉ đã lưu
                          </div>
                        }
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="fullName">
                            Họ và tên <span className="text-destructive">*</span>
                          </Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="fullName" placeholder="Nguyễn Văn A" className="pl-10" required {...register("fullName")} />
                          </div>
                          {errors.fullName && (<p className="text-xs font-medium text-red-500 mt-1">{errors.fullName.message}</p>)}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">
                            Số điện thoại <span className="text-destructive">*</span>
                          </Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="phone" type="tel" placeholder="0912 345 678" className="pl-10" required {...register("phone")} />
                          </div>
                          {errors.phone && (<p className="text-xs font-medium text-red-500 mt-1">{errors.phone.message}</p>)}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input id="email" type="email" placeholder="nguyenvana@email.com" className="pl-10" required {...register("email")} />
                          {errors.email && (<p className="text-xs font-medium text-red-500 mt-1">{errors.email.message}</p>)}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">

                        {/* Province */}
                        <div>
                          <Label className="mb-3">Tỉnh / Thành phố <span className="text-destructive">*</span></Label>
                          <Controller
                            control={control}
                            name="province"
                            render={({ field }) => (
                              <Select
                                value={field.value?.code ? String(field.value.code) : undefined}
                                onValueChange={(value) => {
                                  const p = provinces.find(province => province.code === Number(value));
                                  console.log(p);

                                  if (p) {
                                    field.onChange({ code: String(p.code), name: p.name });
                                    getWardsByProvince(Number(p.code)).then(setWards);
                                    resetField("ward");
                                  }
                                }}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Chọn tỉnh / thành phố" />
                                </SelectTrigger>
                                <SelectContent position="popper" sideOffset={4}>
                                  <ScrollArea className="h-48">
                                    {provinces.map((p) => (
                                      <SelectItem key={p.code} value={String(p.code)}>
                                        {p.name}
                                      </SelectItem>
                                    ))}
                                  </ScrollArea>
                                </SelectContent>
                              </Select>
                            )}
                          />
                          {errors.province?.code?.message && (<p className="text-xs font-medium text-red-500 mt-1">{errors.province.code.message}</p>)}
                        </div>


                        {/* Ward */}
                        <div>
                          <Label className="mb-3">Phường / Xã <span className="text-destructive">*</span></Label>
                          <Controller
                            control={control}
                            name="ward"
                            render={({ field }) => (
                              <Select
                                value={field.value?.code ? String(field.value.code) : undefined}
                                onValueChange={(value) => {
                                  const w = wards.find(ward => ward.code === Number(value));
                                  if (w) {
                                    field.onChange({ code: String(w.code), name: w.name });
                                  }
                                }}
                                disabled={!wards.length}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Chọn phường / xã" />
                                </SelectTrigger>
                                <SelectContent position="popper" sideOffset={4}>
                                  <ScrollArea className="h-48">
                                    {wards.map((w) => (
                                      <SelectItem key={w.code} value={String(w.code)}>
                                        {w.name}
                                      </SelectItem>
                                    ))}
                                  </ScrollArea>
                                </SelectContent>
                              </Select>
                            )}
                          />
                          {errors.ward?.code?.message && (<p className="text-xs font-medium text-red-500 mt-1">{errors.ward.code.message}</p>)}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address">
                          Địa chỉ giao hàng <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="address"
                          placeholder="Số nhà, tên đường"
                          required
                          {...register("address")}
                        />
                        {errors.address && (<p className="text-xs font-medium text-red-500 mt-1">{errors.address.message}</p>)}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="note">Ghi chú đơn hàng (tùy chọn)</Label>
                        <Textarea {...register("note")} id="note" placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi giao..." rows={2} />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment Method */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-orange-500" />
                        Phương thức thanh toán
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as "banking" | "cod" | "momo")} className="space-y-3">
                        <div className="flex items-start space-x-3 border-2 rounded-lg p-4 hover:border-orange-500/50 transition-colors has-[:checked]:border-orange-500 has-[:checked]:bg-orange-600/5">
                          <RadioGroupItem value="cod" id="cod" />
                          <Label htmlFor="cod" className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-3 mb-1">
                              <div className="w-10 h-10 rounded-lg bg-orange-600/10 flex items-center justify-center">
                                <Wallet className="h-5 w-5 text-orange-500" />
                              </div>
                              <div>
                                <div className="font-semibold">Thanh toán khi nhận hàng (COD)</div>
                                <div className="text-sm text-muted-foreground">
                                  Thanh toán bằng tiền mặt khi nhận hàng
                                </div>
                              </div>
                            </div>
                          </Label>
                        </div>

                        {/* <div className="flex items-start space-x-3 border-2 rounded-lg p-4 hover:border-orange-500/50 transition-colors has-[:checked]:border-orange-500 has-[:checked]:bg-orange-600/5">
                          <RadioGroupItem value="momo" id="momo" />
                          <Label htmlFor="momo" className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-3 mb-1">
                              <div className="w-10 h-10 rounded-lg bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center">
                                <span className="text-xl">💰</span>
                              </div>
                              <div>
                                <div className="font-semibold">Ví MoMo</div>
                                <div className="text-sm text-muted-foreground">Thanh toán qua ví điện tử MoMo</div>
                              </div>
                            </div>
                          </Label>
                        </div> */}

                        {/* <div className="flex items-start space-x-3 border-2 rounded-lg p-4 hover:border-orange-500/50 transition-colors has-[:checked]:border-orange-500 has-[:checked]:bg-orange-600/5">
                          <RadioGroupItem value="banking" id="banking" />
                          <Label htmlFor="banking" className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-3 mb-1">
                              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <div className="font-semibold">Chuyển khoản ngân hàng</div>
                                <div className="text-sm text-muted-foreground">Chuyển khoản qua Internet Banking</div>
                              </div>
                            </div>
                          </Label>
                        </div> */}

                        <div className="flex items-start space-x-3 border-2 rounded-lg p-4 hover:border-orange-500/50 transition-colors has-[:checked]:border-orange-500 has-[:checked]:bg-orange-600/5">
                          <RadioGroupItem value="vnpay" id="vnpay" />
                          <Label htmlFor="vnpay" className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-3 mb-1">
                              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <div className="font-semibold">VN Pay</div>
                                <div className="text-sm text-muted-foreground">Chuyển khoản qua VN Pay</div>
                              </div>
                            </div>
                          </Label>
                        </div>

                        {/* <div className="flex items-start space-x-3 border-2 rounded-lg p-4 hover:border-orange-500/50 transition-colors has-[:checked]:border-orange-500 has-[:checked]:bg-orange-600/5">
                          <RadioGroupItem value="card" id="card" />
                          <Label htmlFor="card" className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-3 mb-1">
                              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                                <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                              </div>
                              <div>
                                <div className="font-semibold">Thẻ tín dụng/ghi nợ</div>
                                <div className="text-sm text-muted-foreground">
                                  Visa, Mastercard, JCB, American Express
                                </div>
                              </div>
                            </div>
                          </Label>
                        </div> */}
                      </RadioGroup>
                    </CardContent>
                  </Card>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                  <Card className="sticky top-32 lg:max-w-[420px] w-full">
                    <CardHeader>
                      <CardTitle>Đơn hàng của bạn</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className=" max-h-64 overflow-y-auto -mx-2 px-2 space-y-3">
                        {checkoutItems.map((item) => {
                          const isOutOfStock = item.isOutOfStock
                          const insufficient = item.quantity > item.availableStock

                          return (
                            <div
                              key={item.productId}
                              className={`flex gap-3 p-2 rounded-lg transition ${isOutOfStock
                                ? "bg-red-50 border border-red-200"
                                : insufficient
                                  ? "bg-yellow-50 border border-yellow-200"
                                  : ""
                                }`}
                            >
                              {/* IMAGE */}
                              <div className="relative w-16 h-16 rounded-lg flex-shrink-0 ">
                                <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden">
                                  <img
                                    src={item.image || "/placeholder.svg"}
                                    alt={item.name}
                                    className={`h-full m-auto object-cover ${isOutOfStock ? "opacity-50 grayscale" : ""
                                      }`}
                                  />
                                </div>

                                <Badge className="absolute z-20 -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                                  {item.quantity}
                                </Badge>

                                {isOutOfStock && (
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-[10px] text-white font-semibold">
                                    Hết
                                  </div>
                                )}
                              </div>

                              {/* INFO */}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm line-clamp-2 mb-1">
                                  {item.name}
                                </h4>

                                <p className="text-sm font-semibold text-orange-500">
                                  {formatPrice(item.price)}
                                </p>

                                {/* STOCK STATUS */}
                                {isOutOfStock && (
                                  <p className="text-xs text-red-600 mt-1">
                                    Sản phẩm đã hết hàng
                                  </p>
                                )}

                                {!isOutOfStock && insufficient && (
                                  <p className="text-xs text-yellow-600 mt-1">
                                    Chỉ còn {item.availableStock} sản phẩm
                                  </p>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <Button
                          type="button"
                          onClick={() => setShowDiscountDialog(true)}
                          variant="ghost"
                          className="w-full justify-start text-muted-foreground text-xs h-8 bg-transparent"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          Xem mã khuyến mãi
                        </Button>
                        <DiscountSelection
                          showDiscountDialog={showDiscountDialog}
                          setShowDiscountDialog={setShowDiscountDialog}
                          subtotal={subtotal}
                          provinceCode={Number(provinceCode)}
                          wardCode={Number(wardCode)}
                        />
                      </div>

                      <Separator />

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tạm tính</span>
                          {isLoadingDiscount ? (
                            <span className="font-medium">----</span>
                          ) :
                            <span className="font-medium">{formatPrice(subtotal)}</span>
                          }
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Phí vận chuyển</span>
                          {
                            isLoadingDiscount || !watch("ward.code") ? (
                              <span className="font-medium">----</span>
                            ) :
                              <span className="font-medium">{shipping === 0 ? "Miễn phí" : formatPrice(Number(shipping))}</span>
                          }
                        </div>
                        {appliedDiscounts.length > 0 && (
                          <div className="flex flex-col gap-2">
                            {appliedDiscounts.map((discount, idx) => (
                              <ApplyDiscountCard key={discount.code || idx} discount={discount} handleRemoveDiscount={handleRemoveDiscount} />
                            ))}
                          </div>
                        )}

                      </div>

                      <Separator />

                      <div className="flex justify-between text-lg font-bold">
                        <span>Tổng cộng</span>
                        {isLoadingDiscount ? (
                          <span className="font-medium text-orange-500">----</span>
                        ) :
                          <span className="text-orange-500">{formatPrice(total)}</span>}
                      </div>


                      <Button disabled={isProcessing || hasInvalidItem || isLoadingDiscount} type="submit" size="lg" className="text-white w-full">
                        {isProcessing || isLoadingDiscount ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            {isProcessing ? "Đang xử lý..." : "Đang tính toán..."}
                          </>
                        ) : paymentMethod === "cod" ? (
                          "Xác nhận đặt hàng"
                        ) : (
                          "Tiếp tục thanh toán"
                        )}
                      </Button>

                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-xs text-muted-foreground text-center leading-relaxed">
                          Bằng cách đặt hàng, bạn đồng ý với{" "}
                          <Link href="/terms" className="text-orange-500 hover:underline">
                            Điều khoản sử dụng
                          </Link>{" "}
                          và{" "}
                          <Link href="/privacy" className="text-orange-500 hover:underline">
                            Chính sách bảo mật
                          </Link>{" "}
                          của chúng tôi
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </form>
            <AddressSelection
              addresses={addresses}
              handleSelectAddress={handleSelectAddress}
              showAddressDialog={showAddressDialog}
              setShowAddressDialog={setShowAddressDialog}
            />
          </div>
        </div >
      </main >
    </div >
  )
}
