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
    LayoutDashboard,
    Package,
    ShoppingCart,
    Users,
    Settings,
    Menu,
    X,
    LogOut,
    Tag,
    BarChart3,
    Megaphone,
    Home,
    Grid3x3,
    Info,
    Phone,
    HelpCircle,
    Truck,
    RefreshCw,
    BookOpen,
    FileText,
    Search,
    User,
    Heart,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { ScrollArea } from "@radix-ui/react-scroll-area"

const navigation = [
    { href: "/", label: "Trang chủ", icon: Home },
    { href: "/products", label: "Sản phẩm", icon: Package },
    { href: "/categories", label: "Danh mục", icon: Grid3x3 },
    { href: "/discounts", label: "Khuyến mãi", icon: Tag },
    { href: "/about", label: "Về chúng tôi", icon: Info },
    { href: "/contact", label: "Liên hệ", icon: Phone },
    { href: "/faq", label: "Câu hỏi thường gặp", icon: HelpCircle },
    { href: "/shipping", label: "Chính sách vận chuyển", icon: Truck },
    { href: "/returns", label: "Chính sách đổi trả", icon: RefreshCw },
    { href: "/blog", label: "Blog", icon: BookOpen },
    { href: "/terms", label: "Điều khoản dịch vụ", icon: FileText },
]
export default function UserSidebar() {
    const pathname = usePathname()
    const [searchQuery, setSearchQuery] = useState("")

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
        }
    }


    return (
        <Sidebar>
            <SidebarContent>
                <ScrollArea>

                    <SidebarGroup>
                        <SidebarHeader className="text-2xl font-bold border-b">
                            <Link href="/" className="flex items-center gap-2 px-4 py-3">
                                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-orange-500-foreground font-bold text-lg">
                                    🍿
                                </div>
                                Snack Việt
                            </Link>
                        </SidebarHeader>
                    </SidebarGroup>
                    <SidebarGroup>
                        <form
                            onSubmit={(e) => {
                                handleSearch(e)
                            }}
                        >
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Tìm kiếm..."
                                    className="pl-10"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </form>
                    </SidebarGroup>
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {navigation.map((item) => {
                                    const Icon = item.icon
                                    const isActive = pathname === item.href
                                    return (
                                        <SidebarMenuItem key={item.href} className={cn()}>
                                            <SidebarMenuButton asChild>
                                                <Link href={item.href} className={cn(
                                                    "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                                    isActive
                                                        ? "bg-orange-600 text-orange-500-foreground hover:!bg-orange-600 hover:!text-orange-500-foreground"
                                                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                                )}>
                                                    <Icon className="!h-5 !w-5" />
                                                    <span className="text-md">{item.label}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    )
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                    <SidebarGroup>
                        <div className="pt-4 border-t space-y-2">
                            <Link
                                href="/account"

                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                            >
                                <User className="h-5 w-5 text-muted-foreground" />
                                Tài khoản
                            </Link>
                            <Link
                                href="/orders"

                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                            >
                                <Package className="h-5 w-5 text-muted-foreground" />
                                Đơn hàng của tôi
                            </Link>
                            <Link
                                href="/wishlist"

                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                            >
                                <Heart className="h-5 w-5 text-muted-foreground" />
                                Yêu thích
                            </Link>
                        </div>
                    </SidebarGroup>
                </ScrollArea>
            </SidebarContent>
        </Sidebar>
    )
}