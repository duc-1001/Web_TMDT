'use client'
import { HeroSection } from "@/components/home/hero-section"
import { CategoryGrid } from "@/components/home/category-grid"
import { ProductGrid } from "@/components/home/product-grid"
import { SaleProductsSection } from "@/components/home/sale-products-section"
import { NewArrivalsSection } from "@/components/home/new-arrivals-section"
import { CustomSection } from "@/components/home/custom-section"
import { Features } from "@/components/features"
import UserLayout from "@/components/layout/user/user-layout"
import MergeCartNotify from "@/components/home/merge-cart-notify"
import { useEffect, useMemo } from "react"
import { toast } from "sonner"
import { useQuery } from "@tanstack/react-query"
import { getHomepageConfig, HomepageSectionConfig } from "@/services/system.service"

const PRODUCT_SECTION_IDS = ["featured", "sale", "new_arrivals"] as const

// Thứ tự mặc định khi chưa có config từ server
const DEFAULT_ORDER: HomepageSectionConfig[] = [
  { id: "featured", enabled: true, order: 2 },
  { id: "sale", enabled: true, order: 3 },
  { id: "new_arrivals", enabled: true, order: 4 },
]

export default function Home() {
  // Đọc login toast
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("login") === "success") {
      toast.success("Đăng nhập thành công! Chào mừng bạn đã quay lại.")
      window.history.replaceState({}, "", window.location.pathname)
    }
  }, [])

  // Fetch homepage config (public endpoint, không cần auth)
  const { data: configData } = useQuery({
    queryKey: ["homepage-config"],
    queryFn: getHomepageConfig,
    staleTime: 5 * 60 * 1000,
  })

  // Chỉ quản lý thứ tự và số lượng cho các section sản phẩm
  const productSectionsToRender = useMemo(() => {
    const config = configData && configData.length > 0 ? configData : DEFAULT_ORDER

    return [...config]
      .filter((s) => PRODUCT_SECTION_IDS.includes(s.id as (typeof PRODUCT_SECTION_IDS)[number]) || s.type === "custom")
      .sort((a, b) => a.order - b.order)
      .filter((s) => s.enabled)
      .map((s) => {
        // Custom section do admin tự tạo
        if (s.type === "custom") {
          return (
            <CustomSection
              key={s.id}
              label={s.label ?? "Sản phẩm đặc biệt"}
              productIds={s.productIds ?? []}
              itemsCount={s.itemCount ?? 10}
            />
          )
        }

        if (s.id === "featured") {
          return <ProductGrid key={s.id} itemsCount={s.itemCount ?? 10} />
        }

        if (s.id === "sale") {
          return <SaleProductsSection key={s.id} itemsCount={s.itemCount ?? 10} />
        }

        if (s.id === "new_arrivals") {
          return <NewArrivalsSection key={s.id} itemsCount={s.itemCount ?? 10} />
        }

        return null
      })
      .filter(Boolean)
  }, [configData])

  return (
    <UserLayout>
      <main className="flex-1">
        <HeroSection />
        <CategoryGrid />
        {productSectionsToRender}
        <Features />
        <MergeCartNotify />
      </main>
    </UserLayout>
  )
}
