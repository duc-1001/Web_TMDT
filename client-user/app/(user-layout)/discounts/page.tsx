'use client'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Gift, Sparkles, Hash, Check, } from "lucide-react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { getActiveDiscounts } from "@/services/discount.service"
import { Discount } from "@/types/discount"
import { useState } from "react"
import DiscountCard from "@/components/discount/discount-card"
import DiscountDetail from "@/components/discount/discount-detail"
import { useSelector } from "react-redux"
import { RootState } from "@/store/store"


export default function DiscountsPage() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)
  const [showDetailDiscountDialog, setShowDetailDiscountDialog] = useState(false)
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null)

  const handleShowDetailDiscount = (discount: Discount) => {
    setSelectedDiscount(discount)
    setShowDetailDiscountDialog(true)
  }

  const { data: featuredDiscounts } = useQuery({
    queryKey: ['featured-active-discounts'],
    queryFn: async () => getActiveDiscounts(true)
  })

  const { data: regularDiscounts } = useQuery({
    queryKey: ['regular-active-discounts'],
    queryFn: async () => getActiveDiscounts(false)
  })

  const featured = featuredDiscounts || []
  const regular = regularDiscounts || []

  return (
    <div className="min-h-screen bg-background">
      <section className="relative bg-gradient-to-br from-orange-700 via-orange-700/90 to-orange-700/80 py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/placeholder.svg?height=400&width=1200')] opacity-5" />
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white">
            <Badge className="mb-6 bg-white/20 text-white border-white/30 px-4 py-2 text-sm">
              <Gift className="h-4 w-4 mr-2" />
              {featured.length + regular.length} chương trình khuyến mãi đang diễn ra
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-balance">Ưu đãi đặc biệt</h1>
            <p className="text-xl md:text-2xl text-white/90 text-pretty leading-relaxed max-w-3xl mx-auto">
              Đừng bỏ lỡ các chương trình khuyến mãi hấp dẫn và tiết kiệm cho bạn khi mua sắm đồ ăn vặt yêu thích
            </p>
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="py-16 bg-gradient-to-b from-orange-500/5 to-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <Sparkles className="h-6 w-6 text-orange-500" />
              <h2 className="text-3xl font-bold">Khuyến mãi nổi bật</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {featured.map((promo) => (
                <DiscountCard key={promo._id} promo={promo} handleShowDetailDiscount={handleShowDetailDiscount} />
              ))}
            </div>
          </div>
        </section>
      )}

      {
        regular.length > 0 && (
          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="flex items-center gap-3 mb-8">
                <Hash className="h-6 w-6 text-orange-500" />
                <h2 className="text-3xl font-bold">Tất cả ưu đãi</h2>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {regular.map((promo) => (
                  <DiscountCard key={promo._id} promo={promo} handleShowDetailDiscount={handleShowDetailDiscount} />
                ))}
              </div>
            </div>
          </section>
        )
      }

      {
        !isAuthenticated && <section className="py-20 bg-gradient-to-br from-orange-500/10 via-background to-orange-500/5">
          <div className="container mx-auto px-4">
            <Card className="border-2 border-orange-500/20 overflow-hidden bg-gradient-to-br from-background to-muted/50">
              <CardContent className="p-8 md:p-16">
                <div className="max-w-3xl mx-auto text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-600/10 mb-6">
                    <Gift className="h-8 w-8 text-orange-500" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">Đăng ký nhận thông báo ưu đãi</h2>
                  <p className="text-lg text-muted-foreground mb-8 leading-relaxed text-pretty">
                    Không bỏ lỡ bất kỳ chương trình khuyến mãi nào. Đăng ký tài khoản để nhận thông báo về các ưu đãi mới
                    nhất qua email
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button size="lg" asChild className="text-white">
                      <Link href="/signup" >
                        Đăng ký ngay
                        <Check className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                      <Link href="/products">Mua sắm ngay</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      }

      {showDetailDiscountDialog && selectedDiscount && (
        <DiscountDetail selectedDiscount={selectedDiscount} showDetailDiscountDialog={showDetailDiscountDialog} setShowDetailDiscountDialog={setShowDetailDiscountDialog} />
      )}
    </div>
  )
}
