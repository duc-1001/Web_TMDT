"use client"

import { useQuery } from "@tanstack/react-query"
import { useSelector } from "react-redux"
import { toast } from "sonner"
import Link from "next/link"
import { Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getProductsByIds } from "@/services/product.service"
import { ProductCard } from "@/types/product"
import { RootState } from "@/store/store"
import { queryClient } from "@/components/QueryClientProviders"
import { addToWishlist, removeFromWishlist } from "@/services/wishlist.service"
import HomeProductCard from "@/components/prodcuct/home-product-card"

interface CustomSectionProps {
  label: string
  productIds: string[]
  itemsCount?: number
}

export function CustomSection({ label, productIds, itemsCount }: CustomSectionProps) {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)

  const queryKey = ["custom-section", productIds.join(",")]

  const { data } = useQuery({
    queryKey,
    queryFn: () => getProductsByIds(productIds),
    enabled: productIds.length > 0,
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
    queryClient.setQueryData<ProductCard[]>(queryKey, (old) =>
      old?.map((p) => (p._id === productId ? { ...p, isLiked: !isLiked } : p))
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
      queryClient.setQueryData<ProductCard[]>(queryKey, (old) =>
        old?.map((p) => (p._id === productId ? { ...p, isLiked } : p))
      )
    }
  }

  if (!products.length) return null

  return (
    <section className="py-16 md:py-10 bg-muted/20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-1">{label}</h2>
              <p className="text-muted-foreground text-sm">Bộ sưu tập được tuyển chọn đặc biệt</p>
            </div>
          </div>
          <Button asChild variant="outline" className="hidden sm:flex bg-transparent">
            <Link href="/products">Xem tất cả</Link>
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
      </div>
    </section>
  )
}
