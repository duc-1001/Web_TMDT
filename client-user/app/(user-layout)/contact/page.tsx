"use client"

import type React from "react"

import { useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Clock, Loader2, Mail, MapPin, Phone, Send } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { submitContactMessage } from "@/services/contact.service"
import { getGeneralInfo } from "@/services/system.service"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  })

  const { data: generalInfoResponse } = useQuery({
    queryKey: ["general-info-contact-page"],
    queryFn: getGeneralInfo,
  })

  const submitMutation = useMutation({
    mutationFn: submitContactMessage,
    onSuccess: (response) => {
      toast.success(response.message || "Đã gửi tin nhắn thành công")
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      })
    },
    onError: (error: any) => {
      toast.error(error?.message || "Gửi tin nhắn thất bại. Vui lòng thử lại sau.")
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await submitMutation.mutateAsync(formData)
  }

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const contactInfo = generalInfoResponse?.contactInfo
  const contactAddress =
    [contactInfo?.contactAddress, contactInfo?.ward?.name, contactInfo?.province?.name]
      .filter(Boolean)
      .join(", ") || "123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh"
  const contactEmail = contactInfo?.contactEmail || "support@snackviet.com"
  const contactPhone = contactInfo?.contactPhone || "1900-1234"
  const workingHours = contactInfo?.workingHours || "Thứ 2 - Chủ nhật: 08:00 - 22:00"

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-linear-to-br from-primary/10 via-background to-primary/5 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">Liên hệ với chúng tôi</h1>
            <p className="text-lg text-muted-foreground text-pretty leading-relaxed">
              Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Gửi tin nhắn cho chúng tôi</CardTitle>
                  <CardDescription>Điền thông tin bên dưới và chúng tôi sẽ phản hồi sớm nhất</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Họ và tên</Label>
                        <Input
                          id="name"
                          placeholder="Nguyễn Văn A"
                          value={formData.name}
                          onChange={(e) => updateField("name", e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="email@example.com"
                          value={formData.email}
                          onChange={(e) => updateField("email", e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Số điện thoại</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="0912345678"
                          value={formData.phone}
                          onChange={(e) => updateField("phone", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject">Chủ đề</Label>
                        <Input
                          id="subject"
                          placeholder="Vấn đề cần hỗ trợ"
                          value={formData.subject}
                          onChange={(e) => updateField("subject", e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Nội dung tin nhắn</Label>
                      <Textarea
                        id="message"
                        placeholder="Vui lòng mô tả chi tiết vấn đề của bạn..."
                        rows={6}
                        value={formData.message}
                        onChange={(e) => updateField("message", e.target.value)}
                        required
                      />
                    </div>

                    <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={submitMutation.isPending}>
                      {submitMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Đang gửi...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Gửi tin nhắn
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-orange-600/10 flex items-center justify-center shrink-0">
                      <Mail className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Email</h3>
                      <p className="text-sm text-muted-foreground break-all">{contactEmail}</p>
                    </div>
                  </div>

                  <div className="flex gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-orange-600/10 flex items-center justify-center shrink-0">
                      <Phone className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Hotline</h3>
                      <p className="text-sm text-muted-foreground">{contactPhone}</p>
                    </div>
                  </div>

                  <div className="flex gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-orange-600/10 flex items-center justify-center shrink-0">
                      <MapPin className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Địa chỉ</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{contactAddress}</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-orange-600/10 flex items-center justify-center shrink-0">
                      <Clock className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Giờ làm việc</h3>
                      <p className="text-sm text-muted-foreground">{workingHours}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-3">Kết nối với chúng tôi</h3>
                  <div className="flex gap-3">
                    <Button variant="outline" size="icon">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </Button>
                    <Button variant="outline" size="icon">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      </svg>
                    </Button>
                    <Button variant="outline" size="icon">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                      </svg>
                    </Button>
                    <Button variant="outline" size="icon">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z" />
                      </svg>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
