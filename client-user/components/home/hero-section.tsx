'use client'

import { Button } from "@/components/ui/button"
import { getHeroBanners } from "@/services/banner.service"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { ArrowRight, ShoppingBag } from "lucide-react"

export function HeroSection() {
  const { data } = useQuery({
    queryKey: ['hero-banners'],
    queryFn: getHeroBanners,
  })

  const banner = data?.[0]

  if (!banner) return null

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-background to-amber-50/40 dark:from-orange-950/20 dark:via-background dark:to-amber-950/10">
      {/* Background decorative blobs */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-orange-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-amber-300/20 blur-3xl" />

      <div className="container relative mx-auto px-4 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-10 xl:gap-16 items-center">

          {/* ─── LEFT: TEXT ─── */}
          <div className="space-y-7 order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/40">
              <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                ✨ Ưu đãi hôm nay
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl xl:text-6xl font-bold leading-tight tracking-tight">
              {banner.title}
            </h1>

            {banner.subtitle && (
              <p className="text-lg text-muted-foreground leading-relaxed max-w-md">
                {banner.subtitle}
              </p>
            )}

            <div className="flex flex-wrap gap-3 pt-1">
              <Button
                asChild
                size="lg"
                className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-6 shadow-lg shadow-orange-200 dark:shadow-orange-900/30 transition-all hover:scale-[1.02]"
              >
                <Link href={banner.buttonLink || "/products"}>
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  {banner.buttonText || "Mua sắm ngay"}
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-xl px-6 border-orange-200 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-all hover:scale-[1.02]"
              >
                <Link href="/discounts">
                  Xem khuyến mãi
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* ─── RIGHT: IMAGE 16:9 ─── */}
          <div className="order-1 lg:order-2">
            <div className="relative">
              {/* Glow effect behind image */}
              <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-2xl bg-orange-400/20 blur-xl" />

              {/* 16:9 container */}
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5">
                {banner.backgroundImage ? (
                  <img
                    src={banner.backgroundImage}
                    alt={banner.title}
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-orange-200 to-amber-300 dark:from-orange-800 dark:to-amber-700 flex items-center justify-center">
                    <ShoppingBag className="h-16 w-16 text-orange-400/60" />
                  </div>
                )}

                {/* Subtle gradient overlay at bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
