"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, User, Eye, EyeOff } from "lucide-react"
import { useForm } from "react-hook-form"
import { LoginForm, loginSchema } from "@/schemas/login.schema"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { login } from "@/services/auth.service" // Lưu ý: Cần đổi sang service admin nếu bạn tách bảng
import { useRouter, useSearchParams } from "next/navigation"
import { useDispatch } from "react-redux"
import { AppDispatch } from "@/store/store"
import { fetchMe } from "@/store/slices/authSlice"

export default function AdminLoginPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: LoginForm) => {
    try {
      // Nếu bạn đã tạo API riêng cho admin, hãy đổi hàm login này
      await login(data.email.toLowerCase(), data.password);
      await dispatch(fetchMe())

      const redirectTo = searchParams.get("redirect") || "/"

      toast.success("Hệ thống xác thực thành công. Đang chuyển hướng...")
      router.replace(redirectTo)
    } catch (error: any) {
      toast.error(error.message || "Thông tin quản trị không chính xác.")
    }
  }

  return (
    <div className="min-h-screen  flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg ">
        <CardHeader className="space-y-1 text-center">
          <div className="w-12 h-12 rounded-lg bg-primary mx-auto mb-4 flex items-center justify-center">
            <Lock className="text-white h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold uppercase tracking-wider">Hệ thống Quản trị</CardTitle>
          <CardDescription className="text-slate-400">Vui lòng đăng nhập để tiếp tục</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Tài khoản Admin</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@system.com"
                  {...register("email")}
                  className="pl-10  focus:ring-primary"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Mật khẩu</Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  className="pl-10 pr-10  focus:ring-primary"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              
              </div>
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-6" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang xác thực..." : "ĐĂNG NHẬP HỆ THỐNG"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}