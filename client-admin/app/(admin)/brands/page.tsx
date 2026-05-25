"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, Plus, MoreVertical, Pencil, Trash2, Eye } from "lucide-react"
import { useEffect, useState } from "react"
import AddNewBrand from "@/components/forms/brand/add-new-brand"
import { useQuery } from "@tanstack/react-query"
import { changeBrandStatus, getAllBrandsAdmin } from "@/services/brand.service"
import { Brand } from "@/types/brand"
import Image from "next/image"
import EditBrand from "@/components/forms/brand/edit-new-brand"
import DeleteNewBrand from "@/components/forms/brand/delete-new-brand"
import DeleteBrand from "@/components/forms/brand/delete-new-brand"
import { toast } from "sonner"
import { queryClient } from "@/components/QueryClientProviders"

export default function BrandsContent() {

  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['admin-brands'],
    queryFn: getAllBrandsAdmin,
  })

  const [brands, setBrands] = useState<Brand[]>(data || [])

  useEffect(() => {
    if (data) {
      setBrands(data)
    }
  }, [data])

  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add")
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null)

  const filteredBrands = brands.filter((brand) =>
    brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    brand.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }

  const handleOpenAddDialog = () => {
    setDialogMode("add")
    setSelectedBrand(null)
    setDialogOpen(true)
  }

  const handleOpenEditDialog = (brand: Brand) => {
    setDialogMode("edit")
    setSelectedBrand(brand)
    setEditDialogOpen(true)
  }

  const handleDelete = () => {
    if (deleteTarget) {
      setBrands(brands.filter((brand) => brand._id !== deleteTarget._id))
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
    }
  }

  const handleToggleStatus = async (id: string) => {
    try {
      await changeBrandStatus(id);
      queryClient.invalidateQueries({ queryKey: ['brand-for-product'] });
      queryClient.invalidateQueries({ queryKey: ['brands-for-select'] });
    } catch (error: any) {
      console.log(error);

    }
  }

  const toggleBrandStatus = async (id: string) => {
    const brand = brands.find((b) => b._id === id);

    if (!brand) return;

    if (brand.isSystem) {
      toast.error("Không thể thay đổi trạng thái thương hiệu hệ thống");
      return;
    }

    setBrands(
      brands.map((b) =>
        b._id === id ? { ...b, isActive: !b.isActive } : b
      )
    );

    await handleToggleStatus(id);
  };



  const stats = [
    {
      title: "Tổng thương hiệu",
      value: brands.length.toString(),
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "Đang hoạt động",
      value: brands.filter((b) => b.isActive).length.toString(),
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "Tổng sản phẩm",
      value: brands.reduce((sum, b) => sum + b.productCount, 0).toString(),
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
  ]

  return (
    <div>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Quản lý thương hiệu</h1>
            <p className="text-muted-foreground">Quản lý danh sách thương hiệu sản phẩm</p>
          </div>
          <Button onClick={handleOpenAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm thương hiệu
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <span className={`text-lg font-bold ${stat.color}`}>{stat.value.charAt(0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Brands List */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm thương hiệu..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Thương hiệu</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Mô tả</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Sản phẩm</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Trạng thái</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBrands.length > 0 ? (
                    filteredBrands.map((brand) => (
                      <tr key={brand._id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg flex-shrink-0">
                              <Image
                                src={brand.logo || "/placeholder.svg"}
                                alt={brand.name}
                                width={40}
                                height={40}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium">{brand.name}</p>
                              <p className="text-xs text-muted-foreground">{brand.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-sm max-w-xs">
                          <p className="line-clamp-2">{brand.description}</p>
                        </td>
                        <td className="py-3 px-2 text-sm font-medium">{brand.productCount}</td>
                        <td className="py-3 px-2">
                          {brand.isActive ? (
                            <Badge className="bg-green-500">Hoạt động</Badge>
                          ) : (
                            <Badge variant="secondary">Ẩn</Badge>
                          )}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenEditDialog(brand)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Chỉnh sửa
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleBrandStatus(brand._id)}>
                                <Eye className="h-4 w-4 mr-2" />
                                {brand.isActive ? "Ẩn" : "Hiện"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setDeleteTarget(brand)
                                  setDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Xóa
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        Không tìm thấy thương hiệu nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">Hiển thị {filteredBrands.length} thương hiệu</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AddNewBrand setDialogOpen={setDialogOpen} />
      </Dialog>
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        {
          selectedBrand && (
            <EditBrand
              brand={selectedBrand}
              setEditDialogOpen={setEditDialogOpen}
            />
          )
        }
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DeleteBrand deleteTarget={deleteTarget} setDeleteDialogOpen={setDeleteDialogOpen} />
      </Dialog>
    </div>
  )
}
