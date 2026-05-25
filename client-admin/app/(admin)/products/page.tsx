"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import {
  Search, Plus, MoreVertical, Pencil, Trash2, Eye, EyeOff,
  X, SlidersHorizontal, ArrowUpDown,
} from "lucide-react"
import Link from "next/link"
import PaginationControls from "@/components/layout/pagination-controls-admin"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getAllProductsAdmin, updateProductStatus } from "@/services/product.service"
import { formatPrice } from "@/lib/utils"
import useDebounce from "@/hooks/use-debounce"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { queryClient } from "@/components/QueryClientProviders"
import { PaginatedData } from "@/types/commons"
import { ProductAdmin } from "@/types/product"
import { Dialog } from "@/components/ui/dialog"
import DeleteProduct from "@/components/forms/product/delete-product"

// ─── Sort options ─────────────────────────────────────────
const SORT_OPTIONS = [
  { value: "createdAt_desc", label: "Mới nhất" },
  { value: "createdAt_asc",  label: "Cũ nhất" },
  { value: "name_asc",       label: "Tên A → Z" },
  { value: "name_desc",      label: "Tên Z → A" },
  { value: "price_asc",      label: "Giá tăng dần" },
  { value: "price_desc",     label: "Giá giảm dần" },
]

// ─── Status options ───────────────────────────────────────
const STATUS_OPTIONS = [
  { value: "all",   label: "Tất cả" },
  { value: "true",  label: "Đang hiển thị" },
  { value: "false", label: "Đã ẩn" },
]

export default function ProductsPage() {
  const [search, setSearch]           = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [sort, setSort]               = useState("createdAt_desc")
  const [statusFilter, setStatusFilter] = useState("all")   // "all" | "true" | "false"
  const [showFilters, setShowFilters]   = useState(false)

  const q = useDebounce(search, 500)

  // Khi đổi bộ lọc → reset về trang 1
  const applyFilter = (fn: () => void) => {
    fn()
    setCurrentPage(1)
  }

  const isActiveParam =
    statusFilter === "all" ? undefined :
    statusFilter === "true" ? true : false

  const { data: productsData } = useQuery({
    queryKey: ["admin-products", currentPage, itemsPerPage, q, sort, statusFilter],
    queryFn: () => getAllProductsAdmin(currentPage, itemsPerPage, q, sort, isActiveParam),
  })

  const totalPages  = productsData?.pagination.totalPages || 1
  const totalItems  = productsData?.pagination.total      || 0
  const products    = productsData?.data                  || []

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingProduct,  setDeletingProduct]  = useState<ProductAdmin | null>(null)

  // ── helpers ──
  const hasActiveFilters = statusFilter !== "all" || sort !== "createdAt_desc"

  const resetFilters = () => {
    setStatusFilter("all")
    setSort("createdAt_desc")
    setSearch("")
    setCurrentPage(1)
  }

  const getStockBadge = (stock: number) => {
    if (stock === 0)  return <Badge variant="destructive">Hết hàng</Badge>
    if (stock < 50)   return <Badge className="bg-yellow-500 hover:bg-yellow-500">Sắp hết</Badge>
    return <Badge className="bg-green-500 hover:bg-green-500">Còn hàng</Badge>
  }

  const onChangeStatus = async (product: ProductAdmin) => {
    const key = ["admin-products", currentPage, itemsPerPage, q, sort, statusFilter]
    const prev = queryClient.getQueryData<PaginatedData<ProductAdmin>>(key)
    queryClient.setQueryData(key, (old: PaginatedData<ProductAdmin> | undefined) => {
      if (!old) return old
      return {
        ...old,
        data: old.data.map((p) =>
          p._id === product._id ? { ...p, isActive: !p.isActive } : p
        ),
      }
    })
    try {
      await updateProductStatus(product._id)
    } catch {
      queryClient.setQueryData(key, prev)
    }
  }

  const handleDeleteProduct = (product: ProductAdmin) => {
    setDeletingProduct(product)
    setDeleteDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Quản lý sản phẩm</h1>
          <p className="text-muted-foreground">Quản lý danh sách sản phẩm của cửa hàng</p>
        </div>
        <Button asChild>
          <Link href="/products/new">
            <Plus className="h-4 w-4 mr-2" />
            Thêm sản phẩm
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">

          {/* ── Search + Filter toggle ── */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên, SKU..."
                className="pl-10"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
              />
              {search && (
                <button
                  onClick={() => { setSearch(""); setCurrentPage(1) }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <Button
              variant={showFilters ? "default" : "outline"}
              className={showFilters ? "" : "bg-transparent"}
              onClick={() => setShowFilters((v) => !v)}
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Bộ lọc
              {hasActiveFilters && (
                <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-primary text-[10px] font-bold">
                  !
                </span>
              )}
            </Button>
          </div>

          {/* ── Filter panel ── */}
          {showFilters && (
            <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-muted/30 px-4 py-3">
              {/* Trạng thái hiển thị */}
              <div className="flex flex-col gap-1 min-w-[160px]">
                <label className="text-xs font-medium text-muted-foreground">Trạng thái hiển thị</label>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => applyFilter(() => setStatusFilter(v))}
                >
                  <SelectTrigger className="h-9 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sắp xếp */}
              <div className="flex flex-col gap-1 min-w-[180px]">
                <label className="text-xs font-medium text-muted-foreground">Sắp xếp theo</label>
                <Select
                  value={sort}
                  onValueChange={(v) => applyFilter(() => setSort(v))}
                >
                  <SelectTrigger className="h-9 bg-background">
                    <ArrowUpDown className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Reset */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="h-9 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          )}

          {/* ── Active filter chips ── */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              {statusFilter !== "all" && (
                <span className="flex items-center gap-1 rounded-full border bg-muted px-2.5 py-0.5 text-xs">
                  Hiển thị: {STATUS_OPTIONS.find(o => o.value === statusFilter)?.label}
                  <button onClick={() => applyFilter(() => setStatusFilter("all"))}>
                    <X className="h-3 w-3 ml-0.5 text-muted-foreground hover:text-foreground" />
                  </button>
                </span>
              )}
              {sort !== "createdAt_desc" && (
                <span className="flex items-center gap-1 rounded-full border bg-muted px-2.5 py-0.5 text-xs">
                  {SORT_OPTIONS.find(o => o.value === sort)?.label}
                  <button onClick={() => applyFilter(() => setSort("createdAt_desc"))}>
                    <X className="h-3 w-3 ml-0.5 text-muted-foreground hover:text-foreground" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* ── Table ── */}
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="border-b">
                  <TableHead className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Sản phẩm</TableHead>
                  <TableHead className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Danh mục</TableHead>
                  <TableHead className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Giá</TableHead>
                  <TableHead className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Tồn kho</TableHead>
                  <TableHead className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Đã bán</TableHead>
                  <TableHead className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Tồn kho</TableHead>
                  <TableHead className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Hiển thị</TableHead>
                  <TableHead className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Nổi bật</TableHead>
                  <TableHead className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Thao tác</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {totalItems === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 opacity-30" />
                        <span className="text-sm">Không tìm thấy sản phẩm nào.</span>
                        {hasActiveFilters && (
                          <button onClick={resetFilters} className="text-xs text-primary hover:underline">
                            Xóa bộ lọc và thử lại
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product._id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <TableCell className="py-3 px-2">
                        <div className="flex items-center gap-3">
                          <Link href={`/products/${product._id}`} className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                            <img
                              src={product?.image || "/placeholder.svg"}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </Link>
                          <div className="min-w-0">
                            <Link href={`/products/${product._id}`} className="font-medium hover:underline line-clamp-2 text-sm">
                              {product.name}
                            </Link>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-3 px-2 text-sm">{product.category?.name ?? "—"}</TableCell>
                      <TableCell className="py-3 px-2 font-medium text-sm">{formatPrice(product.price)}</TableCell>
                      <TableCell className="py-3 px-2 text-sm">{product.stock}</TableCell>
                      <TableCell className="py-3 px-2 text-sm">{product.soldQuantity}</TableCell>
                      <TableCell className="py-3 px-2">{getStockBadge(product.stock)}</TableCell>

                      <TableCell className="py-3 px-2">
                        {product.isActive
                          ? <Badge className="bg-green-500 hover:bg-green-500">Đang hiển thị</Badge>
                          : <Badge className="bg-red-500 hover:bg-red-500">Đã ẩn</Badge>}
                      </TableCell>

                      <TableCell className="py-3 px-2">
                        {product.isFeatured
                          ? <Badge className="bg-green-500 hover:bg-green-500">Nổi bật</Badge>
                          : <Badge variant="outline" className="text-muted-foreground">Không</Badge>}
                      </TableCell>

                      <TableCell className="py-3 px-2 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/products/${product._id}`} className="flex gap-2 items-center">
                                <Eye className="h-4 w-4" />
                                Xem chi tiết
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onChangeStatus(product)}>
                              <EyeOff className="h-4 w-4 mr-2" />
                              {product.isActive ? "Ẩn sản phẩm" : "Hiển thị sản phẩm"}
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/products/edit/${product._id}`} className="flex gap-2 items-center">
                                <Pencil className="h-4 w-4" />
                                Chỉnh sửa
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteProduct(product)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {totalItems > 0 && (
        <PaginationControls
          totalPages={totalPages}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          setCurrentPage={setCurrentPage}
          setItemsPerPage={setItemsPerPage}
          totalItems={totalItems}
        />
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DeleteProduct setDeleteDialogOpen={setDeleteDialogOpen} selectedProduct={deletingProduct!} />
      </Dialog>
    </div>
  )
}
