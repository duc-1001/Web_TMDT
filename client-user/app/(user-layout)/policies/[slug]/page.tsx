"use client"

import { useMemo } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, BadgeInfo, FileText } from "lucide-react"

import { getPolicyPublicDetail } from "@/services/policy.service"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { PolicyItem } from "@/types/policy"

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
      blocks.push({ type: "heading", level: headingMatch[1].length as 1 | 2 | 3, text: headingMatch[2] })
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
    return <p className="text-muted-foreground">Nội dung chưa có để hiển thị.</p>
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

export default function PolicyDetailPage() {
  const params = useParams<{ slug: string }>()
  const slug = params?.slug

  const { data: policy, isLoading } = useQuery({
    queryKey: ["public-policy-detail", slug],
    queryFn: () => getPolicyPublicDetail(String(slug)),
    enabled: Boolean(slug),
  })

  const markdownBlocks = useMemo(() => parseMarkdownPreview((policy as PolicyItem | undefined)?.content || ""), [policy])

  if (isLoading) {
    return <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">Đang tải...</div>
  }

  if (!policy) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-2">Không tìm thấy chính sách</h1>
        <p className="text-muted-foreground mb-6">Chính sách này có thể đã bị xóa hoặc chưa được xuất bản.</p>
        <Button asChild>
          <Link href="/policies">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại danh sách
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden bg-background py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.10),transparent_35%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.06),transparent_30%)]" />
        <div className="container mx-auto px-4">
          <div className="relative max-w-3xl mx-auto text-center space-y-4">
            <Badge variant="secondary" className="mx-auto px-3 py-1">
              Chính sách công khai
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-balance">{policy.title}</h1>
            <p className="text-muted-foreground">Phiên bản v{policy.version} • Cập nhật {toDate(policy.updated_at)}</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <Card>
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BadgeInfo className="h-4 w-4" />
                  Đường dẫn: /policies/{policy.slug}
                </div>
                <div className="space-y-4">{renderMarkdownBlocks(markdownBlocks)}</div>
              </CardContent>
            </Card>

            <div className="flex justify-between gap-3">
              <Button variant="outline" asChild>
                <Link href="/policies">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Danh sách chính sách
                </Link>
              </Button>
              <Button asChild>
                <Link href="/contact">Liên hệ hỗ trợ</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
