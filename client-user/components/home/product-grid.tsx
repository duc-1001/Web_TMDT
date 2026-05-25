"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Heart, Star } from "lucide-react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { getHomeProducts } from "@/services/product.service"
import { ProductCard  } from "@/types/product"
import HomeProductCard from "../prodcuct/home-product-card"
import { useSelector } from "react-redux"
import { RootState } from "@/store/store"
import { toast } from "sonner"
import { queryClient } from "../QueryClientProviders"
import { addToWishlist, removeFromWishlist } from "@/services/wishlist.service"

type ProductGridProps = {
  itemsCount?: number
}

export function ProductGrid({ itemsCount = 10 }: ProductGridProps) {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)
  const { data } = useQuery({
    queryKey: ["home-products", itemsCount],
    queryFn: () => getHomeProducts(itemsCount),
  })
  const products: ProductCard [] = data || []
  const onToggleLikeProduct = async (productId: string) => {
    const product = products.find(p => p._id === productId)
    if (!product) return
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để sử dụng tính năng này!")
      return
    }

    const isLiked = product.isLiked
    queryClient.setQueryData<ProductCard []>(["home-products"], old =>
      old?.map(p =>
        p._id === productId
          ? { ...p, isLiked: !isLiked }
          : p
      )
    )

    try {
      if (isLiked) {
        toast.success("Đã bỏ thích sản phẩm!")
        await removeFromWishlist(productId)
      } else {
        toast.success("Đã thích sản phẩm!")
        await addToWishlist(productId)
      }
    } catch (err) {
      queryClient.setQueryData<ProductCard []>(["home-products"], old =>
        old?.map(p =>
          p._id === productId
            ? { ...p, isLiked }
            : p
        )
      )
    }
  }
  return (
    <section className="py-16 md:py-10 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Sản phẩm nổi bật</h2>
            <p className="text-muted-foreground text-lg">Được khách hàng yêu thích nhất</p>
          </div>
          <Button asChild variant="outline" className="hidden sm:flex bg-transparent">
            <Link href="/products">Xem tất cả</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {products.map((product) => (
            <HomeProductCard key={product._id} product={product} onToggleLike={onToggleLikeProduct} />
          ))}
        </div>

        <div className="text-center mt-5 sm:hidden">
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto bg-transparent">
            <Link href="/products">Xem tất cả sản phẩm</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
