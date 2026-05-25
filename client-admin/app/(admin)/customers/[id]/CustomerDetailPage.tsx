"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft, Mail, Phone, MapPin, Calendar, Package, Truck, CheckCircle2,
  Edit, Save, X, Ban, Unlock, Trash2, Star, ShoppingBag, TrendingUp,
  Clock, MessageSquare, Plus, Send, CreditCard, Gift
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useMutation, useQuery } from "@tanstack/react-query"
import { blockCustomer, getCustomerDetail, getCustomerOrders, unblockCustomer } from "@/services/customer.service"
import { formatTimeAgo } from "@/lib/time"
import BlockCustomer from "@/components/customer/block-customer"
import UnblockCustomer from "@/components/customer/unblock-customer"
import SendEmailToCustomer from "@/components/customer/send-email-to-customer"
import { queryClient } from "@/components/QueryClientProviders"
import { CustomerDetail } from "@/types/customer"
import PaginationControls from "@/components/layout/pagination-controls-user"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"


interface CustomerNote {
  id: number
  content: string
  author: string
  date: string
}


const customerNotes: CustomerNote[] = [
  {
    id: 1,
    content: "Khách hàng thân thiết, luôn thanh toán đúng hạn. Ưu tiên xử lý đơn hàng.",
    author: "Admin",
    date: "10/01/2026",
  },
  {
    id: 2,
    content: "Đã nâng cấp lên VIP sau khi đạt 10 đơn hàng.",
    author: "System",
    date: "05/01/2026",
  },
]

interface CustomerDetailPageProps {
  id: string
}

export default function CustomerDetailPage({ id }: CustomerDetailPageProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [blockDialogOpen, setBlockDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [unblockDialogOpen, setUnblockDialogOpen] = useState(false)

  const { data: customerDetail, isLoading, isError } = useQuery({
    queryKey: ["customerDetail", id],
    queryFn: async () => getCustomerDetail(id),
    enabled: !!id,
    retry: false,
  })

  const { data: customerOrders } = useQuery({
    queryKey: ["customerOrders", id, currentPage],
    queryFn: async () => getCustomerOrders(id, currentPage, 5),
    enabled: !!id && !!customerDetail,
  })

  useEffect(() => {
    if (isError || (!isLoading && customerDetail === null)) {
      toast.error("Không tìm thấy khách hàng", {
        description: "Đang chuyển về danh sách khách hàng...",
      })
      router.replace("/customers")
    }
  }, [isError, isLoading, customerDetail])


  const [editedCustomer, setEditedCustomer] = useState({ ...customerDetail })
  const [newNote, setNewNote] = useState("")
  const [notes, setNotes] = useState(customerNotes)
  const [emailSubject, setEmailSubject] = useState("")
  const [emailContent, setEmailContent] = useState("")
  const [newStatus, setNewStatus] = useState(customerDetail?.status)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  const getOrderStatusBadge = (status: string) => {
    const config = {
      pending: { label: "Chờ xử lý", icon: Clock, className: "bg-yellow-500" },
      confirmed: { label: "Đã xác nhận", icon: CheckCircle2, className: "bg-blue-500" },
      shipping: { label: "Đang giao", icon: Truck, className: "bg-cyan-500" },
      delivered: { label: "Đã giao", icon: CheckCircle2, className: "bg-green-500" },
      cancelled: { label: "Đã hủy", icon: X, className: "bg-red-500" },
    }
    const { label, icon: Icon, className } = config[status as keyof typeof config]
    return (
      <Badge className={className}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      vip: "bg-purple-500",
      active: "bg-green-500",
      new: "bg-blue-500",
      blocked: "bg-red-500",
    }
    const labels = {
      vip: "VIP",
      active: "Hoạt động",
      new: "Mới",
      blocked: "Bị chặn",
    }
    return (
      <Badge className={styles[status as keyof typeof styles]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    )
  }

  const handleSaveEdit = () => {
    setIsEditing(false)
    console.log("[v0] Saved customer data:", editedCustomer)
  }

  const handleCancelEdit = () => {
    setEditedCustomer({ ...customerDetail })
    setIsEditing(false)
  }

  const handleDelete = () => {
    console.log("[v0] Customer deleted")
    setDeleteDialogOpen(false)
    router.push("/admin/customers")
  }

  const handleAddNote = () => {
    if (newNote.trim()) {
      const note: CustomerNote = {
        id: notes.length + 1,
        content: newNote,
        author: "Admin",
        date: new Date().toLocaleDateString("vi-VN"),
      }
      setNotes([note, ...notes])
      setNewNote("")
      setNoteDialogOpen(false)
      console.log("[v0] Note added:", note)
    }
  }

  const handleUpgradeStatus = () => {
    setUpgradeDialogOpen(false)
    console.log("[v0] Status upgraded to:", newStatus)
  }

  const handleBlockMutation = useMutation({
    mutationFn: ({
      customerId,
      reasonCode,
      reasonNote,
    }: {
      customerId: string
      reasonCode: string
      reasonNote?: string
    }) => blockCustomer(customerId, reasonCode, reasonNote),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(["customerDetail", id], (oldData: CustomerDetail | undefined) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          status: "blocked",
        }
      })
    },
  })

  const handleUnblockMutation = useMutation({
    mutationFn: (customerId: string) => unblockCustomer(customerId),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(["customerDetail", id], (oldData: CustomerDetail | undefined) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          status: "active",
        }
      })
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-8 w-48 rounded bg-muted animate-pulse" />
            <div className="h-4 w-64 rounded bg-muted animate-pulse" />
          </div>
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="h-48 rounded-lg bg-muted animate-pulse" />
            <div className="h-40 rounded-lg bg-muted animate-pulse" />
          </div>
          <div className="lg:col-span-2 h-96 rounded-lg bg-muted animate-pulse" />
        </div>
      </div>
    )
  }

  if (isError || !customerDetail) return null

  return (
    <div>
      <div className="space-y-6 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/customers">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Chi tiết khách hàng</h1>
              <p className="text-muted-foreground">Thông tin và lịch sử mua hàng</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {!isEditing ? (
              <>
                {/* <Button variant="outline" className="bg-transparent gap-2" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4" />
                  Chỉnh sửa
                </Button> */}
                <Button variant="outline" className="bg-transparent gap-2" onClick={() => setEmailDialogOpen(true)}>
                  <Send className="h-4 w-4" />
                  Gửi email
                </Button>
                {customerDetail?.status === "blocked" ? (
                  <Button variant="outline" className="bg-transparent gap-2 text-green-600" onClick={() => setUnblockDialogOpen(true)}>
                    <Unlock className="h-4 w-4" />
                    Mở khóa
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="bg-transparent gap-2 text-destructive"
                    onClick={() => setBlockDialogOpen(true)}
                  >
                    <Ban className="h-4 w-4" />
                    Chặn
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button variant="outline" className="bg-transparent gap-2" onClick={handleCancelEdit}>
                  <X className="h-4 w-4" />
                  Hủy
                </Button>
                <Button className="gap-2" onClick={handleSaveEdit}>
                  <Save className="h-4 w-4" />
                  Lưu thay đổi
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="space-y-6">
            {/* Profile Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={customerDetail?.avatar || "/default-avatar.png"} alt={customerDetail?.fullName || "Customer Avatar"} />
                    <AvatarFallback>
                      {customerDetail?.fullName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    {isEditing ? (
                      <Input
                        value={editedCustomer.fullName}
                        onChange={(e) => setEditedCustomer({ ...editedCustomer, fullName: e.target.value })}
                        className="font-semibold text-lg mb-2"
                      />
                    ) : (
                      <CardTitle>{customerDetail?.fullName}</CardTitle>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(customerDetail?.status || "active")}
                      {customerDetail?.status !== "blocked" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => setUpgradeDialogOpen(true)}
                        >
                          <Gift className="h-3 w-3 mr-1" />
                          Đổi hạng
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  {isEditing ? (
                    <Input
                      value={editedCustomer.email}
                      onChange={(e) => setEditedCustomer({ ...editedCustomer, email: e.target.value })}
                      className="h-8"
                    />
                  ) : (
                    <span>{customerDetail?.email}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  {isEditing ? (
                    <Input
                      value={editedCustomer.phone}
                      onChange={(e) => setEditedCustomer({ ...editedCustomer, phone: e.target.value })}
                      className="h-8"
                    />
                  ) : (
                    <span>{customerDetail?.phone || "--"}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span>Tham gia: {formatTimeAgo(customerDetail?.joinDate) || "--"}</span>
                </div>
              </CardContent>
            </Card>

            {/* Statistics Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Thống kê
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tổng đơn hàng</span>
                  <span className="font-bold text-lg">{customerDetail?.totalOrders}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tổng chi tiêu</span>
                  <span className="font-bold text-lg text-primary">{formatPrice(customerDetail?.totalSpent || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Giá trị TB/đơn</span>
                  <span className="font-semibold">{formatPrice(customerDetail?.avgOrderValue || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Đơn gần nhất</span>
                  <span className="font-semibold">{customerDetail?.lastOrderDate ? formatTimeAgo(customerDetail.lastOrderDate) : "--"}</span>
                </div>
              </CardContent>
            </Card>

            {/* Address Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Địa chỉ giao hàng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {customerDetail?.addresses?.length ? (
                  <div className="space-y-4">
                    {customerDetail.addresses.map((addr) => (
                      <div
                        key={addr._id}
                        className="flex items-start gap-3 p-3 border rounded-md hover:bg-gray-50 transition"
                      >
                        <MapPin className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{addr.receiver}</span>
                            {addr.isDefault && (
                              <Badge className="bg-emerald-600 text-white text-xs px-1.5 py-0.5">
                                Mặc định
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{addr.street}</p>
                          <p className="text-sm text-muted-foreground">
                            {addr.ward}, {addr.province}
                          </p>
                          <p className="text-sm text-muted-foreground">Điện thoại: {addr.phone}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Chưa có địa chỉ nào</p>
                )}
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Vùng nguy hiểm</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  className="w-full gap-2"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Xóa khách hàng
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Hành động này không thể hoàn tác. Tất cả dữ liệu của khách hàng sẽ bị xóa vĩnh viễn.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Tabs Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="orders" className="space-y-6">
              <TabsList>
                <TabsTrigger value="orders">Đơn hàng ({customerOrders?.data?.length || 0})</TabsTrigger>
                {/* <TabsTrigger value="activity">Hoạt động</TabsTrigger>
                <TabsTrigger value="notes">Ghi chú ({notes.length})</TabsTrigger> */}
              </TabsList>

              {/* Orders Tab */}
              <TabsContent value="orders" className="space-y-4">
                {customerOrders?.data && customerOrders.data.length > 0 && customerOrders.data.map((order) => (
                  <Card key={order.orderCode}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Link
                              href={`/orders/${order.orderCode}`}
                              className="font-semibold text-lg hover:text-orange-500 hover:underline transition-colors"
                            >
                              {order.orderCode}
                            </Link>
                            {getOrderStatusBadge(order.status)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatTimeAgo(order.date) || "--"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              {order.items} sản phẩm
                            </span>
                            <span className="flex items-center gap-1">
                              <CreditCard className="h-3 w-3" />
                              {order.paymentMethod}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-xl text-primary">{formatPrice(order.total)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {customerOrders?.data?.length === 0 && (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">Khách hàng chưa có đơn hàng nào</p>
                    </CardContent>
                  </Card>
                )}

                <PaginationControls
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  totalPages={customerOrders?.pagination.totalPages || 1}
                />
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity">
                <Card>

                </Card>
              </TabsContent>

              {/* Notes Tab */}
              <TabsContent value="notes" className="space-y-4">
                <Button className="w-full gap-2" onClick={() => setNoteDialogOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Thêm ghi chú mới
                </Button>

                {notes.map((note) => (
                  <Card key={note.id}>
                    <CardContent className="p-4">
                      <p className="text-sm mb-3">{note.content}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Bởi: {note.author}</span>
                        <span>{note.date}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {notes.length === 0 && (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">Chưa có ghi chú nào</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {
        customerDetail && (
          <>
            <BlockCustomer
              blockDialogOpen={blockDialogOpen}
              handleBlockMutation={handleBlockMutation}
              selectedCustomer={customerDetail}
              setBlockDialogOpen={setBlockDialogOpen}
            />

            <UnblockCustomer
              unblockDialogOpen={unblockDialogOpen}
              setUnblockDialogOpen={setUnblockDialogOpen}
              selectedCustomer={customerDetail}
              handleUnblockMutation={handleUnblockMutation}
            />

            <SendEmailToCustomer
              open={emailDialogOpen}
              onClose={() => setEmailDialogOpen(false)}
              customer={customerDetail}
            />
          </>
        )
      }

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa khách hàng</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa khách hàng "{customerDetail?.fullName}"? Tất cả dữ liệu bao gồm lịch sử đơn hàng,
              hoạt động và ghi chú sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="bg-transparent">
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Xóa vĩnh viễn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm ghi chú mới</DialogTitle>
            <DialogDescription>
              Thêm ghi chú nội bộ về khách hàng này
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Nhập nội dung ghi chú..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="min-h-24"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)} className="bg-transparent">
              Hủy
            </Button>
            <Button onClick={handleAddNote} disabled={!newNote.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm ghi chú
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade Status Dialog */}
      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thay đổi hạng khách hàng</DialogTitle>
            <DialogDescription>
              Chọn hạng mới cho khách hàng "{customerDetail?.fullName}"
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newStatus} onValueChange={(value: "active" | "new" | "inactive" | "blocked") => setNewStatus(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn hạng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">Mới</SelectItem>
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="blocked">Bị chặn</SelectItem>
                <SelectItem value="inactive">Không hoạt động</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpgradeDialogOpen(false)} className="bg-transparent">
              Hủy
            </Button>
            <Button onClick={handleUpgradeStatus}>
              <Gift className="h-4 w-4 mr-2" />
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
