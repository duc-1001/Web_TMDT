"use client"

import { Trash2, Plus, Minus, ShoppingBag, Tag, X, AlertCircle, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { useCartActions } from "@/hooks/use-cart-actions"
import { useSelector } from "react-redux"
import { RootState } from "@/store/store"
import { useQuery } from "@tanstack/react-query"
import { calculateCartPricing, getCart, getGuestCart, removeDiscountFromCart } from "@/services/cart.service"
import { formatPrice } from "@/lib/utils"
import { use, useCallback, useEffect, useState } from "react"
import DiscountSelection from "@/components/checkout/discount-selection"
import { queryClient } from "@/components/QueryClientProviders"
import ApplyDiscountCard from "@/components/checkout/apply-discount-card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function CartPage() {
  const router = useRouter()
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const cartQueryKey = isAuthenticated
    ? ["user-cart"]
    : ["guest-cart"]
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
  })


  const { updateQuantity, removeItem, removeMultipleItems } = useCartActions(isAuthenticated)

  const handleRemoveSelected = () => {
    if (selectedItems.length === 0) return;
    removeMultipleItems(selectedItems);
    setSelectedItems([]);
  }

  const handleSelectItem = (productId: string) => {
    setSelectedItems((prev) => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    })
  }

  useEffect(() => {
    if (!data?.items) return

    const availableProductIds = data.items.map(item => item.productId)

    setSelectedItems(prev => {
      // lần đầu vào trang - chỉ select items còn hàng
      if (prev.length === 0) {
        return availableProductIds.filter(productId => {
          const item = data.items.find(i => i.productId === productId)
          return item && !item.isOutOfStock && item.availableStock > 0
        })
      }

      // khi cart thay đổi - remove items hết hàng hoặc không tồn tại
      return prev.filter(id => {
        const item = data.items.find(i => i.productId === id)
        return item && availableProductIds.includes(id) && !item.isOutOfStock && item.availableStock > 0
      })
    })
  }, [data?.items])

  const { data: pricingData } = useQuery({
    queryKey: ["cart-pricing", selectedItems, data?.items],
    queryFn: () => {
      const items = isAuthenticated ? data?.items.map(item => ({ productId: item.productId, quantity: item.quantity })) : JSON.parse(localStorage.getItem("guest-cart") || "[]")
      const discounts = isAuthenticated ? [] : (JSON.parse(localStorage.getItem("guest-discounts") || "[]") as string[]);
      const uploadItems = items
        .filter((item: any) => selectedItems.includes(item.productId))
        .map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      return calculateCartPricing(uploadItems, discounts, { provinceCode: 0, wardCode: 0 })
    },
  })

  const cartItems = data?.items || []
  const totalItems = data?.items.length || 0
  const subtotal = pricingData?.subtotal || 0
  const total = pricingData?.totalPrice || 0
  const appliedDiscounts = pricingData?.appliedDiscounts || []

  const handleRemoveDiscount = async (code: string) => {
    if (!isAuthenticated) {
      const discounts = localStorage.getItem("guest-discounts") ? new Set(JSON.parse(localStorage.getItem("guest-discounts") || "[]")) : new Set<string>();
      discounts.delete(code);
      localStorage.setItem("guest-discounts", JSON.stringify(Array.from(discounts)));
    }
    else {
      await removeDiscountFromCart(code, cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,

      })));
    }
    queryClient.invalidateQueries({ queryKey: ["cart-pricing"], exact: false });
  }

  const handleCheckout = useCallback(() => {
    if (selectedItems.length === 0) {
      toast.error("Vui lòng chọn ít nhất một sản phẩm để tiếp tục thanh toán.")
      return
    }

    const hasAvailableItem = cartItems.some(
      item =>
        selectedItems.includes(item.productId) &&
        (!item.availableStock || item.availableStock > 0)
    )

    if (!hasAvailableItem) {
      toast.warning("Các sản phẩm bạn chọn hiện đang hết hàng. Bạn vẫn có thể tiếp tục đặt hàng.")
    }

    const itemsParam = selectedItems.join(",")

    router.push(`/checkout?items=${itemsParam}`)

  }, [selectedItems, cartItems, appliedDiscounts, router])

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Đang tải giỏ hàng...</div>
  }

  if (totalItems === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center">
            <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Giỏ hàng trống</h2>
            <p className="text-muted-foreground mb-6">Bạn chưa có sản phẩm nào trong giỏ hàng</p>
            <Button asChild size="lg">
              <Link href="/products" className="text-white">Khám phá sản phẩm</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Giỏ hàng của bạn</h1>
        <div className="mb-4 flex gap-2 items-center">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: cartQueryKey })
            }}
          >
            🔄 Kiểm tra lại tồn kho
          </Button>
        </div>
        {
          selectedItems.length > 0 && (
            <div className="flex items-center justify-between mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <span className="text-sm font-medium">{selectedItems.length} sản phẩm đã chọn</span>
              {
                selectedItems.length > 0 && (
                  <div className="flex items-center justify-between">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          Xóa
                        </Button>
                      </DialogTrigger>

                      <DialogContent className="sm:max-w-md">
                        <div className="flex flex-col items-center text-center px-6 py-6">

                          {/* Icon */}
                          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mb-4">
                            <Trash2 className="w-6 h-6 text-red-600" />
                          </div>

                          {/* Title */}
                          <h3 className="text-lg font-semibold text-gray-900">
                            Xác nhận xóa sản phẩm
                          </h3>

                          {/* Description */}
                          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                            Bạn có chắc chắn muốn xóa{" "}
                            <span className="font-semibold text-gray-800">
                              {selectedItems.length}
                            </span>{" "}
                            sản phẩm đã chọn khỏi giỏ hàng không?
                            Hành động này không thể hoàn tác.
                          </p>

                          {/* Buttons */}
                          <DialogFooter className="mt-6 w-full flex gap-3 sm:justify-center">
                            <DialogClose asChild>
                              <Button
                                variant="outline"
                                className="w-full sm:w-auto"
                              >
                                Hủy
                              </Button>
                            </DialogClose>

                            <DialogClose asChild>
                              <Button
                                variant="destructive"
                                className="w-full sm:w-auto"
                                onClick={handleRemoveSelected}
                              >
                                Xóa sản phẩm
                              </Button>
                            </DialogClose>
                          </DialogFooter>

                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )
              }
            </div>
          )
        }
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card
                key={item.productId}
                className={`transition ${item.isOutOfStock
                  ? "border-red-300 bg-red-50/40"
                  : "hover:shadow-md"
                  }`}
              >
                <CardContent className="">
                  <div className="flex gap-4">
                    <Checkbox
                      className="border-gray-400"
                      checked={selectedItems.includes(item.productId)}
                      disabled={item.isOutOfStock || item.availableStock === 0}
                      onCheckedChange={() => handleSelectItem(item.productId)}
                    />

                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted">
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h3 className="font-semibold">{item.name}</h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.productId)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>

                      <p className="font-bold text-orange-500 mt-1">
                        {formatPrice(item.price)}
                      </p>

                      {/* STOCK STATUS */}
                      {item.isOutOfStock ? (
                        <Badge variant="destructive" className="mt-2">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Hết hàng
                        </Badge>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-2">
                          Còn {item.availableStock} sản phẩm
                        </p>
                      )}

                      {/* QUANTITY */}
                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            item.quantity > 1
                              ? updateQuantity(
                                item.productId,
                                item.quantity - 1
                              )
                              : removeItem(item.productId)
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </Button>

                        <span className="w-8 text-center">
                          {item.quantity}
                        </span>

                        <Button
                          variant="outline"
                          size="icon"
                          disabled={
                            item.isOutOfStock ||
                            item.quantity >= item.availableStock
                          }
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.quantity + 1
                            )
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="text-right font-bold">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-32">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Tóm tắt đơn hàng</h2>

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
                    provinceCode={0}
                    wardCode={0}
                  />
                </div>
                <Separator className="my-4" />

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tạm tính</span>
                    <span>{subtotal.toLocaleString("vi-VN")}đ</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Phí vận chuyển</span>
                    <span>----</span>
                  </div>
                  {appliedDiscounts.length > 0 && (
                    <div className="flex flex-col gap-2">
                      {appliedDiscounts.map((discount, idx) => (
                        <ApplyDiscountCard key={discount.code || idx} discount={discount} handleRemoveDiscount={handleRemoveDiscount} />
                      ))}
                    </div>
                  )}
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between text-lg font-bold mb-6">
                  <span>Tổng cộng</span>
                  <span className="text-orange-500">{total.toLocaleString("vi-VN")}đ</span>
                </div>

                <Button onClick={handleCheckout} size="lg" className="w-full text-white">
                  Thanh toán
                </Button>

              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div >
  )
}
