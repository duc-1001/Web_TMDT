"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Mail, ArrowLeft } from "lucide-react"
import { forgotPassword } from "@/services/auth.service"
import { set } from "zod"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [messageError, setMessageError] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await forgotPassword(email)
      setIsSubmitted(true)
    } catch (error:any) {
      setMessageError(error.message || "Đã có lỗi xảy ra. Vui lòng thử lại.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="w-16 h-16 rounded-full bg-orange-600/10 mx-auto mb-4 flex items-center justify-center">
              <Mail className="h-8 w-8 text-orange-500" />
            </div>
            <CardTitle className="text-2xl font-bold">Kiểm tra email của bạn</CardTitle>
            <CardDescription>Chúng tôi đã gửi liên kết đặt lại mật khẩu đến email của bạn</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Nếu không thấy email, vui lòng kiểm tra thư mục spam hoặc thử lại sau vài phút.
            </p>
            <Button asChild className="w-full">
              <Link href="/login">Quay lại đăng nhập</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="w-16 h-16 rounded-full bg-orange-600 mx-auto mb-4 flex items-center justify-center text-4xl">
            🍿
          </div>
          <CardTitle className="text-2xl font-bold">Quên mật khẩu?</CardTitle>
          <CardDescription>Nhập email của bạn để nhận liên kết đặt lại mật khẩu</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {messageError && (
              <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">
                {messageError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button disabled={isSubmitting} type="submit" className="w-full text-white" size="lg">
              Gửi liên kết đặt lại mật khẩu
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-orange-500 inline-flex items-center">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Quay lại đăng nhập
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
