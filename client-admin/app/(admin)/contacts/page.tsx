"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Mail, MoreVertical, Phone, Search, User, CheckCircle2, Eye, Reply } from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import PaginationControls from "@/components/layout/pagination-controls-admin"
import useDebounce from "@/hooks/use-debounce"
import { getContactMessagesAdmin, replyContactMessageAdmin, updateContactMessageStatusAdmin } from "@/services/contact.service"
import { ContactMessageItem, ContactMessageStatus } from "@/types/contact"
import { formatTimeAgo } from "@/lib/time"

const statusLabel: Record<ContactMessageStatus, string> = {
  new: "Mới",
  in_progress: "Đang xử lý",
  resolved: "Đã xử lý",
  closed: "Đóng",
}

const statusClass: Record<ContactMessageStatus, string> = {
  new: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-700",
}

export default function ContactsPage() {
  const queryClient = useQueryClient()

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<ContactMessageStatus | "all">("all")
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [selectedMessage, setSelectedMessage] = useState<ContactMessageItem | null>(null)
  const [replyDialogOpen, setReplyDialogOpen] = useState(false)
  const [replyContent, setReplyContent] = useState("")

  const q = useDebounce(search, 500)

  const { data, isLoading } = useQuery({
    queryKey: ["admin-contact-messages", q, statusFilter, page, itemsPerPage],
    queryFn: () => getContactMessagesAdmin(q, statusFilter, page, itemsPerPage),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ messageId, status }: { messageId: string; status: ContactMessageStatus }) =>
      updateContactMessageStatusAdmin(messageId, status),
    onSuccess: () => {
      toast.success("Cập nhật trạng thái thành công")
      queryClient.invalidateQueries({ queryKey: ["admin-contact-messages"] })
    },
    onError: (error: any) => {
      toast.error(error?.message || "Cập nhật trạng thái thất bại")
    },
  })

  const replyMutation = useMutation({
    mutationFn: ({ messageId, reply }: { messageId: string; reply: string }) =>
      replyContactMessageAdmin(messageId, reply),
    onSuccess: () => {
      toast.success("Đã gửi phản hồi cho khách hàng")
      queryClient.invalidateQueries({ queryKey: ["admin-contact-messages"] })
      setReplyDialogOpen(false)
      setReplyContent("")
      setSelectedMessage(null)
    },
    onError: (error: any) => {
      toast.error(error?.message || "Gửi phản hồi thất bại")
    },
  })

  const messages = data?.data || []
  const totalPages = data?.pagination?.totalPages || 1
  const totalItems = data?.pagination?.total || 0

  const stats = useMemo(() => {
    const total = totalItems
    const newCount = messages.filter((item) => item.status === "new").length
    const processingCount = messages.filter((item) => item.status === "in_progress").length
    const resolvedCount = messages.filter((item) => item.status === "resolved").length

    return { total, newCount, processingCount, resolvedCount }
  }, [messages, totalItems])

  const onChangeStatus = (messageId: string, status: ContactMessageStatus) => {
    updateStatusMutation.mutate({ messageId, status })
  }

  const openReplyDialog = (message: ContactMessageItem) => {
    setSelectedMessage(message)
    setReplyContent(message.reply_message || "")
    setReplyDialogOpen(true)
  }

  const onSendReply = () => {
    if (!selectedMessage?._id) return
    const cleaned = replyContent.trim()
    if (!cleaned) {
      toast.error("Vui lòng nhập nội dung phản hồi")
      return
    }

    replyMutation.mutate({
      messageId: selectedMessage._id,
      reply: cleaned,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quản lý liên hệ</h1>
        <p className="mt-1 text-muted-foreground">Theo dõi và xử lý các liên hệ gửi từ trang người dùng</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Tổng liên hệ</p>
            <p className="mt-2 text-2xl font-bold">{stats.total.toLocaleString("vi-VN")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Mới</p>
            <p className="mt-2 text-2xl font-bold text-blue-700">{stats.newCount.toLocaleString("vi-VN")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Đang xử lý</p>
            <p className="mt-2 text-2xl font-bold text-yellow-700">{stats.processingCount.toLocaleString("vi-VN")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Đã xử lý</p>
            <p className="mt-2 text-2xl font-bold text-green-700">{stats.resolvedCount.toLocaleString("vi-VN")}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên, email, chủ đề..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-9"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as ContactMessageStatus | "all")
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full md:w-56">
                <SelectValue placeholder="Lọc trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="new">Mới</SelectItem>
                <SelectItem value="in_progress">Đang xử lý</SelectItem>
                <SelectItem value="resolved">Đã xử lý</SelectItem>
                <SelectItem value="closed">Đóng</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Người gửi</th>
                  <th className="px-4 py-3 text-left font-medium">Liên hệ</th>
                  <th className="px-4 py-3 text-left font-medium">Chủ đề</th>
                  <th className="px-4 py-3 text-left font-medium">Nội dung</th>
                  <th className="px-4 py-3 text-left font-medium">Trạng thái</th>
                  <th className="px-4 py-3 text-left font-medium">Thời gian</th>
                  <th className="px-4 py-3 text-right font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : messages.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                      Không có liên hệ nào.
                    </td>
                  </tr>
                ) : (
                  messages.map((item: ContactMessageItem) => (
                    <tr key={item._id} className="border-t">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{item.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span>{item.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{item.phone || "-"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">{item.subject}</td>
                      <td className="px-4 py-3 max-w-sm">
                        <p className="line-clamp-2 text-muted-foreground">{item.message}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={statusClass[item.status]}>{statusLabel[item.status]}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatTimeAgo(item.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem onClick={() => openReplyDialog(item)}>
                              Xem & trả lời
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onChangeStatus(item._id, "new")}>Đặt về Mới</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onChangeStatus(item._id, "in_progress")}>Đang xử lý</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onChangeStatus(item._id, "resolved")}>
                              Đánh dấu đã xử lý
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onChangeStatus(item._id, "closed")}>Đóng liên hệ</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <PaginationControls
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            currentPage={page}
            setItemsPerPage={setItemsPerPage}
            setCurrentPage={setPage}
            totalPages={totalPages}
          />
        </CardContent>
      </Card>

      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Trả lời liên hệ khách hàng</DialogTitle>
            <DialogDescription>
              Xem chi tiết câu hỏi và gửi phản hồi qua email cho khách hàng.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-2">
              <p><span className="font-medium">Khách hàng:</span> {selectedMessage?.name || "-"}</p>
              <p><span className="font-medium">Email:</span> {selectedMessage?.email || "-"}</p>
              <p><span className="font-medium">SĐT:</span> {selectedMessage?.phone || "-"}</p>
              <p><span className="font-medium">Chủ đề:</span> {selectedMessage?.subject || "-"}</p>
              <p className="text-muted-foreground whitespace-pre-wrap">{selectedMessage?.message || ""}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Nội dung phản hồi</p>
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Nhập nội dung trả lời cho khách hàng..."
                rows={8}
              />
            </div>

            {selectedMessage?.reply_message ? (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                <p className="font-medium">Đã từng phản hồi</p>
                <p className="mt-1 whitespace-pre-wrap">{selectedMessage.reply_message}</p>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>Đóng</Button>
            <Button onClick={onSendReply} disabled={replyMutation.isPending}>
              <Reply className="mr-2 h-4 w-4" />
              {replyMutation.isPending ? "Đang gửi..." : "Gửi phản hồi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
