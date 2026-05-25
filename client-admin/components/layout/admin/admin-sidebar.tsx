'use client'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronDown, CircleQuestionMark, ShieldCheck, TableOfContents } from "lucide-react"

import {
  LayoutDashboard,
  NotebookPen,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  Tag,
  BarChart3,
  Megaphone,
  FolderTree,
  Landmark,
  MessageSquare,
  MessagesSquare,
  Home,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useDispatch, useSelector } from "react-redux"
import { AppDispatch, RootState } from "@/store/store"
import { fetchLogout } from "@/store/slices/authSlice"
import { toast } from "sonner"

const navigation = [
  { name: "Tổng quan", href: "/", icon: LayoutDashboard },
  { name: "Trang chủ", href: "/homepage", icon: Home },

  { name: "Sản phẩm", href: "/products", icon: Package },
  { name: "Danh mục", href: "/categories", icon: FolderTree },
  { name: "Thương hiệu", href: "/brands", icon: Landmark },

  { name: "Đơn hàng", href: "/orders", icon: ShoppingCart },
  { name: "Hoàn trả", href: "/refunds", icon: Tag },
  { name: "Khách hàng", href: "/customers", icon: Users },
  { name: "Đánh giá", href: "/reviews", icon: MessageSquare },
  { name: "Liên hệ", href: "/contacts", icon: MessagesSquare },
  {
    name: "Marketing",
    children:
      [
        { name: "Hero / Banner", href: "/marketing/hero" },
        { name: "Khuyến mãi", href: "/marketing/discounts" },
        // { name: "Email Marketing", href: "/marketing/email" },
        // { name: "Social khuyến mãi", href: "/marketing/social" },
        // { name: "Coupon", href: "/marketing/coupons" },
      ]
    , icon: Megaphone
  },

  { name: "Báo cáo", href: "/reports", icon: BarChart3 },
  { name: "Chính sách", href: "/policies", icon: ShieldCheck },
  { name: "Giới thiệu", href: "/about", icon: NotebookPen },
  { name: "Câu hỏi thường gặp", href: "/faqs", icon: CircleQuestionMark },
  { name: "Cài đặt", href: "/settings", icon: Settings },
]

export default function AdminSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useSelector((state: RootState) => state.auth)
  const handleLogout = () => {
    try {
      dispatch(fetchLogout())
      toast.success("Đăng xuất thành công")
      router.push("/login")
    } catch (error) {
      console.error("Đăng xuất thất bại:", error)
    }
  }
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarHeader className="text-2xl font-bold border-b">
            <Link href="/" className="block px-4 py-3">
              Admin Panel
            </Link>
          </SidebarHeader>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const Icon = item.icon
                const hasChildren = !!item.children
                const isChildActive =
                  hasChildren && item.children.some((c) => pathname.startsWith(c.href))
                const isActive = pathname === item.href || isChildActive

                if (hasChildren) {
                  return (
                    <Collapsible
                      key={item.name}
                      defaultOpen={isChildActive}
                      className="group"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <button
                            type="button"
                            className={cn(
                              "flex w-full items-center justify-between px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                              isActive
                                ? "bg-orange-200 text-orange-700 focus:bg-orange-200 focus:text-orange-700"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground",
                            )}
                          >
                            <span className="flex items-center gap-3">
                              <Icon className="h-5 w-5" />
                              {item.name}
                            </span>
                            <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                          </button>
                        </CollapsibleTrigger>

                        <CollapsibleContent className="mt-1 ml-9 space-y-1">
                          {item.children.map((child) => {
                            const active = pathname === child.href
                            return (
                              <Link
                                key={child.name}
                                href={child.href}
                                className={cn(
                                  "block rounded-md px-3 py-1.5 text-sm transition-colors",
                                  active
                                    ? "bg-orange-500/20 text-orange-600 font-medium"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                )}
                              >
                                {child.name}
                              </Link>
                            )
                          })}
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  )
                }

                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild>
                      <Link
                        href={item.href!}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                          isActive
                            ? "bg-orange-200 text-orange-700 focus:bg-orange-200 focus:text-orange-700"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        {item.name}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-auto">
          <div className="p-4 border-t">
            <div className="flex items-center gap-3 mb-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-orange-600/10 flex items-center justify-center font-semibold text-sm">
                {user?.fullName?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{user?.fullName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <Button onClick={handleLogout} type="button" variant="outline" size="sm" className="w-full cursor-pointer justify-start bg-transparent">
              <LogOut className="h-4 w-4 mr-2" />
              Đăng xuất
            </Button>
          </div>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}