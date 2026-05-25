'use client'
import UserLayout from '@/components/layout/user/user-layout'
import { usePathname, useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { toast } from 'sonner'

export default function RootLayout({ children, }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)
  const router = useRouter()
  const isUserRoute =
    pathname.startsWith('/account') ||
    pathname.startsWith('/wishlist')

  if (!isAuthenticated && isUserRoute) {
    toast.error("Bạn chưa đăng nhập, chuyển hướng đến trang đăng nhập")
    router.push("/")
    return null
  }

  return (
    <UserLayout>
      {children}
    </UserLayout>
  )
}




