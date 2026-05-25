"use client"

import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Plus, Minus, X, ShoppingBag, Circle, CircleAlert, Trash2 } from "lucide-react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { calculateCartPricing, getCart, getGuestCart } from "@/services/cart.service"
import { formatPrice } from "@/lib/utils"
import { useSelector } from "react-redux"
import { RootState } from "@/store/store"
import { useCartActions } from "@/hooks/use-cart-actions"

export function CartSheet() {
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

  // useEffect(() => {
  //   if (data?.items.length === 0) {
  //     setSelectedItems([])
  //   }
  //   else {
  //     const availableProductIds = data?.items.map(item => item.productId) || []
  //     setSelectedItems(availableProductIds)
  //   }
  // }, [data?.items.length])
  
  const { data: pricingData } = useQuery({
    queryKey: ["cart-pricing", data?.items],
    queryFn: () => {
      const items = isAuthenticated ? data?.items.map(item => ({ productId: item.productId, quantity: item.quantity })) : JSON.parse(localStorage.getItem("guest-cart") || "[]")
      const discounts = isAuthenticated ? [] : (JSON.parse(localStorage.getItem("guest-discounts") || "[]") as string[]);
      return calculateCartPricing(items, discounts, { provinceCode: 0, wardCode: 0 })
    },
  })

  const { updateQuantity, removeItem, removeMultipleItems } = useCartActions(isAuthenticated)

  const subtotal = pricingData?.subtotal || 0
  const totalItems = data?.items.length || 0

  // const handleSelectItem = (productId: string) => {
  //   setSelectedItems((prev) =>
  //     prev.includes(productId)
  //       ? prev.filter((id) => id !== productId)
  //       : [...prev, productId]
  //   )
  // }

  // const handleRemoveSelected = () => {
  //   removeMultipleItems(selectedItems)
  //   setSelectedItems([])
  // }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <Badge className="absolute -top-1 text-white -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-2">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Giỏ hàng ({totalItems} sản phẩm)
          </SheetTitle>
        </SheetHeader>

        {data?.items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Giỏ hàng trống</h3>
              <p className="text-sm text-muted-foreground">Thêm sản phẩm vào giỏ để tiếp tục mua sắm</p>
            </div>
            <Button asChild>
              <Link className={'text-white'} href="/products">Khám phá sản phẩm</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto -mx-6 px-6">
              {/* {
                selectedItems.length > 0 && (
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium">{selectedItems.length} sản phẩm đã chọn</span>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          Xóa
                        </Button>
                      </DialogTrigger>

                      <DialogContent className="sm:max-w-md">
                        <div className="flex flex-col items-center text-center px-6 py-6">
                          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mb-4">
                            <Trash2 className="w-6 h-6 text-red-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Xác nhận xóa sản phẩm
                          </h3>
                          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                            Bạn có chắc chắn muốn xóa{" "}
                            <span className="font-semibold text-gray-800">
                              {selectedItems.length}
                            </span>{" "}
                            sản phẩm đã chọn khỏi giỏ hàng không?
                            Hành động này không thể hoàn tác.
                          </p>
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
              } */}
              <div className="space-y-4 py-4 overflow-auto">
                {data?.items.map((item) => {
                  const isOutOfStock = item.isOutOfStock || item.availableStock === 0
                  const exceedStock = item.quantity > item.availableStock

                  return (
                    <div
                      key={item.productId}
                      className={`flex gap-4 p-3 rounded-xl border transition ${isOutOfStock
                        ? "bg-red-50 border-red-200"
                        : exceedStock
                          ? "bg-yellow-50 border-yellow-200"
                          : "bg-white"
                        }`}
                    >
                      {/* <Checkbox
                        className="border-gray-400"
                        checked={selectedItems.includes(item.productId)}
                        onCheckedChange={() => handleSelectItem(item.productId)}
                      /> */}
                      {/* IMAGE */}
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative">
                        <img
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          className={`h-full m-auto object-cover ${isOutOfStock ? "opacity-50 grayscale" : ""
                            }`}
                        />

                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-semibold">
                            Hết hàng
                          </div>
                        )}
                      </div>

                      {/* INFO */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-medium line-clamp-2">
                            {item.name}
                          </h4>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                            onClick={() => removeItem(item.productId)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-orange-500">
                            {formatPrice(item.price)}
                          </span>

                          {/* QUANTITY CONTROL */}
                          <div className="flex items-center border rounded-lg">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              disabled={isOutOfStock}
                              onClick={() => {
                                if (item.quantity > 1) {
                                  updateQuantity(item.productId, item.quantity - 1)
                                } else {
                                  removeItem(item.productId)
                                }
                              }}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>

                            <span className="w-10 text-center text-sm font-medium">
                              {item.quantity}
                            </span>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              disabled={
                                isOutOfStock ||
                                item.quantity >= item.availableStock
                              }
                              onClick={() => {
                                updateQuantity(item.productId, item.quantity + 1)
                              }}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* STOCK WARNING */}
                        {!isOutOfStock && item.availableStock <= 5 && (
                          <p className="text-xs text-yellow-600 mt-2 flex items-center gap-1">
                            <CircleAlert className="h-3 w-3" />
                            Chỉ còn {item.availableStock} sản phẩm
                          </p>
                        )}

                        {exceedStock && (
                          <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                            <CircleAlert className="h-3 w-3" />
                            Số lượng vượt quá tồn kho
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Tạm tính</span>
                <span className="text-orange-500">{formatPrice(subtotal)}</span>
              </div>

              <div className="flex gap-2">
                <SheetClose asChild>
                  <Button variant="outline" asChild className="flex-1 bg-transparent">
                    <Link href="/cart">Xem giỏ hàng</Link>
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button 
                    asChild 
                    className="flex-1"
                  >
                    <Link 
                      href={`/checkout${data?.items.length ? `?items=${data.items.filter(item => !item.isOutOfStock && item.availableStock > 0).map(item => item.productId).join(",")}` : ""}`} 
                      className={"text-white"}
                    >
                      Thanh toán
                    </Link>
                  </Button>
                </SheetClose>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
