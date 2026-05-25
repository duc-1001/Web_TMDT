import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, Package } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

const categories = [
  {
    id: "snacks",
    name: "Snack giòn",
    description: "Các loại snack giòn rụm thơm ngon",
    count: 45,
    image: "/crispy-snacks.jpg",
    color: "from-orange-500/20 to-red-500/20",
    icon: "🍿",
  },
  {
    id: "candy",
    name: "Kẹo",
    description: "Kẹo ngọt đa dạng từ khắp nơi",
    count: 38,
    image: "/assorted-candy.jpg",
    color: "from-pink-500/20 to-purple-500/20",
    icon: "🍬",
  },
  {
    id: "dried-fruit",
    name: "Hoa quả sấy",
    description: "Trái cây sấy giữ nguyên dinh dưỡng",
    count: 28,
    image: "/dried-fruits.jpg",
    color: "from-yellow-500/20 to-orange-500/20",
    icon: "🍊",
  },
  {
    id: "nuts",
    name: "Hạt dinh dưỡng",
    description: "Các loại hạt tốt cho sức khỏe",
    count: 32,
    image: "/mixed-nuts.png",
    color: "from-amber-500/20 to-brown-500/20",
    icon: "🥜",
  },
  {
    id: "chocolate",
    name: "Socola",
    description: "Socola cao cấp nhiều loại",
    count: 25,
    image: "/chocolate-bars.jpg",
    color: "from-brown-500/20 to-orange-500/20",
    icon: "🍫",
  },
  {
    id: "cookies",
    name: "Bánh quy",
    description: "Bánh quy giòn tan hấp dẫn",
    count: 41,
    image: "/cookies-assortment.jpg",
    color: "from-yellow-500/20 to-amber-500/20",
    icon: "🍪",
  },
]

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/placeholder.svg?height=400&width=1200')] opacity-5" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <Badge className="mb-4 bg-white/20 text-white border-white/30">
              <Package className="h-3 w-3 mr-1" />
              {categories.length} danh mục
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-balance">Khám phá thế giới đồ ăn vặt</h1>
            <p className="text-lg md:text-xl text-white/90 text-pretty leading-relaxed">
              Hơn 200+ sản phẩm đồ ăn vặt được phân loại cẩn thận để bạn dễ dàng tìm kiếm và lựa chọn
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category, index) => (
              <Link key={category.id} href={`/products?category=${category.id}`}>
                <Card className="group relative overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-2 hover:border-primary/50 h-full">
                  <CardContent className="p-0 h-full flex flex-col">
                    {/* Image section with overlay */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      <Image
                        src={category.image || "/placeholder.svg"}
                        alt={category.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      {/* Gradient overlay */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                      {/* Icon badge */}
                      <div className="absolute top-4 right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                        {category.icon}
                      </div>

                      {/* Category name overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <div className="flex items-end justify-between">
                          <div>
                            <h3 className="text-2xl md:text-3xl font-bold text-white mb-1 text-balance">
                              {category.name}
                            </h3>
                            <div className="flex items-center gap-2 text-white/90">
                              <Package className="h-4 w-4" />
                              <span className="text-sm font-medium">{category.count} sản phẩm</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content section */}
                    <div className="flex-1 flex flex-col p-6 bg-gradient-to-br from-background to-muted/30">
                      <p className="text-muted-foreground leading-relaxed mb-4 flex-1">{category.description}</p>

                      <Button
                        variant="ghost"
                        className="w-full group-hover:bg-orange-600 group-hover:text-orange-500-foreground transition-all duration-300"
                      >
                        Xem sản phẩm
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-primary/10 via-background to-primary/5">
        <div className="container mx-auto px-4">
          <Card className="border-2 border-primary/20 overflow-hidden">
            <CardContent className="p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">Không tìm thấy danh mục bạn cần?</h2>
                  <p className="text-lg text-muted-foreground leading-relaxed text-pretty">
                    Duyệt qua tất cả sản phẩm của chúng tôi hoặc sử dụng chức năng tìm kiếm để tìm đúng món bạn muốn
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" asChild>
                    <Link href="/products">
                      Xem tất cả sản phẩm
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/search">Tìm kiếm</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
