"use client"
import { useState, useEffect, useMemo } from "react"
import { Minus, Plus, Search, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import useDebounce from "@/hooks/use-debounce"
import { getProducts } from "@/services/product.service"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import ProductCard from "@/components/prodcuct/product-card"
import PaginationControls from "@/components/layout/pagination-controls-user"
import { getCategoryRootTree } from "@/services/category.service"
import { CategoryTree } from "@/types/category"

const priceRanges = [
  { id: "under-50k", label: "Dưới 50.000đ", min: 0, max: 50000 },
  { id: "50-100k", label: "50.000đ - 100.000đ", min: 50000, max: 100000 },
  { id: "100-200k", label: "100.000đ - 200.000đ", min: 100000, max: 200000 },
  { id: "over-200k", label: "Trên 200.000đ", min: 200000, max: Infinity }
]

export default function ProductsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const initialSearch = searchParams.get("q") || ""
  const categorySlugParam = searchParams.get("category") || ""
  const sortParam = searchParams.get("sort") || "newest"
  const pageParam = Number(searchParams.get("page") || 1)

  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    categorySlugParam ? categorySlugParam.split(",") : []
  )
  const [selectedPriceRange, setSelectedPriceRange] = useState("")
  const [sortBy, setSortBy] = useState(sortParam)
  const [currentPage, setCurrentPage] = useState(pageParam)

  // Sync sortBy khi URL thay đổi từ bên ngoài (ví dụ: navigate từ trang chủ)
  useEffect(() => {
    setSortBy(sortParam)
  }, [sortParam])

  const q = useDebounce(searchQuery, 500)
  const selectedRange = useMemo(() => priceRanges.find(r => r.id === selectedPriceRange), [selectedPriceRange])

  const { data: dataCategoryTree } = useQuery({
    queryKey: ["categories-tree"],
    queryFn: getCategoryRootTree,
  })
  const categories = useMemo(() => dataCategoryTree ?? [], [dataCategoryTree])

  // === FIX: Đồng bộ trạng thái khi load ban đầu hoặc selectedCategories thay đổi ===
  useEffect(() => {
    if (!categories.length) return // chưa load tree

    setSelectedCategories(prev => {
      let newSelected = [...prev]

      // Duyệt qua toàn bộ tree, nếu slug nào trong prev thì thêm hết con cháu nếu chưa có
      const syncTree = (cat: CategoryTree) => {
        if (newSelected.includes(cat.slug)) {
          const allDescendants = getAllDescendantSlugs(cat)
          allDescendants.forEach(slug => {
            if (!newSelected.includes(slug)) {
              newSelected.push(slug)
            }
          })
        }
        if (cat.children) {
          cat.children.forEach(syncTree)
        }
      }

      categories.forEach(syncTree)

      // Loại bỏ trùng lặp (dù set không cần nhưng an toàn)
      return [...new Set(newSelected)]
    })
  }, [categories]) // chỉ chạy khi tree categories load xong

  // Sync query params (giữ nguyên, nhưng giờ selectedCategories đã đầy đủ slug)
  useEffect(() => {
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    if (selectedCategories.length) params.set("category", selectedCategories.join(","))
    if (selectedRange?.min !== undefined) params.set("min_price", String(selectedRange.min))
    if (selectedRange?.max !== undefined && selectedRange.max !== Infinity) params.set("max_price", String(selectedRange.max))
    if (sortBy) params.set("sort", sortBy)
    if (currentPage > 1) params.set("page", String(currentPage))
    router.replace(`${pathname}?${params.toString()}`)
  }, [q, selectedCategories, selectedRange, sortBy, currentPage, router, pathname])

  const { data } = useQuery({
    queryKey: ["products", q, selectedCategories, selectedPriceRange, sortBy, currentPage],
    queryFn: () => getProducts(q, selectedCategories, currentPage, 20, sortBy, selectedRange?.min, selectedRange?.max)
  })

  const products = data?.data || []
  const totalPages = data?.pagination?.totalPages || 1

  const getAllDescendantSlugs = (category: CategoryTree): string[] => {
    let slugs: string[] = [category.slug]
    if (category.children) {
      category.children.forEach(child => {
        slugs = slugs.concat(getAllDescendantSlugs(child))
      })
    }
    return slugs
  }

  const toggleCategory = (category: CategoryTree) => {
    const allSlugs = getAllDescendantSlugs(category)
    setSelectedCategories(prev => {
      const isFullySelected = allSlugs.every(slug => prev.includes(slug))

      if (isFullySelected) {
        return prev.filter(slug => !allSlugs.includes(slug))
      } else {
        return [...new Set([...prev, ...allSlugs])]
      }
    })
    setCurrentPage(1)
  }

  const hasAnySelectedDescendant = (category: CategoryTree): boolean => {
    return getAllDescendantSlugs(category).some(slug => selectedCategories.includes(slug))
  }

  const CategoryItem = ({ category, level = 0 }: { category: CategoryTree; level?: number }) => {
    const hasChildren = category.children?.length > 0
    const [open, setOpen] = useState(hasAnySelectedDescendant(category))

    useEffect(() => {
      if (hasAnySelectedDescendant(category) && !open) {
        setOpen(true)
      }
    }, [selectedCategories])

    return (
      <div>
        <div className="flex items-center space-x-2" style={{ paddingLeft: `${level * 16}px` }}>
          {hasChildren ? (
            <button
              type="button"
              className="text-xs w-4 flex items-center justify-center"
              onClick={() => setOpen(!open)}
            >
              {open ? <Minus className="h-4 w-4 text-gray-500" /> : <Plus className="h-4 w-4 text-gray-500" />}
            </button>
          ) : (
            <div className="w-4" />
          )}

          <Checkbox
            id={category.slug}
            checked={selectedCategories.includes(category.slug)}
            onCheckedChange={() => toggleCategory(category)}
          />

          <Label htmlFor={category.slug} className="text-sm font-normal cursor-pointer flex-1">
            {category.name}
            {category.productCount !== undefined && (
              <span className="text-muted-foreground ml-1">({category.productCount})</span>
            )}
          </Label>
        </div>

        {hasChildren && open && (
          <div className="space-y-2 mt-2">
            {category.children.map(child => (
              <CategoryItem key={child.slug} category={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  const FilterContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-4">Danh mục</h3>
        <div className="space-y-3">
          {categories.map(category => (
            <CategoryItem key={category.slug} category={category} />
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4">Khoảng giá</h3>
        <RadioGroup value={selectedPriceRange} onValueChange={v => { setSelectedPriceRange(v); setCurrentPage(1) }}>
          {priceRanges.map(range => (
            <div key={range.id} className="flex items-center space-x-2">
              <RadioGroupItem value={range.id} id={range.id} />
              <Label htmlFor={range.id} className="text-sm font-normal cursor-pointer">{range.label}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <Button
        variant="outline"
        className="w-full bg-transparent"
        onClick={() => { setSelectedCategories([]); setSelectedPriceRange(""); setCurrentPage(1) }}
      >
        Xóa bộ lọc
      </Button>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Tất cả sản phẩm</h1>
          <p className="text-muted-foreground">Khám phá {products.length} sản phẩm</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1) }}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={v => { setSortBy(v); setCurrentPage(1) }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Phổ biến nhất</SelectItem>
                <SelectItem value="newest">Mới nhất</SelectItem>
                <SelectItem value="discount_desc">Giảm giá nhiều nhất</SelectItem>
                <SelectItem value="price-asc">Giá thấp → cao</SelectItem>
                <SelectItem value="price-desc">Giá cao → thấp</SelectItem>
              </SelectContent>
            </Select>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />Lọc
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="px-5">
                <SheetHeader>
                  <SheetTitle>Bộ lọc</SheetTitle>
                  <SheetDescription>Tùy chỉnh kết quả tìm kiếm</SheetDescription>
                </SheetHeader>
                <FilterContent />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="flex gap-6">
          <aside className="hidden lg:block w-64 shrink-0">
            <Card>
              <CardContent className="p-6">
                <h2 className="font-semibold mb-4">Bộ lọc</h2>
                <FilterContent />
              </CardContent>
            </Card>
          </aside>

          <div className="flex-1">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            {products.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Không tìm thấy sản phẩm</p>
              </div>
            )}

            <div className="mt-6">
              <PaginationControls currentPage={currentPage} setCurrentPage={setCurrentPage} totalPages={totalPages} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}