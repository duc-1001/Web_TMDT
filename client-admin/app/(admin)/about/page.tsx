"use client"

import { useEffect, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { ArrowDown, ArrowUp, Award, FilePenLine, Heart, Loader2, Plus, Save, Shield, Trash2, Truck } from "lucide-react"
import { toast } from "sonner"

import { queryClient } from "@/components/QueryClientProviders"
import { getAboutAdmin, updateAboutAdmin } from "@/services/about.service"
import { uploadFile } from "@/services/upload.service"
import type { AboutPayload, AboutSection } from "@/types/about"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

const DEFAULT_TITLE = "Về Snack Việt"
const DEFAULT_SHORT_DESCRIPTION =
    "Chúng tôi mang đến những món ăn vặt chất lượng cao, an toàn và ngon miệng cho mọi gia đình Việt Nam"
const DEFAULT_SECTIONS: AboutSection[] = [
    {
        title: "Câu chuyện của chúng tôi",
        content: "Snack Việt được thành lập vào năm 2020 với mong muốn mang đến cho người Việt những sản phẩm đồ ăn vặt chất lượng, đa dạng và an toàn cho sức khỏe.\n\nChúng tôi tự hào là đối tác tin cậy của hàng ngàn gia đình Việt, cung cấp các sản phẩm từ những thương hiệu uy tín trong và ngoài nước, được kiểm định chặt chẽ về nguồn gốc và chất lượng.\n\nVới đội ngũ tận tâm và hệ thống giao hàng nhanh chóng, chúng tôi cam kết mang đến trải nghiệm mua sắm tuyệt vời nhất cho khách hàng.",
        image: "/vietnamese-snack-store.jpg",
        layout: "text-left",
    },
]



const extractErrorMessage = (error: unknown) => {
    const err = error as { message?: string; response?: { data?: { detail?: { message?: string } | string } } }
    const detail = err?.response?.data?.detail
    if (typeof detail === "string") return detail
    if (typeof detail === "object" && detail?.message) return detail.message
    return err?.message || "Có lỗi xảy ra, vui lòng thử lại"
}

export default function AboutAdminPage() {
    const [title, setTitle] = useState(DEFAULT_TITLE)
    const [shortDescription, setShortDescription] = useState(DEFAULT_SHORT_DESCRIPTION)
    const [sections, setSections] = useState<AboutSection[]>(DEFAULT_SECTIONS)

    const [isInitialized, setIsInitialized] = useState(false)
    const [uploadingSections, setUploadingSections] = useState<Record<number, boolean>>({})

    const { data: about, isLoading } = useQuery({
        queryKey: ["admin-about"],
        queryFn: getAboutAdmin,
    })

    useEffect(() => {
        if (!about || isInitialized) return
        setTitle(about.title || DEFAULT_TITLE)
        setShortDescription(about.content || DEFAULT_SHORT_DESCRIPTION)
        setSections((about.sections && about.sections.length > 0 ? about.sections : DEFAULT_SECTIONS) as AboutSection[])

        setIsInitialized(true)
    }, [about, isInitialized])

    const saveMutation = useMutation({
        mutationFn: (payload: AboutPayload) => updateAboutAdmin(payload),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["admin-about"] })
            toast.success("Đã cập nhật trang About")
        },
        onError: (error) => toast.error(extractErrorMessage(error)),
    })



    const addSection = () => {
        setSections([
            ...sections,
            {
                title: "Phần mới",
                content: "Nhập nội dung tại đây...",
                image: "",
                layout: "text-left",
            },
        ])
    }

    const updateSection = (index: number, updates: Partial<AboutSection>) => {
        const updated = [...sections]
        updated[index] = { ...updated[index], ...updates }
        setSections(updated)
    }

    const removeSection = (index: number) => {
        setSections(sections.filter((_, i) => i !== index))
        setUploadingSections((prev) => {
            const next: Record<number, boolean> = {}
            Object.entries(prev).forEach(([key, value]) => {
                const currentIndex = Number(key)
                if (currentIndex === index) {
                    return
                }
                if (currentIndex < index) {
                    next[currentIndex] = value
                    return
                }
                next[currentIndex - 1] = value
            })
            return next
        })
    }

    const moveSection = (index: number, direction: "up" | "down") => {
        const targetIndex = direction === "up" ? index - 1 : index + 1
        if (targetIndex < 0 || targetIndex >= sections.length) return
        const updated = [...sections]
        ;[updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]]
        setSections(updated)
        setUploadingSections((prev) => {
            const next = { ...prev }
            const a = prev[index]
            const b = prev[targetIndex]
            if (b !== undefined) next[index] = b; else delete next[index]
            if (a !== undefined) next[targetIndex] = a; else delete next[targetIndex]
            return next
        })
    }

    const handleFileUpload = async (index: number, file: File) => {
        if (!file) return

        try {
            setUploadingSections((prev) => ({ ...prev, [index]: true }))
            const response = await uploadFile(file, "system")
            const imageUrl = response?.url
            if (!imageUrl) {
                toast.error("Upload ảnh thất bại")
                return
            }

            updateSection(index, { image: imageUrl })
            toast.success("Upload ảnh thành công")
        } catch (err) {
            toast.error("Upload ảnh thất bại")
        } finally {
            setUploadingSections((prev) => {
                const next = { ...prev }
                delete next[index]
                return next
            })
        }
    }

    const handleSave = async () => {
        if (!title.trim()) {
            toast.error("Vui lòng nhập tiêu đề")
            return
        }
        if (!shortDescription.trim()) {
            toast.error("Vui lòng nhập mô tả ngắn")
            return
        }
        if (sections.length === 0) {
            toast.error("Vui lòng thêm ít nhất một phần nội dung")
            return
        }
        for (let i = 0; i < sections.length; i++) {
            if (!sections[i].title.trim()) {
                toast.error(`Phần ${i + 1}: Vui lòng nhập tiêu đề`)
                return
            }
            if (!sections[i].content.trim()) {
                toast.error(`Phần ${i + 1}: Vui lòng nhập nội dung`)
                return
            }
        }

        await saveMutation.mutateAsync({
            title: title.trim(),
            short_description: shortDescription.trim(),
            sections,
            status: "published",
        })
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <FilePenLine className="h-6 w-6" />
                    Quản lý trang giới thiệu
                </h1>
                <p className="text-muted-foreground">
                    Chỉnh nội dung About với nhiều phần (sections), mỗi phần có ảnh và layout tuỳ chọn (trái/phải).
                </p>
            </div>

            {isLoading ? (
                <Card>
                    <CardContent className="py-8 flex items-center justify-center text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Đang tải dữ liệu About...
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Thông tin chung</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Tiêu đề</label>
                                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Về Snack Việt" />
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-2 block">Mô tả ngắn</label>
                                    <Textarea
                                        value={shortDescription}
                                        onChange={(e) => setShortDescription(e.target.value)}
                                        className="min-h-24 text-sm"
                                        placeholder={DEFAULT_SHORT_DESCRIPTION}
                                    />
                                </div>

                                {about && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Badge variant="outline">v{about.version}</Badge>
                                        <Badge variant="default">Đã xuất bản</Badge>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Các phần nội dung ({sections.length})</CardTitle>
                                    <Button size="sm" onClick={addSection}>
                                        <Plus className="h-4 w-4 mr-1" />
                                        Thêm phần
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {sections.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-6">Chưa có phần nội dung nào</p>
                                ) : (
                                    sections.map((section, idx) => (
                                        <Card key={`section-${idx}`} className="p-4 border">
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-medium">Phần {idx + 1}</h4>
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-7 w-7"
                                                            disabled={idx === 0}
                                                            onClick={() => moveSection(idx, "up")}
                                                            title="Di chuyển lên"
                                                        >
                                                            <ArrowUp className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-7 w-7"
                                                            disabled={idx === sections.length - 1}
                                                            onClick={() => moveSection(idx, "down")}
                                                            title="Di chuyển xuống"
                                                        >
                                                            <ArrowDown className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => removeSection(idx)}
                                                            className="text-destructive hover:text-destructive h-7 w-7 p-0"
                                                            title="Xóa phần này"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-xs font-medium mb-1 block">Tiêu đề phần</label>
                                                    <Input
                                                        value={section.title}
                                                        onChange={(e) => updateSection(idx, { title: e.target.value })}
                                                        placeholder="Tiêu đề phần"
                                                        className="text-sm"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-xs font-medium mb-1 block">Nội dung chi tiết</label>
                                                    <Textarea
                                                        value={section.content}
                                                        onChange={(e) => updateSection(idx, { content: e.target.value })}
                                                        placeholder="Nội dung chi tiết..."
                                                        className="min-h-20 text-sm"
                                                    />
                                                </div>

                                                <div className="grid gap-2 md:grid-cols-2">
                                                    <div>
                                                        <label className="text-xs font-medium mb-1 block">Ảnh URL</label>
                                                        <Input
                                                            value={section.image}
                                                            onChange={(e) => updateSection(idx, { image: e.target.value })}
                                                            placeholder="/image.jpg"
                                                            className="text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium mb-1 block">Hoặc tải file</label>
                                                        <input
                                                            id={`file-upload-${idx}`}
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => {
                                                                if (e.target.files?.[0]) {
                                                                    void handleFileUpload(idx, e.target.files[0])
                                                                }
                                                            }}
                                                            className="text-xs file:text-xs file:py-1 file:px-3 file:border file:border-input file:rounded file:bg-background file:cursor-pointer hover:file:bg-accent"
                                                        />
                                                        {uploadingSections[idx] ? (
                                                            <p className="text-xs text-muted-foreground mt-1">Đang upload ảnh...</p>
                                                        ) : null}
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-xs font-medium mb-1 block">Layout text</label>
                                                    <Select
                                                        value={section.layout}
                                                        onValueChange={(v) => updateSection(idx, { layout: v as "text-left" | "text-right" })}
                                                    >
                                                        <SelectTrigger className="text-sm">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="text-left">Text trái, ảnh phải</SelectItem>
                                                            <SelectItem value="text-right">Text phải, ảnh trái</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </Card>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        <Button onClick={handleSave} disabled={saveMutation.isPending} className="w-full">
                            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Lưu cập nhật
                        </Button>
                    </div>

                    <Card className="xl:sticky xl:top-6 xl:self-start">
                        <CardHeader>
                            <CardTitle>Preview giao diện user</CardTitle>
                            <CardDescription>Xem trước layout thực tế của trang giới thiệu.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="rounded-xl bg-linear-to-br from-primary/10 via-background to-primary/5 p-6 text-center space-y-3">
                                <h2 className="text-2xl font-bold text-balance">{title || DEFAULT_TITLE}</h2>
                                <p className="text-muted-foreground text-sm leading-relaxed">{shortDescription || DEFAULT_SHORT_DESCRIPTION}</p>
                            </div>

                            <Separator />

                            {sections.map((section, idx) => (
                                <div key={`preview-${idx}`}>
                                    <h3 className="font-semibold mb-2">{section.title}</h3>
                                    <div className={`grid ${section.layout === "text-left" ? "md:grid-cols-2" : "md:grid-cols-2"} gap-4 items-center`}>
                                        <div className={section.layout === "text-right" ? "md:order-2" : ""}>
                                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{section.content}</p>
                                        </div>
                                        <div className={section.layout === "text-right" ? "md:order-1" : ""}>
                                            {uploadingSections[idx] ? (
                                                <div className="aspect-video rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        Đang tải ảnh...
                                                    </div>
                                                </div>
                                            ) : section.image ? (
                                                <div className="aspect-video rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                                                    <img src={section.image} alt={section.title} className="h-full w-full object-cover" />
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <Separator />

                            <div className="grid grid-cols-2 gap-3">
                                <Card>
                                    <CardContent className="p-4 text-center">
                                        <Heart className="h-5 w-5 text-primary mx-auto mb-2" />
                                        <p className="text-xs font-medium">Tận tâm</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4 text-center">
                                        <Award className="h-5 w-5 text-primary mx-auto mb-2" />
                                        <p className="text-xs font-medium">Chất lượng</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4 text-center">
                                        <Truck className="h-5 w-5 text-primary mx-auto mb-2" />
                                        <p className="text-xs font-medium">Nhanh chóng</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4 text-center">
                                        <Shield className="h-5 w-5 text-primary mx-auto mb-2" />
                                        <p className="text-xs font-medium">Uy tín</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
