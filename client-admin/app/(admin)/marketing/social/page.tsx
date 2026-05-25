"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Facebook,
  Instagram,
  TrendingUp,
  Users,
  Heart,
  MessageCircle,
  Share2,
  Plus,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  BarChart3,
} from "lucide-react"
import { useState } from "react"

export default function SocialMediaPage() {
  const [open, setOpen] = useState(false)

  const platformStats = [
    {
      platform: "Facebook",
      icon: Facebook,
      followers: "12.5K",
      engagement: "4.2%",
      posts: 156,
      reach: "45K",
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
      connected: true,
    },
    {
      platform: "Instagram",
      icon: Instagram,
      followers: "8.9K",
      engagement: "6.8%",
      posts: 234,
      reach: "32K",
      color: "text-pink-600",
      bgColor: "bg-pink-100 dark:bg-pink-900/20",
      connected: true,
    },
    {
      platform: "TikTok",
      icon: TrendingUp,
      followers: "15.2K",
      engagement: "12.5%",
      posts: 89,
      reach: "78K",
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
      connected: false,
    },
  ]

  const stats = [
    {
      label: "Tổng reach",
      value: "155K",
      change: "+23%",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      label: "Engagement rate",
      value: "7.8%",
      change: "+1.2%",
      icon: Heart,
      color: "text-pink-600",
      bgColor: "bg-pink-100 dark:bg-pink-900/20",
    },
    {
      label: "Tổng bài đăng",
      value: "479",
      change: "+34",
      icon: MessageCircle,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      label: "Chi phí quảng cáo",
      value: "₫5.2M",
      change: "-8%",
      icon: DollarSign,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
  ]

  const posts = [
    {
      id: 1,
      platform: "facebook",
      title: "Flash Sale Cuối Tuần - Giảm 50%",
      content: "🔥 FLASH SALE CUỐI TUẦN 🔥\n\nGiảm ngay 50% cho tất cả các loại snack...",
      image: "/flash-sale-banner.jpg",
      scheduled: "18/01/2026 08:00",
      status: "scheduled",
      likes: 0,
      comments: 0,
      shares: 0,
    },
    {
      id: 2,
      platform: "instagram",
      title: "Sản phẩm mới từ Nhật Bản",
      content: "✨ MỚI VỀ ✨\n\nBộ sưu tập snack cao cấp từ Nhật Bản...",
      image: "/japanese-snacks.jpg",
      scheduled: null,
      status: "published",
      likes: 1234,
      comments: 89,
      shares: 45,
      publishedDate: "14/01/2026 10:30",
    },
    {
      id: 3,
      platform: "facebook",
      title: "Review từ khách hàng",
      content: "💕 Cảm ơn bạn đã tin tưởng và ủng hộ shop...",
      image: "/customer-review.jpg",
      scheduled: null,
      status: "published",
      likes: 892,
      comments: 67,
      shares: 23,
      publishedDate: "13/01/2026 15:20",
    },
  ]

  const campaigns = [
    {
      id: 1,
      name: "Quảng cáo Tết 2026",
      platform: "Facebook & Instagram",
      budget: "₫10,000,000",
      spent: "₫6,500,000",
      reach: "125,000",
      clicks: "4,567",
      conversions: "234",
      status: "active",
      startDate: "01/01/2026",
      endDate: "31/01/2026",
    },
    {
      id: 2,
      name: "Video TikTok - Snack Review",
      platform: "TikTok",
      budget: "₫5,000,000",
      spent: "₫5,000,000",
      reach: "89,000",
      clicks: "12,345",
      conversions: "567",
      status: "completed",
      startDate: "05/01/2026",
      endDate: "12/01/2026",
    },
  ]

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Social Media Marketing</h1>
            <p className="text-muted-foreground">Quản lý nội dung và quảng cáo trên mạng xã hội</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Tạo bài đăng mới
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tạo Bài Đăng Mới</DialogTitle>
                <DialogDescription>Tạo và lên lịch bài đăng trên các nền tảng mạng xã hội</DialogDescription>
              </DialogHeader>
              <form className="space-y-6">
                <div className="space-y-2">
                  <Label>Chọn nền tảng *</Label>
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" className="flex-1 h-auto py-4 bg-transparent">
                      <div className="flex flex-col items-center gap-2">
                        <Facebook className="h-6 w-6 text-blue-600" />
                        <span>Facebook</span>
                      </div>
                    </Button>
                    <Button type="button" variant="outline" className="flex-1 h-auto py-4 bg-transparent">
                      <div className="flex flex-col items-center gap-2">
                        <Instagram className="h-6 w-6 text-pink-600" />
                        <span>Instagram</span>
                      </div>
                    </Button>
                    <Button type="button" variant="outline" className="flex-1 h-auto py-4 bg-transparent">
                      <div className="flex flex-col items-center gap-2">
                        <TrendingUp className="h-6 w-6 text-purple-600" />
                        <span>TikTok</span>
                      </div>
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="post-title">Tiêu đề bài đăng *</Label>
                  <Input id="post-title" placeholder="VD: Flash Sale Cuối Tuần - Giảm 50%" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="post-content">Nội dung *</Label>
                  <Textarea id="post-content" placeholder="Viết nội dung bài đăng..." rows={8} />
                  <p className="text-xs text-muted-foreground">Sử dụng emoji và hashtag để tăng engagement</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="post-image">Hình ảnh/Video</Label>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Input id="post-image" type="file" className="hidden" accept="image/*,video/*" />
                    <Label htmlFor="post-image" className="cursor-pointer">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-orange-600/10 flex items-center justify-center">
                          <Plus className="h-6 w-6" />
                        </div>
                        <p className="font-medium">Tải lên hình ảnh hoặc video</p>
                        <p className="text-sm text-muted-foreground">PNG, JPG, MP4 tối đa 50MB</p>
                      </div>
                    </Label>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="post-schedule">Thời gian đăng *</Label>
                    <Select defaultValue="now">
                      <SelectTrigger id="post-schedule">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="now">Đăng ngay</SelectItem>
                        <SelectItem value="schedule">Lên lịch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="post-datetime">Ngày giờ (nếu lên lịch)</Label>
                    <Input id="post-datetime" type="datetime-local" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Hủy
                  </Button>
                  <Button type="submit" className="gap-2">
                    <Share2 className="h-4 w-4" />
                    Đăng bài
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
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

        <div className="grid lg:grid-cols-3 gap-6">
          {platformStats.map((platform, index) => {
            const Icon = platform.icon
            return (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl ${platform.bgColor} flex items-center justify-center`}>
                      <Icon className={`h-6 w-6 ${platform.color}`} />
                    </div>
                    {platform.connected ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        Đã kết nối
                      </Badge>
                    ) : (
                      <Button variant="outline" size="sm">
                        Kết nối
                      </Button>
                    )}
                  </div>
                  <CardTitle>{platform.platform}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Followers</p>
                      <p className="text-xl font-bold">{platform.followers}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Engagement</p>
                      <p className="text-xl font-bold">{platform.engagement}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Posts</p>
                      <p className="text-xl font-bold">{platform.posts}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Reach</p>
                      <p className="text-xl font-bold">{platform.reach}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Tabs defaultValue="posts" className="space-y-6">
          <TabsList>
            <TabsTrigger value="posts">Bài đăng</TabsTrigger>
            <TabsTrigger value="campaigns">Chiến dịch quảng cáo</TabsTrigger>
            <TabsTrigger value="analytics">Phân tích</TabsTrigger>
          </TabsList>

          <TabsContent value="posts">
            <Card>
              <CardHeader>
                <CardTitle>Quản lý bài đăng</CardTitle>
                <CardDescription>Tất cả bài đăng đã và sắp đăng</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bài đăng</TableHead>
                      <TableHead>Nền tảng</TableHead>
                      <TableHead>Tương tác</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Thời gian</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell>
                          <div className="max-w-md">
                            <p className="font-medium mb-1">{post.title}</p>
                            <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {post.platform}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {post.status === "published" ? (
                            <div className="text-sm space-y-1">
                              <div className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                <span>{post.likes}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageCircle className="h-3 w-3" />
                                <span>{post.comments}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {post.status === "published" ? (
                            <Badge variant="secondary">Đã đăng</Badge>
                          ) : (
                            <Badge variant="outline">Đã lên lịch</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {post.publishedDate || post.scheduled}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="campaigns">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Chiến dịch quảng cáo</CardTitle>
                  <CardDescription>Quản lý các chiến dịch quảng cáo có trả phí</CardDescription>
                </div>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Tạo chiến dịch
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Chiến dịch</TableHead>
                      <TableHead>Nền tảng</TableHead>
                      <TableHead>Ngân sách</TableHead>
                      <TableHead>Đã chi</TableHead>
                      <TableHead>Hiệu suất</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{campaign.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {campaign.startDate} - {campaign.endDate}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{campaign.platform}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{campaign.budget}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{campaign.spent}</p>
                            <p className="text-xs text-muted-foreground">
                              {(
                                (Number.parseFloat(campaign.spent.replace(/[₫,]/g, "")) /
                                  Number.parseFloat(campaign.budget.replace(/[₫,]/g, ""))) *
                                100
                              ).toFixed(0)}
                              %
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            <div>
                              Reach: <span className="font-medium">{campaign.reach}</span>
                            </div>
                            <div>
                              Clicks: <span className="font-medium">{campaign.clicks}</span>
                            </div>
                            <div>
                              Conv: <span className="font-medium">{campaign.conversions}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {campaign.status === "active" ? (
                            <Badge className="bg-green-100 text-green-700">Đang chạy</Badge>
                          ) : (
                            <Badge variant="secondary">Đã kết thúc</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon">
                              <BarChart3 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Phân tích hiệu suất</CardTitle>
                  <CardDescription>Thống kê chi tiết về hoạt động social media</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 flex items-center justify-center border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">Biểu đồ phân tích sẽ hiển thị ở đây</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
  )
}
