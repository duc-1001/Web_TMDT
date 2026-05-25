'use client'

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { getCategories, getCategoryRootTree } from "@/services/category.service"
import { ChevronRight } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Badge } from "../ui/badge"
import { CategoryTree } from "@/types/category"


export function CategoryGrid() {
  const { data, isLoading } = useQuery({
    queryKey: ['categories-tree'],
    queryFn: getCategoryRootTree,
  })

  const categories: CategoryTree[] = data ?? []

  if (isLoading) {
    return (
      <section className="py-16 text-center text-muted-foreground">
        Đang tải danh mục...
      </section>
    )
  }

  if (!categories.length) return null

  return (
    <section className="py-14 md:py-16">
      <div className="container mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Danh mục sản phẩm
          </h2>
          <p className="text-muted-foreground">
            Khám phá các loại snack yêu thích của bạn
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Popover key={category._id}>
              <PopoverTrigger asChild>
                <button className="w-full text-left">
                  <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-orange-500/50 overflow-hidden cursor-pointer">
                    <CardContent className="">
                      <div className="flex items-center gap-4">
                        <img src={category.image || "placeholder.svg"} alt={category.name} className="w-20 aspect-square object-contain rounded-xl group-hover:scale-110 transition-transform" />
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{category.name}</h3>
                          <p className="text-sm text-muted-foreground">{category.productCount} sản phẩm</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-orange-500 transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                </button>
              </PopoverTrigger>

              <PopoverContent className="w-80 p-0" align="start">
                <div className="space-y-2 p-4">
                  <div className="pb-2 border-b">
                    <p className="font-bold text-sm text-orange-500">{category.name}</p>
                  </div>
                  <Link
                    href={`/products?category=${category.slug}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-orange-500/5 hover:bg-orange-500/10 transition-colors"
                  >
                    <span className="font-medium text-orange-500 text-sm">Xem tất cả</span>
                    <Badge variant="secondary" className="text-xs">{category.productCount}</Badge>
                  </Link>
                  <div className="space-y-1 pt-2 max-h-80 overflow-y-auto">
                    {category.children.map((child) => (
                      <Link
                        key={child._id}
                        href={`/products?category=${child.slug}`}
                        className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted transition-colors text-sm"
                      >
                        <span>{child.name}</span>
                        <span className="text-xs text-muted-foreground">{child.productCount}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          ))}
        </div>
      </div>
    </section>
  )
}
