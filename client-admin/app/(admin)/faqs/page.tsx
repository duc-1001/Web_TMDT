"use client"

import { useMemo, useState } from "react"
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, FolderTree } from "lucide-react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import useDebounce from "@/hooks/use-debounce"
import { queryClient } from "@/components/QueryClientProviders"
import {
  createFaqAdmin,
  createFaqCategoryAdmin,
  deleteFaqAdmin,
  deleteFaqCategoryAdmin,
  getFaqCategoriesAdmin,
  getFaqsAdmin,
  updateFaqAdmin,
  updateFaqCategoryAdmin,
  updateFaqCategoryStatusAdmin,
  updateFaqStatusAdmin,
} from "@/services/faq.service"
import type { FaqCategory, FaqCategoryItem, FaqFormPayload, FaqItem } from "@/types/faq"

const newFaqFormDefault: FaqFormPayload = {
  question: "",
  answer: "",
  category: "",
  order: 1,
  is_active: true,
}

const toDateTime = (isoDate?: string | null) => {
  if (!isoDate) return "-"

  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return "-"

  return date.toLocaleString("vi-VN", {
    hour12: false,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const extractErrorMessage = (error: unknown) => {
  const err = error as { response?: { data?: { detail?: { message?: string } | string } }; message?: string }
  const detail = err?.response?.data?.detail
  if (typeof detail === "string") return detail
  if (typeof detail === "object" && detail?.message) return detail.message
  return err?.message || "Có lỗi xảy ra, vui lòng thử lại"
}

export default function FaqsPage() {
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<FaqCategory | "all">("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")

  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)

  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
  const [selectedFaq, setSelectedFaq] = useState<FaqItem | null>(null)
  const [formData, setFormData] = useState<FaqFormPayload>(newFaqFormDefault)
  const [formErrors, setFormErrors] = useState<{ question?: string; answer?: string; category?: string }>({})
  const [movingFaqId, setMovingFaqId] = useState<string | null>(null)

  const [categoryNameInput, setCategoryNameInput] = useState("")
  const [editingCategory, setEditingCategory] = useState<FaqCategoryItem | null>(null)

  const debouncedSearch = useDebounce(search, 400)

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["faq-categories-admin"],
    queryFn: getFaqCategoriesAdmin,
  })

  const { data, isLoading } = useQuery({
    queryKey: ["admin-faqs", categoryFilter, statusFilter],
    queryFn: () =>
      getFaqsAdmin({
        page: 1,
        limit: 50,
        category: categoryFilter === "all" ? undefined : categoryFilter,
        is_active: statusFilter === "all" ? undefined : statusFilter === "active",
      }),
  })

  const faqs = useMemo(() => data?.data || [], [data])

  const categoryNameMap = useMemo(() => {
    return categories.reduce<Record<string, string>>((acc, item) => {
      acc[item.key] = item.name
      return acc
    }, {})
  }, [categories])

  const categoryOrderMap = useMemo(() => {
    return categories.reduce<Record<string, number>>((acc, item) => {
      acc[item.key] = item.order
      return acc
    }, {})
  }, [categories])

  const sortedFaqs = useMemo(() => {
    const keyword = debouncedSearch.trim().toLowerCase()

    return [...faqs]
      .sort((a, b) => {
        const aCatOrder = categoryOrderMap[a.category] ?? 9999
        const bCatOrder = categoryOrderMap[b.category] ?? 9999
        if (aCatOrder !== bCatOrder) return aCatOrder - bCatOrder
        return a.order - b.order
      })
      .filter((faq) => {
        if (!keyword) return true
        return faq.question.toLowerCase().includes(keyword) || faq.answer.toLowerCase().includes(keyword)
      })
  }, [faqs, debouncedSearch, categoryOrderMap])

  const stats = useMemo(() => {
    const total = faqs.length
    const active = faqs.filter((f) => f.is_active).length
    const inactive = total - active
    const lastUpdated =
      [...faqs].sort(
        (a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime(),
      )[0]?.updated_at || null

    return { total, active, inactive, lastUpdated }
  }, [faqs])

  const invalidateFaqQueries = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin-faqs"] })
    await queryClient.invalidateQueries({ queryKey: ["faq-categories-admin"] })
  }

  const createMutation = useMutation({
    mutationFn: createFaqAdmin,
    onSuccess: async () => {
      await invalidateFaqQueries()
      setIsFormDialogOpen(false)
      setFormData(newFaqFormDefault)
      toast.success("Tạo FAQ thành công")
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  })

  const updateMutation = useMutation({
    mutationFn: ({ faqId, payload }: { faqId: string; payload: FaqFormPayload }) => updateFaqAdmin(faqId, payload),
    onSuccess: async () => {
      await invalidateFaqQueries()
      setIsFormDialogOpen(false)
      setSelectedFaq(null)
      toast.success("Cập nhật FAQ thành công")
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteFaqAdmin,
    onSuccess: async () => {
      await invalidateFaqQueries()
      setIsDeleteDialogOpen(false)
      setSelectedFaq(null)
      toast.success("Xóa FAQ thành công")
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  })

  const toggleStatusMutation = useMutation({
    mutationFn: ({ faqId, isActive }: { faqId: string; isActive: boolean }) => updateFaqStatusAdmin(faqId, isActive),
    onSuccess: async () => {
      await invalidateFaqQueries()
      toast.success("Đã cập nhật trạng thái FAQ")
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  })

  const createCategoryMutation = useMutation({
    mutationFn: createFaqCategoryAdmin,
    onSuccess: async () => {
      await invalidateFaqQueries()
      setCategoryNameInput("")
      toast.success("Tạo thể loại FAQ thành công")
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  })

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { name?: string; order?: number; is_active?: boolean } }) =>
      updateFaqCategoryAdmin(id, payload),
    onSuccess: async () => {
      await invalidateFaqQueries()
      toast.success("Cập nhật thể loại FAQ thành công")
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  })

  const toggleCategoryStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => updateFaqCategoryStatusAdmin(id, isActive),
    onSuccess: async () => {
      await invalidateFaqQueries()
      toast.success("Đã cập nhật trạng thái thể loại")
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteFaqCategoryAdmin,
    onSuccess: async () => {
      await invalidateFaqQueries()
      toast.success("Xóa thể loại FAQ thành công")
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  })

  const openCreateDialog = () => {
    if (!categories.length) {
      toast.error("Bạn cần tạo thể loại FAQ trước")
      setIsCategoryDialogOpen(true)
      return
    }

    const firstActive = categories.find((item) => item.is_active) || categories[0]

    setDialogMode("create")
    setSelectedFaq(null)
    setFormData({
      ...newFaqFormDefault,
      category: firstActive.key,
      order: faqs.filter((f) => f.category === firstActive.key).length + 1,
    })
    setFormErrors({})
    setIsFormDialogOpen(true)
  }

  const openEditDialog = (faq: FaqItem) => {
    setDialogMode("edit")
    setSelectedFaq(faq)
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      order: faq.order,
      is_active: faq.is_active,
    })
    setFormErrors({})
    setIsFormDialogOpen(true)
  }

  const openPreviewDialog = (faq: FaqItem) => {
    setSelectedFaq(faq)
    setIsPreviewDialogOpen(true)
  }

  const openDeleteDialog = (faq: FaqItem) => {
    setSelectedFaq(faq)
    setIsDeleteDialogOpen(true)
  }

  const resetFormDialog = () => {
    setFormData(newFaqFormDefault)
    setFormErrors({})
    setSelectedFaq(null)
    setIsFormDialogOpen(false)
  }

  const validateForm = (payload: FaqFormPayload) => {
    const nextErrors: { question?: string; answer?: string; category?: string } = {}

    if (!payload.question) nextErrors.question = "Vui lòng nhập tiêu đề câu hỏi"
    if (!payload.answer) nextErrors.answer = "Vui lòng nhập nội dung câu trả lời"
    if (!payload.category) nextErrors.category = "Vui lòng chọn thể loại câu hỏi"

    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const submitForm = async () => {
    const payload: FaqFormPayload = {
      question: formData.question.trim(),
      answer: formData.answer.trim(),
      category: formData.category,
      order: formData.order,
      is_active: formData.is_active,
    }

    if (!validateForm(payload)) {
      toast.error("Vui lòng nhập đầy đủ tiêu đề, nội dung và thể loại")
      return
    }

    if (!categoryNameMap[payload.category]) {
      toast.error("Thể loại không còn tồn tại, vui lòng chọn lại")
      setFormErrors((prev) => ({ ...prev, category: "Thể loại không hợp lệ" }))
      return
    }

    if (dialogMode === "create") {
      await createMutation.mutateAsync(payload)
      return
    }

    if (!selectedFaq) return
    await updateMutation.mutateAsync({ faqId: selectedFaq._id, payload })
  }

  const moveFaq = async (id: string, direction: "up" | "down") => {
    const currentFaq = faqs.find((item) => item._id === id)
    if (!currentFaq) return

    const siblingFaqs = [...faqs]
      .filter((item) => item.category === currentFaq.category)
      .sort((a, b) => a.order - b.order)

    const currentIndex = siblingFaqs.findIndex((faq) => faq._id === id)
    if (currentIndex === -1) return

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= siblingFaqs.length) return

    const targetFaq = siblingFaqs[targetIndex]

    try {
      setMovingFaqId(currentFaq._id)
      await updateFaqAdmin(currentFaq._id, {
        question: currentFaq.question,
        answer: currentFaq.answer,
        category: currentFaq.category,
        order: targetFaq.order,
        is_active: currentFaq.is_active,
      })
      await invalidateFaqQueries()
    } catch (error) {
      toast.error(extractErrorMessage(error))
    } finally {
      setMovingFaqId(null)
    }
  }

  const moveCategory = async (id: string, direction: "up" | "down") => {
    const sorted = [...categories].sort((a, b) => a.order - b.order)
    const currentIndex = sorted.findIndex((item) => item._id === id)
    if (currentIndex === -1) return

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= sorted.length) return

    const current = sorted[currentIndex]
    const target = sorted[targetIndex]

    await updateCategoryMutation.mutateAsync({
      id: current._id,
      payload: { order: target.order },
    })
  }

  const onDeleteFaq = () => {
    if (!selectedFaq) return
    deleteMutation.mutate(selectedFaq._id)
  }

  const onToggleStatus = (faq: FaqItem) => {
    toggleStatusMutation.mutate({ faqId: faq._id, isActive: !faq.is_active })
  }

  const onSubmitCategory = async () => {
    const name = categoryNameInput.trim()
    if (!name) {
      toast.error("Vui lòng nhập tên thể loại")
      return
    }

    if (editingCategory) {
      await updateCategoryMutation.mutateAsync({
        id: editingCategory._id,
        payload: { name },
      })
      setEditingCategory(null)
      setCategoryNameInput("")
      return
    }

    await createCategoryMutation.mutateAsync({ name })
  }

  const onDeleteCategory = async (category: FaqCategoryItem) => {
    const ok = window.confirm(`Bạn chắc chắn muốn xóa thể loại ${category.name}?`)
    if (!ok) return
    await deleteCategoryMutation.mutateAsync(category._id)
  }

  const onSelectCategoryForEdit = (category: FaqCategoryItem) => {
    setEditingCategory(category)
    setCategoryNameInput(category.name)
  }

  const onCancelEditCategory = () => {
    setEditingCategory(null)
    setCategoryNameInput("")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">Quản lý câu hỏi thường gặp</h1>
          <p className="text-muted-foreground">Sắp xếp FAQ riêng theo từng thể loại và quản lý thể loại câu hỏi.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsCategoryDialogOpen(true)}>
            <FolderTree className="h-4 w-4 mr-2" />
            Quản lý thể loại
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm câu hỏi
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tổng câu hỏi</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Đang hiển thị</CardDescription>
            <CardTitle className="text-2xl text-green-600">{stats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Đang ẩn</CardDescription>
            <CardTitle className="text-2xl text-orange-600">{stats.inactive}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Cập nhật gần nhất</CardDescription>
            <CardTitle className="text-sm font-semibold">{toDateTime(stats.lastUpdated)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Tìm theo câu hỏi hoặc câu trả lời..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as FaqCategory | "all")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Thể loại" />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4}>
                <SelectItem value="all">Tất cả thể loại</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category._id} value={category.key}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | "active" | "inactive")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4}>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="active">Đang hiển thị</SelectItem>
                <SelectItem value="inactive">Đang ẩn</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Thứ tự</TableHead>
                <TableHead>Câu hỏi</TableHead>
                <TableHead className="w-52">Thể loại</TableHead>
                <TableHead className="w-28">Trạng thái</TableHead>
                <TableHead className="w-44">Cập nhật</TableHead>
                <TableHead className="w-32 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Đang tải dữ liệu FAQ...
                  </TableCell>
                </TableRow>
              ) : sortedFaqs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Không có dữ liệu FAQ phù hợp bộ lọc.
                  </TableCell>
                </TableRow>
              ) : (
                sortedFaqs.map((faq) => {
                  const siblingFaqs = [...faqs].filter((item) => item.category === faq.category).sort((a, b) => a.order - b.order)
                  const siblingIndex = siblingFaqs.findIndex((item) => item._id === faq._id)
                  const isFirst = siblingIndex === 0
                  const isLast = siblingIndex === siblingFaqs.length - 1
                  const moving = movingFaqId === faq._id

                  return (
                    <TableRow key={faq._id}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{faq.order}</span>
                          <div className="flex flex-col">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              disabled={isFirst || moving}
                              onClick={() => moveFaq(faq._id, "up")}
                            >
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              disabled={isLast || moving}
                              onClick={() => moveFaq(faq._id, "down")}
                            >
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="max-w-xl whitespace-normal">
                        <p className="font-medium line-clamp-2">{faq.question}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{faq.answer}</p>
                      </TableCell>

                      <TableCell>
                        <Badge variant="secondary">{categoryNameMap[faq.category] || faq.category}</Badge>
                      </TableCell>

                      <TableCell>
                        {faq.is_active ? <Badge className="bg-green-500">Hiển thị</Badge> : <Badge variant="outline">Ẩn</Badge>}
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">{toDateTime(faq.updated_at)}</TableCell>

                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openPreviewDialog(faq)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Xem nhanh
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(faq)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onToggleStatus(faq)}>
                              {faq.is_active ? (
                                <>
                                  <EyeOff className="h-4 w-4 mr-2" />
                                  Ẩn câu hỏi
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Hiển thị câu hỏi
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => openDeleteDialog(faq)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Quản lý thể loại FAQ</DialogTitle>
            <DialogDescription>Tạo, chỉnh sửa, bật tắt và sắp xếp thứ tự hiển thị thể loại câu hỏi.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={categoryNameInput}
                onChange={(e) => setCategoryNameInput(e.target.value)}
                placeholder="Tên thể loại câu hỏi"
              />
              <Button onClick={onSubmitCategory} disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}>
                {editingCategory ? "Lưu" : "Tạo"}
              </Button>
              {editingCategory && (
                <Button variant="outline" onClick={onCancelEditCategory}>
                  Hủy
                </Button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Thứ tự</TableHead>
                    <TableHead>Thể loại</TableHead>
                    <TableHead className="w-24">Hiển thị</TableHead>
                    <TableHead className="w-32 text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoriesLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-20 text-muted-foreground">
                        Đang tải thể loại...
                      </TableCell>
                    </TableRow>
                  ) : categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-20 text-muted-foreground">
                        Chưa có thể loại FAQ.
                      </TableCell>
                    </TableRow>
                  ) : (
                    [...categories]
                      .sort((a, b) => a.order - b.order)
                      .map((category, index, arr) => (
                        <TableRow key={category._id}>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span>{category.order}</span>
                              <div className="flex flex-col">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  disabled={index === 0}
                                  onClick={() => moveCategory(category._id, "up")}
                                >
                                  <ArrowUp className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  disabled={index === arr.length - 1}
                                  onClick={() => moveCategory(category._id, "down")}
                                >
                                  <ArrowDown className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">{category.name}</p>
                            <p className="text-xs text-muted-foreground">{category.key}</p>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={category.is_active}
                              onCheckedChange={(checked) =>
                                toggleCategoryStatusMutation.mutate({ id: category._id, isActive: checked })
                              }
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => onSelectCategoryForEdit(category)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => onDeleteCategory(category)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{dialogMode === "create" ? "Thêm FAQ mới" : "Chỉnh sửa FAQ"}</DialogTitle>
            <DialogDescription>Cấu hình nội dung câu hỏi thường gặp hiển thị cho khách hàng.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="question">Tiêu đề câu hỏi</Label>
              <Input
                id="question"
                value={formData.question}
                onChange={(e) => {
                  const value = e.target.value
                  setFormData((prev) => ({ ...prev, question: value }))
                  if (value.trim()) setFormErrors((prev) => ({ ...prev, question: undefined }))
                }}
                placeholder="Ví dụ: Shop có giao hàng hỏa tốc không?"
              />
              {formErrors.question && <p className="text-sm text-destructive">{formErrors.question}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="answer">Nội dung trả lời</Label>
              <Textarea
                id="answer"
                rows={5}
                value={formData.answer}
                onChange={(e) => {
                  const value = e.target.value
                  setFormData((prev) => ({ ...prev, answer: value }))
                  if (value.trim()) setFormErrors((prev) => ({ ...prev, answer: undefined }))
                }}
                placeholder="Nhập nội dung câu trả lời..."
              />
              {formErrors.answer && <p className="text-sm text-destructive">{formErrors.answer}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Thể loại</Label>
                <Select
                  value={formData.category || undefined}
                  onValueChange={(value) => {
                    setFormData((prev) => ({ ...prev, category: value as FaqCategory }))
                    if (value) setFormErrors((prev) => ({ ...prev, category: undefined }))
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn thể loại" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category._id} value={category.key}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.category && <p className="text-sm text-destructive">{formErrors.category}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="order">Thứ tự trong thể loại</Label>
                <Input
                  id="order"
                  type="number"
                  min={1}
                  value={formData.order}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      order: Number(e.target.value) > 0 ? Number(e.target.value) : 1,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-medium text-sm">Hiển thị FAQ này</p>
                <p className="text-xs text-muted-foreground">Tắt để ẩn khỏi trang người dùng.</p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetFormDialog}>
              Hủy
            </Button>
            <Button
              onClick={submitForm}
              disabled={
                !formData.question.trim() ||
                !formData.answer.trim() ||
                !formData.category ||
                createMutation.isPending ||
                updateMutation.isPending
              }
            >
              {dialogMode === "create" ? "Tạo mới" : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết FAQ</DialogTitle>
            <DialogDescription>Xem nhanh nội dung trước khi chỉnh sửa.</DialogDescription>
          </DialogHeader>

          {selectedFaq && (
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Tiêu đề câu hỏi</p>
                <p className="font-medium">{selectedFaq.question}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Nội dung trả lời</p>
                <p className="text-sm leading-6">{selectedFaq.answer}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge variant="secondary">{categoryNameMap[selectedFaq.category] || selectedFaq.category}</Badge>
                <Badge variant="outline">Thứ tự trong thể loại: {selectedFaq.order}</Badge>
                <Badge className={selectedFaq.is_active ? "bg-green-500" : "bg-gray-500"}>
                  {selectedFaq.is_active ? "Đang hiển thị" : "Đang ẩn"}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground">Cập nhật: {toDateTime(selectedFaq.updated_at)}</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa câu hỏi FAQ?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa FAQ khỏi danh sách quản lý. Bạn có thể tạo lại nếu cần.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={onDeleteFaq}
              disabled={deleteMutation.isPending}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
