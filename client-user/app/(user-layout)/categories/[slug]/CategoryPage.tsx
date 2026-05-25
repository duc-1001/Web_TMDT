'use client'

import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
export const mockProducts = [
  {
    _id: "1",
    name: "Bánh que Pocky Socola",
    price: 25000,
    image: "/mock/pocky.jpg",
  },
  {
    _id: "2",
    name: "Snack khoai tây Oishi",
    price: 18000,
    image: "/mock/snack-oishi.jpg",
  },
  {
    _id: "3",
    name: "Kẹo dẻo Haribo Goldbears",
    price: 35000,
    image: "/mock/haribo.jpg",
  },
  {
    _id: "4",
    name: "Bánh gạo One One",
    price: 22000,
    image: "/mock/one-one.jpg",
  },
  {
    _id: "5",
    name: "Socola KitKat",
    price: 30000,
    image: "/mock/kitkat.jpg",
  },
  {
    _id: "6",
    name: "Snack bắp caramel",
    price: 15000,
    image: "/mock/snack-bap.jpg",
  },
]
export const mockCategory = {
  _id: "banh-keo",
  slug: "banh-keo",
  name: "Bánh kẹo",
  description: "Các loại bánh kẹo ngọt ngào, thơm ngon, phù hợp mọi lứa tuổi",
  image: "/mock/category-banh-keo.jpg",
}
interface CategoryPageProps {
  slug: string;
}
export default function CategoryPage({ slug }: CategoryPageProps) {
  const category = mockCategory
  const products = mockProducts

  return (
    <section className="pb-16">

      {/* ===== HERO CATEGORY ===== */}
      <div className="relative h-[240px] md:h-[320px] overflow-hidden">
        <Image
          src={category.image}
          alt={category.name}
          fill
          className="object-cover"
        />

        {/* Overlay + blur */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {category.name}
          </h1>
          <p className="text-white/80 max-w-xl">
            {category.description}
          </p>
        </div>
      </div>

      {/* ===== PRODUCT GRID ===== */}
      <div className="container mx-auto px-4 mt-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <Link
              key={product._id}
              href="#"
              className="group"
            >
              <Card className="h-full overflow-hidden border hover:shadow-xl transition">
                {/* Image */}
                <div className="relative aspect-square bg-muted overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Info */}
                <CardContent className="p-3">
                  <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                    {product.name}
                  </h3>
                  <p className="text-orange-500 font-bold text-sm">
                    {product.price.toLocaleString()}₫
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

    </section>
  )
}
