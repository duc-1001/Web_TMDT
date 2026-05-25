"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  AlertCircle,
  CheckCircle,
  Clock,
  CreditCard,
  Edit,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
  Save,
  Search,
  Shield,
  Trash2,
  Truck,
} from "lucide-react"
import { toast } from "sonner"

import { queryClient } from "@/components/QueryClientProviders"
import {
  createPolicyAdmin,
  deletePolicyAdmin,
  getPoliciesAdmin,
  updatePolicyAdmin,
  updatePolicyStatusAdmin,
} from "@/services/policy.service"
import type { PolicyItem, PolicyPayload, PolicyStatus, PolicyType } from "@/types/policy"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
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
import useDebounce from "@/hooks/use-debounce"

const policyTypeMeta: Record<PolicyType, { label: string; description: string; icon: React.ReactNode }> = {
  shipping: {
    label: "Chính sách vận chuyển",
    description: "Quy định về giao hàng, phí ship, thời gian",
    icon: <Truck className="h-5 w-5" />,
  },
  return: {
    label: "Chính sách đổi trả",
    description: "Điều kiện và quy trình đổi trả hàng",
    icon: <RefreshCw className="h-5 w-5" />,
  },
  payment: {
    label: "Chính sách thanh toán",
    description: "Phương thức và điều khoản thanh toán",
    icon: <CreditCard className="h-5 w-5" />,
  },
  privacy: {
    label: "Chính sách bảo mật",
    description: "Bảo vệ thông tin khách hàng",
    icon: <Shield className="h-5 w-5" />,
  },
  terms: {
    label: "Điều khoản sử dụng",
    description: "Điều khoản và điều kiện chung",
    icon: <FileText className="h-5 w-5" />,
  },
}

const policyTypes = Object.keys(policyTypeMeta) as PolicyType[]

const statusColors: Record<PolicyStatus, string> = {
  published: "bg-green-100 text-green-700 border-green-200",
  draft: "bg-yellow-100 text-yellow-700 border-yellow-200",
  archived: "bg-gray-100 text-gray-700 border-gray-200",
}

const statusLabels: Record<PolicyStatus, string> = {
  published: "Đã xuất bản",
  draft: "Bản nháp",
  archived: "Lưu trữ",
}

type PolicyFormState = {
  title: string
  type: PolicyType
  content: string
  status: PolicyStatus
  slug: string
}

const defaultFormState: PolicyFormState = {
  title: "",
  type: "shipping",
  content: "",
  status: "draft",
  slug: "",
}

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

const toDate = (iso?: string | null) => {
  if (!iso) return "-"
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleDateString("vi-VN")
}

type MarkdownBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }

const parseMarkdownPreview = (content: string): MarkdownBlock[] => {
  const lines = content.split(/\r?\n/)
  const blocks: MarkdownBlock[] = []

  let index = 0
  while (index < lines.length) {
    const rawLine = lines[index].trim()

    if (!rawLine) {
      index += 1
      continue
    }

    const headingMatch = rawLine.match(/^(#{1,3})\s+(.+)$/)
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length as 1 | 2 | 3,
        text: headingMatch[2],
      })
      index += 1
      continue
    }

    if (/^[-*]\s+/.test(rawLine)) {
      const items: string[] = []
      while (index < lines.length) {
        const listLine = lines[index].trim()
        if (!/^[-*]\s+/.test(listLine)) break
        items.push(listLine.replace(/^[-*]\s+/, ""))
        index += 1
      }
      blocks.push({ type: "ul", items })
      continue
    }

    if (/^\d+\.\s+/.test(rawLine)) {
      const items: string[] = []
      while (index < lines.length) {
        const listLine = lines[index].trim()
        if (!/^\d+\.\s+/.test(listLine)) break
        items.push(listLine.replace(/^\d+\.\s+/, ""))
        index += 1
      }
      blocks.push({ type: "ol", items })
      continue
    }

    const paragraphLines: string[] = [rawLine]
    index += 1
    while (index < lines.length) {
      const nextLine = lines[index].trim()
      if (!nextLine) break
      if (/^(#{1,3})\s+/.test(nextLine) || /^[-*]\s+/.test(nextLine) || /^\d+\.\s+/.test(nextLine)) break
      paragraphLines.push(nextLine)
      index += 1
    }

    blocks.push({ type: "paragraph", text: paragraphLines.join(" ") })
  }

  return blocks
}

const renderMarkdownBlocks = (blocks: MarkdownBlock[]) => {
  if (blocks.length === 0) {
    return <p className="text-muted-foreground">Nội dung chưa có để xem trước.</p>
  }

  return blocks.map((block, blockIndex) => {
    if (block.type === "heading") {
      const HeadingTag = block.level === 1 ? "h1" : block.level === 2 ? "h2" : "h3"
      return (
        <HeadingTag
          key={`heading-${blockIndex}`}
          className={
            block.level === 1
              ? "text-2xl font-bold"
              : block.level === 2
                ? "text-xl font-semibold"
                : "text-lg font-semibold"
          }
        >
          {block.text}
        </HeadingTag>
      )
    }

    if (block.type === "ul") {
      return (
        <ul key={`ul-${blockIndex}`} className="ml-6 list-disc space-y-2 text-muted-foreground">
          {block.items.map((item, itemIndex) => (
            <li key={`${blockIndex}-${itemIndex}`}>{item}</li>
          ))}
        </ul>
      )
    }

    if (block.type === "ol") {
      return (
        <ol key={`ol-${blockIndex}`} className="ml-6 list-decimal space-y-2 text-muted-foreground">
          {block.items.map((item, itemIndex) => (
            <li key={`${blockIndex}-${itemIndex}`}>{item}</li>
          ))}
        </ol>
      )
    }

    return (
      <p key={`paragraph-${blockIndex}`} className="leading-7 text-muted-foreground">
        {block.text}
      </p>
    )
  })
}

const extractErrorMessage = (error: unknown) => {
  const err = error as { message?: string; response?: { data?: { detail?: { message?: string } | string } } }
  const detail = err?.response?.data?.detail
  if (typeof detail === "string") return detail
  if (typeof detail === "object" && detail?.message) return detail.message
  return err?.message || "Có lỗi xảy ra, vui lòng thử lại"
}

export default function PoliciesPage() {
  const [activeTab, setActiveTab] = useState<PolicyType | "all">("all")
  const [keyword, setKeyword] = useState("")
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<PolicyItem | null>(null)
  const [previewPolicy, setPreviewPolicy] = useState<PolicyItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PolicyItem | null>(null)
  const [formMode, setFormMode] = useState<"create" | "edit">("create")
  const [formData, setFormData] = useState<PolicyFormState>(defaultFormState)
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false)
  const [formErrors, setFormErrors] = useState<{ title?: string; content?: string }>({})

  const debouncedKeyword = useDebounce(keyword, 400)

  const { data, isLoading } = useQuery({
    queryKey: ["admin-policies", activeTab, debouncedKeyword],
    queryFn: () =>
      getPoliciesAdmin({
        page: 1,
        limit: 100,
        type: activeTab === "all" ? undefined : activeTab,
        q: debouncedKeyword || undefined,
      }),
  })

  const policies = useMemo(() => data?.data || [], [data])

  const stats = useMemo(() => {
    const total = policies.length
    const published = policies.filter((item) => item.status === "published").length
    const draft = policies.filter((item) => item.status === "draft").length
    const archived = policies.filter((item) => item.status === "archived").length
    return { total, published, draft, archived }
  }, [policies])

  const invalidatePolicies = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin-policies"] })
  }

  const createMutation = useMutation({
    mutationFn: createPolicyAdmin,
    onSuccess: async () => {
      await invalidatePolicies()
      toast.success("Tạo policy thành công")
      setIsEditorOpen(false)
      setEditingPolicy(null)
      setFormData(defaultFormState)
      setFormErrors({})
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PolicyPayload }) => updatePolicyAdmin(id, payload),
    onSuccess: async () => {
      await invalidatePolicies()
      toast.success("Cập nhật policy thành công")
      setIsEditorOpen(false)
      setEditingPolicy(null)
      setFormErrors({})
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PolicyStatus }) => updatePolicyStatusAdmin(id, status),
    onSuccess: async () => {
      await invalidatePolicies()
      toast.success("Đã cập nhật trạng thái")
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: deletePolicyAdmin,
    onSuccess: async () => {
      await invalidatePolicies()
      toast.success("Xóa policy thành công")
      setDeleteTarget(null)
    },
    onError: (error) => toast.error(extractErrorMessage(error)),
  })

  const openCreateDialog = (type: PolicyType) => {
    setFormMode("create")
    setEditingPolicy(null)
    setFormData({ ...defaultFormState, type, title: policyTypeMeta[type].label })
    setIsSlugManuallyEdited(false)
    setFormErrors({})
    setIsEditorOpen(true)
  }

  const openEditDialog = (policy: PolicyItem) => {
    setFormMode("edit")
    setEditingPolicy(policy)
    setFormData({
      title: policy.title,
      type: policy.type,
      content: policy.content,
      status: policy.status,
      slug: policy.slug,
    })
    setIsSlugManuallyEdited(Boolean(policy.slug))
    setFormErrors({})
    setIsEditorOpen(true)
  }

  const openPreviewDialog = (policy: PolicyItem) => {
    setPreviewPolicy(policy)
    setIsPreviewOpen(true)
  }

  const validateForm = () => {
    const nextErrors: { title?: string; content?: string } = {}
    if (!formData.title.trim()) nextErrors.title = "Vui lòng nhập tiêu đề"
    if (!formData.content.trim()) nextErrors.content = "Vui lòng nhập nội dung"
    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    const payload: PolicyPayload = {
      type: formData.type,
      title: formData.title.trim(),
      content: formData.content.trim(),
      status: formData.status,
      slug: toSlug(formData.slug.trim()) || undefined,
    }

    if (formMode === "create") {
      await createMutation.mutateAsync(payload)
      return
    }

    if (!editingPolicy) return
    await updateMutation.mutateAsync({ id: editingPolicy._id, payload })
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await deleteMutation.mutateAsync(deleteTarget._id)
  }

  const liveMarkdownBlocks = useMemo(() => {
    return parseMarkdownPreview(formData.content || "")
  }, [formData.content])

  const previewMarkdownBlocks = useMemo(() => {
    return parseMarkdownPreview(previewPolicy?.content || "")
  }, [previewPolicy?.content])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Quản lý chính sách
          </h1>
          <p className="text-muted-foreground">Quản lý các chính sách và nội dung website bằng dữ liệu thật từ backend</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng chính sách</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Đã xuất bản</p>
                <p className="text-2xl font-bold">{stats.published}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bản nháp</p>
                <p className="text-2xl font-bold">{stats.draft}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lưu trữ</p>
                <p className="text-2xl font-bold">{stats.archived}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Loại chính sách</CardTitle>
          <CardDescription>Nhấn vào từng loại để tạo mới hoặc chỉnh sửa policy đã có</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {policyTypes.map((type) => {
              const item = policies.find((policy) => policy.type === type)
              return (
                <Card
                  key={type}
                  className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/50"
                  onClick={() => (item ? openEditDialog(item) : openCreateDialog(type))}
                >
                  <CardContent className="p-4 text-center">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                      {policyTypeMeta[type].icon}
                    </div>
                    <h4 className="font-medium text-sm mb-1">{policyTypeMeta[type].label}</h4>
                    {item ? (
                      <Badge className={statusColors[item.status]} variant="outline">
                        v{item.version}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-50">
                        Chưa có
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>Danh sách chính sách</CardTitle>
            <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Tìm theo tiêu đề hoặc slug..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as PolicyType | "all")}>
                <TabsList>
                  <TabsTrigger value="all">Tất cả</TabsTrigger>
                  <TabsTrigger value="shipping">Vận chuyển</TabsTrigger>
                  <TabsTrigger value="return">Đổi trả</TabsTrigger>
                  <TabsTrigger value="payment">Thanh toán</TabsTrigger>
                  <TabsTrigger value="privacy">Bảo mật</TabsTrigger>
                  <TabsTrigger value="terms">Điều khoản</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="py-8 flex items-center justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Đang tải dữ liệu...
              </div>
            ) : policies.length > 0 ? (
              policies.map((policy) => {
                const typeInfo = policyTypeMeta[policy.type]
                return (
                  <div
                    key={policy._id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-muted rounded-lg">{typeInfo?.icon}</div>
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-semibold">{policy.title}</h4>
                          <Badge className={statusColors[policy.status]} variant="outline">
                            {statusLabels[policy.status]}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{typeInfo?.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          <span>Phiên bản: v{policy.version}</span>
                          <span>Cập nhật: {toDate(policy.updated_at)}</span>
                          <span>Tác giả: {policy.author}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-auto flex-wrap justify-end">
                      <Select
                        value={policy.status}
                        onValueChange={(status) =>
                          updateStatusMutation.mutate({
                            id: policy._id,
                            status: status as PolicyStatus,
                          })
                        }
                      >
                        <SelectTrigger className="w-35">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="published">Đã xuất bản</SelectItem>
                          <SelectItem value="draft">Bản nháp</SelectItem>
                          <SelectItem value="archived">Lưu trữ</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button variant="outline" size="sm" onClick={() => openPreviewDialog(policy)}>
                        <Eye className="h-4 w-4 mr-1" />
                        Xem
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(policy)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Sửa
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(policy)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Chưa có chính sách nào trong bộ lọc hiện tại</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="w-[96vw] max-w-none sm:max-w-5xl lg:max-w-7xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{formMode === "create" ? "Tạo chính sách mới" : "Chỉnh sửa chính sách"}</DialogTitle>
            <DialogDescription>
              {policyTypeMeta[formData.type]?.description}. Nếu để trống slug, hệ thống sẽ tự tạo từ tiêu đề.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Tiêu đề</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => {
                      const nextTitle = e.target.value
                      setFormData((current) => ({
                        ...current,
                        title: nextTitle,
                        slug: isSlugManuallyEdited ? current.slug : toSlug(nextTitle),
                      }))
                    }}
                    placeholder="Tiêu đề chính sách"
                  />
                  {formErrors.title ? <p className="mt-1 text-xs font-medium text-red-500">{formErrors.title}</p> : null}
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Loại chính sách</label>
                  <Select value={formData.type} onValueChange={(v) => setFormData((current) => ({ ...current, type: v as PolicyType }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {policyTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {policyTypeMeta[type].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Slug (tuỳ chọn)</label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => {
                      setIsSlugManuallyEdited(true)
                      setFormData((current) => ({ ...current, slug: e.target.value }))
                    }}
                    onBlur={() => {
                      setFormData((current) => ({ ...current, slug: toSlug(current.slug) }))
                    }}
                    placeholder="chinh-sach-van-chuyen"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Format slug: chỉ chữ thường không dấu, số và dấu gạch ngang -. Ví dụ: chinh-sach-doi-tra.
                  </p>
                  {!formData.slug.trim() ? (
                    <p className="mt-1 text-xs text-blue-600">Slug tự tạo dự kiến: {toSlug(formData.title) || "policy"}</p>
                  ) : null}
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Trạng thái</label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) => setFormData((current) => ({ ...current, status: v as PolicyStatus }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="published">Đã xuất bản</SelectItem>
                      <SelectItem value="draft">Bản nháp</SelectItem>
                      <SelectItem value="archived">Lưu trữ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Nội dung (Markdown)</label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData((current) => ({ ...current, content: e.target.value }))}
                  placeholder="Nhập nội dung chính sách..."
                  className="min-h-100 font-mono text-sm"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Gợi ý trình bày: dùng # cho tiêu đề, ## cho mục con, - cho danh sách, xuống dòng để tách đoạn.
                </p>
                {formErrors.content ? <p className="mt-1 text-xs font-medium text-red-500">{formErrors.content}</p> : null}
              </div>
            </div>

            <div className="rounded-2xl border bg-muted/20 p-4 lg:sticky lg:top-0 lg:self-start">
              <div className="mb-4">
                <p className="text-sm font-medium">Preview trực tiếp</p>
                <p className="text-xs text-muted-foreground">Nhìn trước đúng nội dung bạn đang nhập</p>
              </div>
              <Separator className="mb-4" />
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {renderMarkdownBlocks(liveMarkdownBlocks)}
              </div>
            </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Phiên bản hiện tại: v{editingPolicy?.version || 1}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditorOpen(false)}>
                  Hủy
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {formMode === "create" ? "Tạo chính sách" : "Lưu thay đổi"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="w-[96vw] max-w-none sm:max-w-4xl lg:max-w-6xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewPolicy?.title}</DialogTitle>
            <DialogDescription>Xem trước nội dung chính sách</DialogDescription>
          </DialogHeader>

          {previewPolicy ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Badge className={statusColors[previewPolicy.status]} variant="outline">
                  {statusLabels[previewPolicy.status]}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Phiên bản v{previewPolicy.version} - Cập nhật {toDate(previewPolicy.updated_at)}
                </span>
              </div>
              <Separator className="my-4" />
              <div className="space-y-4">
                {renderMarkdownBlocks(previewMarkdownBlocks)}
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Đóng
            </Button>
            <Button
              onClick={() => {
                setIsPreviewOpen(false)
                if (previewPolicy) openEditDialog(previewPolicy)
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Chỉnh sửa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa chính sách?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Bạn có chắc muốn xóa "${deleteTarget.title}" không? Hành động này không thể hoàn tác.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
