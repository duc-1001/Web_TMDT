"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { Mail, Lock, Eye, EyeOff } from "lucide-react"
import { useForm, Controller } from "react-hook-form"
import { LoginForm, loginSchema } from "@/schemas/login.schema"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { login } from "@/services/auth.service"
import { useRouter, useSearchParams } from "next/navigation"
import { useDispatch } from "react-redux"
import { AppDispatch } from "@/store/store"
import { getBackendUrl } from "@/lib/backend-url"

export default function LoginPage() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const dispatch = useDispatch<AppDispatch>();
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const {
    register,
    formState: { errors, isSubmitting },
    control,
    handleSubmit,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  })


  const onSubmit = async (data: LoginForm) => {
    try {
      const response = await login(data.email.toLowerCase(), data.password);
      dispatch({ type: 'auth/loginSuccess', payload: { user: response.data } });

      toast.success("Đăng nhập thành công! Chào mừng bạn đã quay lại.")
      router.push(redirect)
    } catch (error: any) {
      toast.error(error.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.")
    }
  }

  const handleGoogleLogin = () => {
    window.location.href = `${getBackendUrl()}/api/auth/google/login?prompt=select_account`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const error = params.get("error")

    if (!error) return

    switch (error) {
      case "ACCOUNT_LOCKED":
        toast.error("Tài khoản bị khóa")
        break

      case "USE_PASSWORD_LOGIN":
        toast.error("Email này đăng ký bằng mật khẩu")
        break

      case "GOOGLE_ACCOUNT_NO_EMAIL":
        toast.error("Google không cung cấp email")
        break

      case "SERVER_ERROR":
        toast.error("Lỗi server")
        break

      case "GOOGLE_OAUTH_ERROR":
        toast.error("Lỗi xác thực Google")
        break

      default:
        toast.error("Đăng nhập thất bại")
    }

    // 🔥 xoá query để tránh toast lại khi reload
    window.history.replaceState({}, document.title, "/login")
  }, [])


  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="w-16 h-16 rounded-full bg-orange-600 mx-auto mb-4 flex items-center justify-center text-4xl">
            🍿
          </div>
          <CardTitle className="text-2xl font-bold">Chào mừng trở lại</CardTitle>
          <CardDescription>Đăng nhập để tiếp tục mua sắm</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  {...register("email")}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Controller
                  control={control}
                  name="rememberMe"
                  render={({ field }) => (
                    <Checkbox
                      id="remember"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                  Ghi nhớ đăng nhập
                </Label>
              </div>
              <Link href="/forgot-password" className="text-sm text-orange-500 hover:underline">
                Quên mật khẩu?
              </Link>
            </div>

            <Button type="submit" className="w-full text-white" size="lg" disabled={isSubmitting}>
              Đăng nhập
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Hoặc đăng nhập với</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Button onClick={handleGoogleLogin} variant="outline" type="button">
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Chưa có tài khoản?{" "}
            <Link href="/signup" className="text-orange-500 font-medium hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
