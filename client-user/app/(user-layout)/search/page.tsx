"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"

function SearchResults() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""
  const [searchQuery, setSearchQuery] = useState(query)

  const products = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    name: `Snack Hàn Quốc ${i + 1}`,
    price: Math.floor(Math.random() * 150000) + 30000,
    originalPrice: Math.floor(Math.random() * 200000) + 50000,
    image: `/placeholder.svg?height=300&width=300&query=vietnamese snack ${i + 1}`,
    rating: 4 + Math.random(),
    sold: Math.floor(Math.random() * 1000),
    discount: Math.floor(Math.random() * 50) + 10,
  }))

  const filteredProducts = products.filter((product) => product.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Kết quả tìm kiếm</h1>
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-lg h-12"
            />
          </div>
        </div>

        {searchQuery && (
          <p className="text-muted-foreground mb-6">
            Tìm thấy {filteredProducts.length} kết quả cho "{searchQuery}"
          </p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.map((product) => (
            <Link key={product.id} href={`/product/${product.id}`}>
              <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
                <CardContent className="p-0">
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <Image
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {product.discount > 0 && (
                      <Badge className="absolute top-2 right-2 bg-red-500">-{product.discount}%</Badge>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-sm mb-2 line-clamp-2 group-hover:text-orange-500 transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-1 mb-2">
                      <div className="flex text-yellow-400 text-xs">
                        {"★".repeat(Math.floor(product.rating))}
                        {"☆".repeat(5 - Math.floor(product.rating))}
                      </div>
                      <span className="text-xs text-muted-foreground">({product.sold})</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-base font-bold text-orange-500">{product.price.toLocaleString("vi-VN")}đ</span>
                      <span className="text-xs text-muted-foreground line-through">
                        {product.originalPrice.toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {filteredProducts.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-2">Không tìm thấy kết quả cho "{searchQuery}"</p>
            <p className="text-sm text-muted-foreground">Hãy thử tìm kiếm với từ khóa khác</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">Đang tải...</div>}>
      <SearchResults />
    </Suspense>
  )
}
