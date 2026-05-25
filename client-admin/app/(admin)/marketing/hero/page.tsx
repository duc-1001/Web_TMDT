"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { Edit2, ImageOff } from "lucide-react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getAllBannersAdmin } from "@/services/banner.service"
import { HeroBanner } from "@/types/banner"
import EditHero from "@/components/forms/marketting/hero/edit-hero"

export default function HeroPage() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['hero-banners-admin'],
    queryFn: getAllBannersAdmin,
  })

  const banner: HeroBanner | null = data?.[0] ?? null

  const [openEditDialog, setOpenEditDialog] = useState(false)

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">Hero Banner</h1>
          <p className="text-muted-foreground text-sm">
            Chỉnh sửa nội dung hiển thị trên trang chủ
          </p>
        </div>
        <Button
          onClick={() => setOpenEditDialog(true)}
          className="bg-orange-600 hover:bg-orange-700"
          disabled={!banner}
        >
          <Edit2 className="h-4 w-4 mr-2" />
          Chỉnh sửa
        </Button>
      </div>

      {/* PREVIEW CARD */}
      {isLoading ? (
        <div className="h-64 rounded-xl bg-muted animate-pulse" />
      ) : banner ? (
        <Card className="overflow-hidden">
          {/* IMAGE */}
          <div className="relative h-64 bg-muted">
            {banner.backgroundImage ? (
              <img
                src={banner.backgroundImage}
                alt={banner.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <ImageOff size={32} />
                <span className="text-sm">Chưa có hình ảnh</span>
              </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />

            {/* Text overlay */}
            <div className="absolute inset-0 flex flex-col justify-center px-8 text-white">
              <p className="text-xs uppercase tracking-widest opacity-70 mb-2">
                Preview
              </p>
              <h2 className="text-3xl font-bold leading-tight max-w-md">
                {banner.title}
              </h2>
              {banner.subtitle && (
                <p className="text-sm opacity-80 mt-2 max-w-sm">
                  {banner.subtitle}
                </p>
              )}
              {banner.buttonText && (
                <div className="mt-4">
                  <span className="inline-block px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium">
                    {banner.buttonText}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* META */}
          <CardContent className="p-5 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">Tiêu đề</p>
                <p className="font-medium">{banner.title}</p>
              </div>
              {banner.subtitle && (
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Tiêu đề phụ</p>
                  <p className="font-medium line-clamp-1">{banner.subtitle}</p>
                </div>
              )}
              {banner.buttonText && (
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Nút CTA</p>
                  <p className="font-medium">
                    {banner.buttonText}
                    {banner.buttonLink && (
                      <span className="text-muted-foreground ml-1">
                        → {banner.buttonLink}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="h-64 rounded-xl border-2 border-dashed flex items-center justify-center text-muted-foreground">
          Chưa có dữ liệu hero banner
        </div>
      )}

      {/* EDIT DIALOG */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        {banner && (
          <EditHero
            selectedBanner={banner}
            setOpenEditDialog={setOpenEditDialog}
          />
        )}
      </Dialog>
    </div>
  )
}
