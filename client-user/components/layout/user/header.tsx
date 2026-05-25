"use client"

import type React from "react"

import Link from "next/link"
import { Search, Menu, Heart, User, ShoppingBag, Tag, LogOut, ShoppingCart, LogIn, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CartSheet } from "@/components/cart-sheet"
import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useDispatch, useSelector } from "react-redux"
import { AppDispatch, RootState } from "@/store/store"
import { fetchLogout } from "@/store/slices/authSlice"

export function Header() {
  const { generalInfo } = useSelector((state: RootState) => state.generalInfo);
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>()
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleLogout = () => {
    try {
      dispatch(fetchLogout())

    } catch (error) {
      console.error("Đăng xuất thất bại:", error)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      {/* <div className="bg-orange-600 text-orange-500-foreground py-2 text-center text-sm font-medium">
        Miễn phí vận chuyển cho đơn hàng trên 200.000đ 🎉
      </div> */}

      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="items-center gap-2 hidden md:flex">
            <img src={generalInfo?.logo || "/placeholder.svg"} alt={generalInfo?.shortName || "Snack Việt"} className="h-14 w-14 rounded-full object-cover" />
            <span className="font-bold text-xl hidden sm:inline-block text-balance">{generalInfo?.shortName}</span>
          </Link>

          <SidebarTrigger className="md:hidden">
            <Menu className="h-5 w-5" />
          </SidebarTrigger>

          {/* <form onSubmit={handleSearch} className="flex-1 max-w-md hidden md:flex">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Tìm kiếm snack yêu thích..."
                className="pl-10 bg-muted/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form> */}

          <div className="flex items-center gap-2">
            {/* <Button variant="ghost" size="icon" className="hidden md:flex">
              <Heart className="h-5 w-5" />
            </Button> */}
            {
              isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.fullName || "User"} />
                        <AvatarFallback className="bg-orange-400 text-orange-500-foreground">
                          {user?.fullName ? user.fullName.charAt(0).toUpperCase() : <User className="h-5 w-5" />}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/account" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Tài khoản của tôi</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/cart" className="cursor-pointer">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        <span>Giỏ hàng</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/orders" className="cursor-pointer">
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        <span>Đơn hàng</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/wishlist" className="cursor-pointer">
                        <Heart className="mr-2 h-4 w-4" />
                        <span>Danh sách yêu thích</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/refunds" className="cursor-pointer">
                        <Tag className="mr-2 h-4 w-4" />
                        <span>Yêu cầu hoàn tiền</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Đăng xuất</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) :
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-lg">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48" align="end" forceMount>
                    <DropdownMenuItem asChild>
                      <Link href="/cart" className="cursor-pointer">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        <span>Giỏ hàng</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/login" className="cursor-pointer">
                        <LogIn className="mr-2 h-4 w-4" />
                        <span>Đăng nhập</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/signup" className="cursor-pointer">
                        <UserPlus className="mr-2 h-4 w-4" />
                        <span>Đăng ký</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            }
            <CartSheet />
          </div>
        </div>

        {/* Existing code */}
        <nav className="hidden md:flex h-12 items-center gap-15 text-sm font-medium">
          <Link href="/" className={`${pathname === "/" ? "text-orange-600" : "text-muted-foreground"} hover:text-orange-500 transition-colors`}>
            Trang chủ
          </Link>
          <Link href="/products" className={`${pathname === "/products" ? "text-orange-600" : "text-muted-foreground"} hover:text-orange-500 transition-colors`}>
            Sản phẩm
          </Link>
          {/* <Link href="/categories" className={`${pathname === "/categories" ? "text-orange-600" : "text-muted-foreground"} hover:text-orange-500 transition-colors`}>
            Danh mục
          </Link> */}
          <Link href="/discounts" className={`${pathname === "/discounts" ? "text-orange-600" : "text-muted-foreground"} hover:text-orange-500 transition-colors`}>
            Khuyến mãi
          </Link>
          <Link href="/about" className={`${pathname === "/about" ? "text-orange-600" : "text-muted-foreground"} hover:text-orange-500 transition-colors`}>
            Về chúng tôi
          </Link>
        </nav>
      </div>
    </header >
  )
}
