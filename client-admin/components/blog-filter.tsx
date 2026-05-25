"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

const categories = ["Tất cả", "Sức khỏe", "Mẹo hay", "Xu hướng", "Gia đình", "Review"]

export function BlogFilter() {
  const [activeCategory, setActiveCategory] = useState("Tất cả")

  return (
    <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
      {categories.map((category) => (
        <Button
          key={category}
          variant={category === activeCategory ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveCategory(category)}
        >
          {category}
        </Button>
      ))}
    </div>
  )
}
