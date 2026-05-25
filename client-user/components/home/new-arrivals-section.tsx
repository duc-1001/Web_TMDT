"use client"

import { useQuery } from "@tanstack/react-query"
import { useSelector } from "react-redux"
import { toast } from "sonner"
import Link from "next/link"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getNewArrivals } from "@/services/product.service"
import { ProductCard } from "@/types/product"
import { RootState } from "@/store/store"
import { queryClient } from "@/components/QueryClientProviders"
import { addToWishlist, removeFromWishlist } from "@/services/wishlist.service"
import HomeProductCard from "@/components/prodcuct/home-product-card"

type NewArrivalsSectionProps = {
  itemsCount?: number
}

export function NewArrivalsSection({ itemsCount = 10 }: NewArrivalsSectionProps) {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)

  const { data } = useQuery({
    queryKey: ["new-arrivals", itemsCount],
    queryFn: () => getNewArrivals(itemsCount),
  })

  const products: ProductCard[] = data || []

  const onToggleLikeProduct = async (productId: string) => {
    const product = products.find((p) => p._id === productId)
    if (!product) return
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để sử dụng tính năng này!")
      return
    }

    const isLiked = product.isLiked
    queryClient.setQueryData<ProductCard[]>(["new-arrivals"], (old) =>
      old?.map((p) =>
        p._id === productId ? { ...p, isLiked: !isLiked } : p
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
    } catch {
      queryClient.setQueryData<ProductCard[]>(["new-arrivals"], (old) =>
        old?.map((p) =>
          p._id === productId ? { ...p, isLiked } : p
        )
      )
    }
  }

  if (!products.length) return null

  return (
    <section className="py-16 md:py-10 bg-gradient-to-br from-emerald-50/60 via-background to-teal-50/30 dark:from-emerald-950/20 dark:via-background dark:to-teal-950/10">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/40">
              <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-1">
                Mới{" "}
                <span className="text-emerald-500">Về</span>
              </h2>
              <p className="text-muted-foreground text-sm">Sản phẩm vừa ra mắt – nhanh tay trải nghiệm!</p>
            </div>
          </div>
          <Button asChild variant="outline" className="hidden sm:flex bg-transparent border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
            <Link href="/products?sort=newest">Xem tất cả</Link>
          </Button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {products.map((product) => (
            <HomeProductCard
              key={product._id}
              product={product}
              onToggleLike={onToggleLikeProduct}
            />
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="text-center mt-5 sm:hidden">
          <Button asChild variant="outline" size="lg" className="w-full bg-transparent border-emerald-200 text-emerald-600">
            <Link href="/products?sort=newest">Xem tất cả sản phẩm mới</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
