"use client"

import { useState } from "react"
import { Heart, ShoppingCart, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { getWishlist, removeFromWishlist } from "@/services/wishlist.service"
import { useSelector } from "react-redux"
import { RootState } from "@/store/store"
import { queryClient } from "@/components/QueryClientProviders"
import { BasicProductCard } from "@/types/product"

export default function WishlistPage() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)
  const { data, isLoading, isError } = useQuery({
    queryKey: ["wishlist-items"],
    queryFn: getWishlist,
    enabled: isAuthenticated,
  })

  const removeItem = async (productId: string) => {
    const prev = queryClient.getQueryData<BasicProductCard[]>(["wishlist-items"])
    if (!prev?.length) return

    // 1️⃣ Optimistic update
    queryClient.setQueryData<BasicProductCard[]>(["wishlist-items"], old =>
      old?.filter(item => item._id !== productId)
    )

    try {
      // 2️⃣ Call API thật
      await removeFromWishlist(productId)
    } catch (error) {
      // 3️⃣ Rollback
      queryClient.setQueryData<BasicProductCard[]>(["wishlist-items"], prev)
    }
  }


  const wishlistItems = data || []

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 text-center text-muted-foreground">
          Đang tải danh sách yêu thích...
        </div>
      </div>
    )
  }


  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center">
            <Heart className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Danh sách yêu thích trống</h2>
            <p className="text-muted-foreground mb-6">Thêm sản phẩm bạn thích vào danh sách để mua sau</p>
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
      <div className="container mx-auto px-4 py-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Sản phẩm yêu thích</h1>
          <p className="text-muted-foreground">Bạn có {wishlistItems.length} sản phẩm trong danh sách yêu thích</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {wishlistItems.map((item) => (
            <Card key={item._id} className="group overflow-hidden">
              <CardContent className="p-0">
                <Link href={`/product/${item.slug}`} className="block">
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {item.discount > 0 && (
                      <Badge className="absolute text-white top-2 right-2 bg-red-500">-{item.discount}%</Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 left-2 bg-white/80 hover:bg-white"
                      onClick={(e) => {
                        e.preventDefault()
                        removeItem(item._id)
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </Link>

                <div className="px-4 pt-4">
                  <Link href={`/product/${item._id}`}>
                    <h3 className="font-medium mb-2 line-clamp-2 group-hover:text-orange-500 transition-colors">
                      {item.name}
                    </h3>
                  </Link>

                  <div className="flex flex-col gap-2 mb-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-orange-500">{item.price.toLocaleString("vi-VN")}đ</span>
                      <span className="text-sm text-muted-foreground line-through">
                        {item.originalPrice.toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                    {item.stock === 0 && <p className="text-sm text-red-500">Tạm hết hàng</p>}
                  </div>

                  <Button className="w-full text-white" disabled={item.stock === 0}>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {item.stock > 0 ? "Thêm vào giỏ" : "Hết hàng"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
