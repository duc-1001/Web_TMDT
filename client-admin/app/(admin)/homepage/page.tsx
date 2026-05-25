"use client"

import { useState, useRef, useEffect } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  GripVertical, Eye, EyeOff, Save, RotateCcw, LayoutDashboard,
  Star, Tag, Sparkles, Plus, Trash2, CheckCircle2, Info,
  Search, X, Package, ChevronDown, ChevronUp,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getSettingBySection, updateSettingBySection } from "@/services/system.service"
import { getProductForSelect } from "@/services/product.service"
import { queryClient } from "@/components/QueryClientProviders"

// ─── Types ────────────────────────────────────────────────
type SectionType = "fixed" | "custom"

interface ProductItem {
  id: string
  name: string
  image?: string
}

interface Section {
  id: string
  label: string
  type: SectionType
  enabled: boolean
  order: number
  itemCount: number
  // custom only
  productIds?: string[]
  products?: ProductItem[]
}

// ─── Fixed sections (không xóa được) ─────────────────────
const FIXED_SECTIONS: Omit<Section, "order">[] = [
  {
    id: "featured",
    label: "Sản phẩm nổi bật",
    type: "fixed",
    enabled: true,
    itemCount: 10,
  },
  {
    id: "sale",
    label: "Đang giảm giá",
    type: "fixed",
    enabled: true,
    itemCount: 10,
  },
  {
    id: "new_arrivals",
    label: "Sản phẩm mới",
    type: "fixed",
    enabled: true,
    itemCount: 10,
  },
]

const FIXED_ICONS: Record<string, React.ReactNode> = {
  featured: <Star className="h-4 w-4" />,
  sale: <Tag className="h-4 w-4" />,
  new_arrivals: <Sparkles className="h-4 w-4" />,
}

const FIXED_COLORS: Record<string, string> = {
  featured: "text-orange-500",
  sale: "text-red-500",
  new_arrivals: "text-emerald-500",
}

// ─── Merge server → local state ───────────────────────────
function mergeFromServer(serverData: any): Section[] {
  const serverSections: any[] = serverData?.sections ?? []
  const serverMap: Record<string, any> = {}
  for (const s of serverSections) serverMap[s.id] = s

  // Fixed sections
  const fixed: Section[] = FIXED_SECTIONS.map((def, i) => ({
    ...def,
    order: serverMap[def.id]?.order ?? i,
    enabled: serverMap[def.id]?.enabled ?? def.enabled,
    itemCount: serverMap[def.id]?.itemCount ?? def.itemCount,
  }))

  // Custom sections
  const custom: Section[] = serverSections
    .filter((s) => s.type === "custom")
    .map((s) => ({
      id: s.id,
      label: s.label,
      type: "custom" as SectionType,
      enabled: s.enabled ?? true,
      order: s.order,
      itemCount: s.productIds?.length ?? 0,
      productIds: s.productIds ?? [],
      products: s.products ?? [],
    }))

  return [...fixed, ...custom].sort((a, b) => a.order - b.order)
}

// ─── Product Search Picker ────────────────────────────────
function ProductPicker({
  selected,
  onChange,
}: {
  selected: ProductItem[]
  onChange: (items: ProductItem[]) => void
}) {
  const [q, setQ] = useState("")
  const [open, setOpen] = useState(false)

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["product-select", q],
    queryFn: () => getProductForSelect(q, 20),
    enabled: open,
  })

  const selectedIds = new Set(selected.map((p) => p.id))

  const toggle = (p: any) => {
    if (selectedIds.has(p._id)) {
      onChange(selected.filter((s) => s.id !== p._id))
    } else {
      onChange([...selected, { id: p._id, name: p.name, image: p.image }])
    }
  }

  return (
    <div className="space-y-3">
      {/* selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((p) => (
            <span
              key={p.id}
              className="flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs font-medium"
            >
              {p.name}
              <button
                type="button"
                onClick={() => onChange(selected.filter((s) => s.id !== p.id))}
                className="ml-0.5 text-muted-foreground hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* search */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm text-primary hover:underline"
      >
        <Search className="h-3.5 w-3.5" />
        {open ? "Đóng tìm kiếm" : "Tìm & thêm sản phẩm"}
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {open && (
        <div className="rounded-xl border bg-muted/20 p-3 space-y-2">
          <Input
            placeholder="Tìm sản phẩm..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-8 text-sm"
          />
          <div className="max-h-48 overflow-y-auto space-y-1">
            {isFetching && (
              <p className="text-xs text-muted-foreground px-1 py-2">Đang tìm...</p>
            )}
            {!isFetching && results.length === 0 && (
              <p className="text-xs text-muted-foreground px-1 py-2">Không tìm thấy</p>
            )}
            {results.map((p: any) => {
              const isSelected = selectedIds.has(p._id)
              return (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => toggle(p)}
                  className={`w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors
                    ${isSelected ? "bg-primary/15 text-primary" : "hover:bg-muted/60"}`}
                >
                  {p.image ? (
                    <img src={p.image} alt="" className="h-7 w-7 rounded object-cover shrink-0" />
                  ) : (
                    <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className="flex-1 truncate">{p.name}</span>
                  {isSelected && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Add Custom Section Dialog (inline) ──────────────────
function AddCustomPanel({ onAdd }: { onAdd: (s: Section) => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [products, setProducts] = useState<ProductItem[]>([])

  const submit = () => {
    if (!name.trim()) { toast.error("Vui lòng nhập tên section"); return }
    onAdd({
      id: `custom_${Date.now()}`,
      label: name.trim(),
      type: "custom",
      enabled: true,
      order: 999,
      itemCount: products.length,
      productIds: products.map((p) => p.id),
      products,
    })
    setName("")
    setProducts([])
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 py-4 text-sm font-medium text-primary/70 hover:border-primary/60 hover:text-primary hover:bg-primary/5 transition-all"
      >
        <Plus className="h-4 w-4" />
        Thêm section tùy chỉnh
      </button>
    )
  }

  return (
    <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-sm">Section mới</span>
        <button onClick={() => setOpen(false)}>
          <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </button>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Tên section</Label>
        <Input
          placeholder="VD: Đặc sản miền Trung..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-9"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Sản phẩm hiển thị ({products.length} đã chọn)</Label>
        <ProductPicker selected={products} onChange={setProducts} />
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Hủy</Button>
        <Button size="sm" onClick={submit}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Thêm
        </Button>
      </div>
    </div>
  )
}

// ─── Section Row ──────────────────────────────────────────
interface RowProps {
  section: Section
  index: number
  onToggle: () => void
  onChangeCount: (v: number) => void
  onDragStart: () => void
  onDragEnter: () => void
  onDragEnd: () => void
  onDelete?: () => void
  onChangeProducts?: (items: ProductItem[]) => void
}

function SectionRow({
  section, index, onToggle, onChangeCount,
  onDragStart, onDragEnter, onDragEnd,
  onDelete, onChangeProducts,
}: RowProps) {
  const [dragging, setDragging] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const isFixed = section.type === "fixed"

  return (
    <div
      draggable
      onDragStart={() => { setDragging(true); onDragStart() }}
      onDragEnter={onDragEnter}
      onDragEnd={() => { setDragging(false); onDragEnd() }}
      onDragOver={(e) => e.preventDefault()}
      className={`rounded-xl border transition-all duration-150 ${
        dragging ? "opacity-40 scale-95 border-primary/40 bg-primary/5" : "hover:shadow-sm"
      } ${!section.enabled ? "opacity-60" : ""}`}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 p-4">
        <GripVertical className="h-5 w-5 text-muted-foreground/40 hover:text-muted-foreground shrink-0 cursor-grab active:cursor-grabbing" />

        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-mono text-muted-foreground shrink-0">
          {index + 1}
        </span>

        {/* Icon (fixed only) */}
        {isFixed && (
          <span className={`shrink-0 ${FIXED_COLORS[section.id] ?? "text-primary"}`}>
            {FIXED_ICONS[section.id]}
          </span>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{section.label}</span>
            {isFixed && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">Cố định</Badge>
            )}
            {!isFixed && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/20">
                Tùy chỉnh
              </Badge>
            )}
            {!section.enabled && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 opacity-60">Ẩn</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isFixed
              ? `Hiển thị ${section.itemCount} sản phẩm`
              : `${section.productIds?.length ?? 0} sản phẩm được chọn`}
          </p>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Item count (fixed only) */}
          {isFixed && (
            <div className="flex items-center gap-1.5 rounded-lg border bg-muted/40 px-2 py-1">
              <button
                onClick={() => onChangeCount(Math.max(5, section.itemCount - 5))}
                className="text-muted-foreground hover:text-foreground text-xs font-bold px-0.5"
              >−</button>
              <span className="text-xs font-mono w-4 text-center">{section.itemCount}</span>
              <button
                onClick={() => onChangeCount(Math.min(20, section.itemCount + 5))}
                className="text-muted-foreground hover:text-foreground text-xs font-bold px-0.5"
              >+</button>
            </div>
          )}

          {/* Expand (custom only) */}
          {!isFixed && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-muted-foreground hover:text-foreground p-1 rounded"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}

          {/* Toggle */}
          {section.enabled
            ? <Eye className="h-4 w-4 text-muted-foreground/60" />
            : <EyeOff className="h-4 w-4 text-muted-foreground/40" />}
          <Switch
            checked={section.enabled}
            onCheckedChange={onToggle}
          />

          {/* Delete (custom only) */}
          {!isFixed && onDelete && (
            <button
              onClick={onDelete}
              className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded: product picker for custom */}
      {!isFixed && expanded && (
        <div className="border-t px-4 pb-4 pt-3">
          <Label className="text-xs text-muted-foreground mb-2 block">
            Sản phẩm hiển thị ({section.products?.length ?? 0} đã chọn)
          </Label>
          <ProductPicker
            selected={section.products ?? []}
            onChange={(items) => onChangeProducts?.(items)}
          />
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────
export default function HomepageManagerPage() {
  const [sections, setSections] = useState<Section[]>(() =>
    FIXED_SECTIONS.map((s, i) => ({ ...s, order: i }))
  )
  const [isDirty, setIsDirty] = useState(false)
  const [saved, setSaved] = useState(false)

  const dragItem = useRef<number | null>(null)

  // Fetch
  const { data: serverData, isLoading } = useQuery({
    queryKey: ["settings", "homepage"],
    queryFn: () => getSettingBySection<any>("homepage"),
  })

  useEffect(() => {
    if (serverData !== undefined) {
      setSections(mergeFromServer(serverData))
      setIsDirty(false)
    }
  }, [serverData])

  // Save
  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: () =>
      updateSettingBySection("homepage", {
        sections: sections.map((s) => ({
          id: s.id,
          label: s.label,
          type: s.type,
          enabled: s.enabled,
          order: s.order,
          itemCount: s.itemCount,
          ...(s.type === "custom"
            ? { productIds: s.productIds ?? [], products: s.products ?? [] }
            : {}),
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "homepage"] })
      setIsDirty(false)
      setSaved(true)
      toast.success("Đã lưu cấu hình trang chủ!")
      setTimeout(() => setSaved(false), 3000)
    },
    onError: () => toast.error("Lưu thất bại, vui lòng thử lại!"),
  })

  const mark = () => setIsDirty(true)

  // Toggle
  const toggle = (id: string) => {
    setSections((prev) => prev.map((s) => s.id === id ? { ...s, enabled: !s.enabled } : s))
    mark()
  }

  // Item count
  const changeCount = (id: string, v: number) => {
    setSections((prev) => prev.map((s) => s.id === id ? { ...s, itemCount: v } : s))
    mark()
  }

  // Drag
  const onDragStart = (index: number) => { dragItem.current = index }
  const onDragEnter = (index: number) => {
    if (dragItem.current === null || dragItem.current === index) return
    setSections((prev) => {
      const next = [...prev]
      const moved = next.splice(dragItem.current!, 1)[0]
      next.splice(index, 0, moved)
      dragItem.current = index
      return next.map((s, i) => ({ ...s, order: i }))
    })
  }
  const onDragEnd = () => { dragItem.current = null; mark() }

  // Delete custom
  const deleteSection = (id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i })))
    mark()
  }

  // Change products (custom)
  const changeProducts = (id: string, items: ProductItem[]) => {
    setSections((prev) => prev.map((s) =>
      s.id === id
        ? { ...s, products: items, productIds: items.map((p) => p.id), itemCount: items.length }
        : s
    ))
    mark()
  }

  // Add custom
  const addCustom = (s: Section) => {
    setSections((prev) => [...prev, { ...s, order: prev.length }].map((x, i) => ({ ...x, order: i })))
    mark()
  }

  // Reset
  const handleReset = () => {
    setSections(mergeFromServer(serverData))
    setIsDirty(false)
    toast.info("Đã hoàn tác thay đổi")
  }

  const enabledCount = sections.filter((s) => s.enabled).length

  return (
    <div className="w-full space-y-5">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                <LayoutDashboard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Quản lý section sản phẩm</CardTitle>
                <CardDescription className="mt-0.5">
                  Kéo thả để sắp xếp, chỉnh số lượng item, thêm section tùy chỉnh
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {enabledCount}/{sections.length} đang hiển thị
              </Badge>
              {isDirty && (
                <Button variant="ghost" size="sm" onClick={handleReset} disabled={isSaving}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Hoàn tác
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => save()}
                disabled={!isDirty || isSaving}
                className="min-w-[100px]"
              >
                {saved ? (
                  <><CheckCircle2 className="h-4 w-4 mr-1 text-green-400" />Đã lưu</>
                ) : (
                  <><Save className="h-4 w-4 mr-1" />{isSaving ? "Đang lưu..." : "Lưu"}</>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Info */}
      <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <span>
          <strong>3 section cố định</strong> (Nổi bật, Giảm giá, Mới về) không thể xóa — chỉ có thể bật/tắt, đổi thứ tự và chỉnh số lượng item.
          Bạn có thể thêm <strong>section tùy chỉnh</strong> với danh sách sản phẩm tự chọn.
        </span>
      </div>

      {/* List */}
      <Card>
        <CardContent className="p-4 space-y-2">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {sections.map((section, index) => (
                <SectionRow
                  key={section.id}
                  section={section}
                  index={index}
                  onToggle={() => toggle(section.id)}
                  onChangeCount={(v) => changeCount(section.id, v)}
                  onDragStart={() => onDragStart(index)}
                  onDragEnter={() => onDragEnter(index)}
                  onDragEnd={onDragEnd}
                  onDelete={section.type === "custom" ? () => deleteSection(section.id) : undefined}
                  onChangeProducts={(items) => changeProducts(section.id, items)}
                />
              ))}

              <div className="pt-2">
                <AddCustomPanel onAdd={addCustom} />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Preview thứ tự trang chủ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {sections
              .filter((s) => s.enabled)
              .map((s, i) => (
                <div
                  key={s.id}
                  className="flex items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1 text-sm"
                >
                  <span className="text-muted-foreground font-mono text-xs">{i + 1}.</span>
                  {s.type === "fixed" && (
                    <span className={FIXED_COLORS[s.id] ?? "text-primary"}>
                      {FIXED_ICONS[s.id]}
                    </span>
                  )}
                  <span className="font-medium">{s.label}</span>
                </div>
              ))}
          </div>
          {sections.some((s) => !s.enabled) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {sections
                .filter((s) => !s.enabled)
                .map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-1.5 rounded-full border border-dashed opacity-40 px-3 py-1 text-sm"
                  >
                    <EyeOff className="h-3 w-3" />
                    <span>{s.label}</span>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
