"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, MessageSquare, Bell, TrendingUp, BarChart3, Users, Target } from "lucide-react"
import Link from "next/link"

const tools = [
  {
    name: "Email Marketing",
    description: "Gửi email quảng cáo sản phẩm mới và khuyến mãi",
    icon: Mail,
    stats: [
      { label: "Tỷ lệ mở", value: "45%" },
      { label: "Click rate", value: "12%" },
    ],
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/20",
    href: "/admin/marketing/campaigns?type=email",
  },
  {
    name: "SMS Marketing",
    description: "Thông báo khuyến mãi và đơn hàng qua SMS",
    icon: MessageSquare,
    stats: [
      { label: "Đã gửi", value: "1,234" },
      { label: "Phản hồi", value: "23%" },
    ],
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/20",
    href: "/admin/marketing/campaigns?type=sms",
  },
  {
    name: "Push Notification",
    description: "Thông báo đẩy về ứng dụng và trình duyệt",
    icon: Bell,
    stats: [
      { label: "Subscribers", value: "5,432" },
      { label: "Click rate", value: "18%" },
    ],
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/20",
    href: "/admin/marketing/push",
  },
  {
    name: "Social Media",
    description: "Quảng cáo trên Facebook, Instagram, TikTok",
    icon: TrendingUp,
    stats: [
      { label: "Reach", value: "50K" },
      { label: "Engagement", value: "8.5%" },
    ],
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-100 dark:bg-pink-900/20",
    href: "/admin/marketing/social",
  },
]

const stats = [
  {
    label: "Tổng chiến dịch",
    value: "24",
    change: "+12%",
    icon: Target,
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/20",
  },
  {
    label: "Email đã gửi",
    value: "15,234",
    change: "+23%",
    icon: Mail,
    color: "text-green-600",
    bgColor: "bg-green-100 dark:bg-green-900/20",
  },
  {
    label: "Khách hàng tiếp cận",
    value: "8,456",
    change: "+18%",
    icon: Users,
    color: "text-purple-600",
    bgColor: "bg-purple-100 dark:bg-purple-900/20",
  },
  {
    label: "Tỷ lệ chuyển đổi",
    value: "3.2%",
    change: "+0.5%",
    icon: BarChart3,
    color: "text-orange-600",
    bgColor: "bg-orange-100 dark:bg-orange-900/20",
  },
]

export default function MarketingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Marketing & Quảng cáo</h1>
        <p className="text-muted-foreground">Quản lý các chiến dịch marketing của bạn</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <span className="text-sm font-medium text-green-600">{stat.change}</span>
                </div>
                <p className="text-2xl font-bold mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {tools.map((tool, index) => {
          const Icon = tool.icon
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 rounded-xl ${tool.bgColor} flex items-center justify-center`}>
                    <Icon className={`h-7 w-7 ${tool.color}`} />
                  </div>
                  <Button variant="outline" size="sm" className="bg-transparent" asChild>
                    <Link href={tool.href}>Xem chi tiết</Link>
                  </Button>
                </div>
                <CardTitle className="text-xl">{tool.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{tool.description}</p>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  {tool.stats.map((stat, idx) => (
                    <div key={idx}>
                      <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                      <p className="text-lg font-bold">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Chiến dịch gần đây</CardTitle>
          <Button variant="outline" size="sm" className="bg-transparent" asChild>
            <Link href="/marketing/campaigns">Xem tất cả</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold">Email Sản Phẩm Mới Tháng 1</p>
                  <p className="text-sm text-muted-foreground">Đã gửi 5,678 email</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-green-600">45% mở</p>
                <p className="text-sm text-muted-foreground">12% click</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold">SMS Flash Sale Cuối Tuần</p>
                  <p className="text-sm text-muted-foreground">Lên lịch: 18/01/2026</p>
                </div>
              </div>
              <div className="text-right">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  Đã lên lịch
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
