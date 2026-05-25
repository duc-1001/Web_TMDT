"use client"

import { useMemo, useState } from "react"
import { Search, HelpCircle, PhoneCall, Mail, ArrowRight } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { getFaqCategories, getFaqs } from "@/services/faq.service"
import type { FaqCategoryItem, FaqItem } from "@/types/faq"


const resolveCategoryLabel = (category: FaqCategoryItem | { key: string; name?: string } | string) => {
  if (typeof category === "string") return category
  return category.name || category.key
}

export default function FAQPage() {
  const [search, setSearch] = useState("")

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["public-faq-categories"],
    queryFn: getFaqCategories,
  })

  const { data: faqs = [], isLoading: faqsLoading } = useQuery({
    queryKey: ["public-faqs"],
    queryFn: () => getFaqs(),
  })

  const normalizedCategories = useMemo(() => {
    const activeCategories = categories
      .filter((item) => item.is_active)
      .sort((a, b) => a.order - b.order)

    if (activeCategories.length > 0) return activeCategories

    const keys = [...new Set(faqs.map((item) => item.category))]
    return keys.map((key, index) => ({
      _id: key,
      key,
      name: resolveCategoryLabel(key),
      order: index + 1,
      is_active: true,
    }))
  }, [categories, faqs])

  const groupedFaqs = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    const matchedFaqs = faqs
      .filter((item) => item.is_active)
      .filter((item) => {
        if (!keyword) return true
        return item.question.toLowerCase().includes(keyword) || item.answer.toLowerCase().includes(keyword)
      })
      .sort((a, b) => a.order - b.order)

    const grouped = normalizedCategories.map((category) => ({
      ...category,
      items: matchedFaqs.filter((item) => item.category === category.key),
    }))

    const remaining = matchedFaqs.filter((item) => !normalizedCategories.some((category) => category.key === item.category))

    if (remaining.length === 0) {
      return grouped
    }

    return [
      ...grouped,
      {
        _id: "uncategorized",
        key: "uncategorized",
        name: "Khác",
        order: 999,
        is_active: true,
        items: remaining,
      },
    ]
  }, [faqs, normalizedCategories, search])

  const totalFaqCount = faqs.filter((item) => item.is_active).length
  const visibleGroupCount = groupedFaqs.filter((group) => group.items.length > 0).length
  const isLoading = categoriesLoading || faqsLoading
  const hasResults = groupedFaqs.some((group) => group.items.length > 0)

  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden bg-linear-to-br from-orange-500/15 via-background to-amber-500/10 py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.14),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.12),transparent_30%)]" />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center space-y-4">
            <Badge variant="secondary" className="mx-auto px-3 py-1">
              Trung tâm hỗ trợ
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-balance md:text-5xl">Câu hỏi thường gặp</h1>
            <p className="text-lg leading-relaxed text-muted-foreground text-pretty">
              Tìm câu trả lời nhanh cho các thắc mắc phổ biến về đặt hàng, vận chuyển, chất lượng và đổi trả.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo câu hỏi hoặc câu trả lời..."
                className="h-12 rounded-2xl pl-11 shadow-sm"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl space-y-8">
            {isLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardHeader>
                      <Skeleton className="h-7 w-72" />
                    </CardHeader>
                    <CardContent className="space-y-3 pb-6">
                      {[1, 2, 3].map((item) => (
                        <div key={item} className="rounded-xl border p-4">
                          <Skeleton className="h-5 w-4/5" />
                          <Skeleton className="mt-3 h-4 w-full" />
                          <Skeleton className="mt-2 h-4 w-5/6" />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : hasResults ? (
              groupedFaqs
                .filter((group) => group.items.length > 0)
                .map((category) => {

                  return (
                    <Card key={category._id} className="overflow-hidden border-border/60 shadow-sm">
                      <CardHeader className={`bg-linear-to-r`}>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <CardTitle className="text-2xl">{category.name}</CardTitle>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {category.items.length} câu hỏi trong nhóm này
                            </p>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-6">
                        <Accordion type="single" collapsible className="w-full">
                          {category.items.map((item: FaqItem, itemIndex: number) => (
                            <AccordionItem key={item._id} value={`${category.key}-${item._id}-${itemIndex}`}>
                              <AccordionTrigger className="text-left text-base font-medium">
                                {item.question}
                              </AccordionTrigger>
                              <AccordionContent className="leading-relaxed text-muted-foreground">
                                {item.answer}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </CardContent>
                    </Card>
                  )
                })
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <HelpCircle className="h-12 w-12 text-muted-foreground/60" />
                  <h3 className="mt-4 text-xl font-semibold">Không tìm thấy câu trả lời</h3>
                  <p className="mt-2 max-w-lg text-muted-foreground">
                    Thử tìm với từ khóa khác hoặc liên hệ trực tiếp với đội hỗ trợ để được giải đáp nhanh hơn.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <Card className="mx-auto mt-12 max-w-5xl border-orange-200/60 bg-linear-to-r from-orange-50 to-amber-50 shadow-sm">
            <CardContent className="grid gap-6 p-8 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <h3 className="text-xl font-semibold">Không tìm thấy câu trả lời phù hợp?</h3>
                <p className="mt-2 text-muted-foreground">
                  Liên hệ với chúng tôi qua hotline, email hoặc biểu mẫu hỗ trợ để được phản hồi sớm nhất.
                </p>
                <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <PhoneCall className="h-4 w-4 text-orange-500" />
                    Hotline hỗ trợ: 1900-1234
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-orange-500" />
                    Email: support@snackviet.vn
                  </div>
                </div>
              </div>

              <Button asChild size="lg" className="w-fit">
                <Link href="/contact">
                  Liên hệ hỗ trợ
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
