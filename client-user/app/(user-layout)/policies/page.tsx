"use client"

import Link from "next/link"
import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { FileText, ArrowRight } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getPoliciesPublic } from "@/services/policy.service"
import type { PolicyItem, PolicyType } from "@/types/policy"

const policyTypeLabel: Record<PolicyType, string> = {
  shipping: "Vận chuyển",
  return: "Đổi trả",
  payment: "Thanh toán",
  privacy: "Bảo mật",
  terms: "Điều khoản",
}

const toDate = (iso?: string | null) => {
  if (!iso) return "-"
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleDateString("vi-VN")
}

const createExcerpt = (content: string) => {
  const firstParagraph = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .find((line) => !line.startsWith("#") && !line.startsWith("-") && !/^\d+\./.test(line))

  return (firstParagraph || content.replace(/[#*-]/g, "").trim()).slice(0, 160)
}

export default function PoliciesPage() {
  const { data: policies = [], isLoading } = useQuery({
    queryKey: ["public-policies-page"],
    queryFn: () => getPoliciesPublic(),
  })

  const groupedPolicies = useMemo(() => {
    return [...policies].sort((a, b) => a.type.localeCompare(b.type) || a.version - b.version)
  }, [policies])

  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden bg-background py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.10),transparent_35%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.06),transparent_30%)]" />
        <div className="container mx-auto px-4">
          <div className="relative max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-600/10 mb-6">
              <FileText className="h-8 w-8 text-orange-500" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">Chính sách & quy định</h1>
            <p className="text-lg text-muted-foreground text-balance leading-relaxed">
              Danh sách các chính sách đang được công khai trên hệ thống.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {isLoading ? (
              <div className="text-center py-16 text-muted-foreground">Đang tải dữ liệu...</div>
            ) : groupedPolicies.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {groupedPolicies.map((policy: PolicyItem) => (
                  <Card key={policy._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Badge variant="secondary" className="mb-2">
                            {policyTypeLabel[policy.type]}
                          </Badge>
                          <h2 className="text-xl font-semibold text-balance">{policy.title}</h2>
                        </div>
                        <Badge variant="outline">v{policy.version}</Badge>
                      </div>

                      <p className="text-sm text-muted-foreground leading-relaxed">{createExcerpt(policy.content)}...</p>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Cập nhật: {toDate(policy.updated_at)}</span>
                        <span>{policy.author}</span>
                      </div>

                      <Button asChild className="w-full">
                        <Link href={`/policies/${policy.slug}`}>
                          Xem chi tiết
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">Chưa có chính sách công khai nào.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
