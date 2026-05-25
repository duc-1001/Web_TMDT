"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Search, Eye, MoreVertical, Mail, Phone, Ban, Users,
  UserPlus, TrendingUp, Download, Filter,
  Star, Calendar, Unlock, Send,
  Edit, Trash2, MapPin, ShoppingCart
} from "lucide-react"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery } from "@tanstack/react-query"
import useDebounce from "@/hooks/use-debounce"
import { blockCustomer, getAllCustomersAdmin, getCustomerSummary, unblockCustomer } from "@/services/customer.service"
import { Customer, CustomerStatus } from "@/types/customer"
import PaginationControls from "@/components/layout/pagination-controls-admin"
import { formatTimeAgo } from "@/lib/time"
import QuickView from "@/components/customer/quick-view"
import { queryClient } from "@/components/QueryClientProviders"
import BlockCustomer from "@/components/customer/block-customer"
import UnblockCustomer from "@/components/customer/unblock-customer"
import SendEmailToCustomer from "@/components/customer/send-email-to-customer"
import SendEmailToManyCustomer from "@/components/customer/send-email-to-many-customer"
import Link from "next/link"

export default function CustomersPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("newest")
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [blockDialogOpen, setBlockDialogOpen] = useState(false)
  const [unblockDialogOpen, setUnblockDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [detailSheetOpen, setDetailSheetOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [sendEmailToCustomerDialogOpen, setSendEmailToCustomerDialogOpen] = useState<boolean>(false)

  const [emailSubject, setEmailSubject] = useState("")
  const [emailContent, setEmailContent] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  const q = useDebounce(searchQuery, 500)

  const { data: customersData, isLoading } = useQuery({
    queryKey: ["customers-admin", q, statusFilter, sortBy, currentPage, itemsPerPage],
    queryFn: () => getAllCustomersAdmin(q, currentPage, itemsPerPage, statusFilter, sortBy),
  })

  const { data: summaryData } = useQuery({
    queryKey: ["customer-summary"],
    queryFn: () => getCustomerSummary(),
  })

  const customers = customersData?.data || []
  const pagination = customersData?.pagination

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(price)
  }

  const getStatusBadge = (status: CustomerStatus) => {
    const config = {
      active: {
        label: "Hoạt động",
        class: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200"
      },
      new: {
        label: "Mới",
        class: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200"
      },
      blocked: {
        label: "Bị chặn",
        class: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200"
      },
      inactive: {
        label: "Không hoạt động",
        class: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200"
      }
    }
    const fallback = {
      label: "Không xác định",
      class: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200"
    }
    const { label, class: className } = config[status] ?? fallback
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}>
        {label}
      </span>
    )
  }

  // Stats
  const stats = useMemo(() => {
    if (!summaryData) return []

    return [
      {
        title: "Tổng khách hàng",
        value: summaryData.totalCustomers,
        icon: Users,
        color: "text-blue-600",
        bg: "bg-blue-100 dark:bg-blue-900/20",
      },
      {
        title: "Khách mới",
        value: summaryData.newCustomers,
        icon: UserPlus,
        color: "text-emerald-600",
        bg: "bg-emerald-100 dark:bg-emerald-900/20",
      },
      {
        title: "Khách hoạt động",
        value: summaryData.activeCustomers,
        icon: TrendingUp,
        color: "text-orange-600",
        bg: "bg-orange-100 dark:bg-orange-900/20",
      },
      {
        title: "Khách không hoạt động",
        value: summaryData.inactiveCustomers,
        icon: Star,
        color: "text-red-600",
        bg: "bg-red-100 dark:bg-red-900/20",
      },
    ]
  }, [summaryData])

  const handleSendEmailToCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setSendEmailToCustomerDialogOpen(true)
  }


  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Chỉ lấy những khách hàng chưa bị block
      const selectableCustomers = customers
        .filter((c) => c.status !== "blocked") // bỏ những khách bị khoá
        .map((c) => c.email)

      setSelectedCustomers(selectableCustomers)
    } else {
      setSelectedCustomers([])
    }
  }

  const handleSelectCustomer = (customerEmail: string, checked: boolean) => {
    const customer = customers.find((c) => c.email === customerEmail)
    if (!customer || customer.status === "blocked") {
      return
    }

    if (checked) {
      setSelectedCustomers([...selectedCustomers, customerEmail])
    } else {
      setSelectedCustomers(selectedCustomers.filter((email) => email !== customerEmail))
    }
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
      queryClient.setQueryData(
        ["customers-admin", q, statusFilter, sortBy, currentPage, itemsPerPage],
        (oldData: any) => {
          if (!oldData?.data) return oldData

          const updatedCustomers = oldData.data.map((customer: Customer) =>
            customer._id === variables.customerId
              ? { ...customer, status: "blocked" }
              : customer
          )

          return {
            ...oldData,
            data: updatedCustomers,
          }
        }
      )
      queryClient.invalidateQueries({ queryKey: ["customer-summary"] })
    },
  })

  const handleUnblockMutation = useMutation({
    mutationFn: (customerId: string) => unblockCustomer(customerId),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        ["customers-admin", q, statusFilter, sortBy, currentPage, itemsPerPage],
        (oldData: any) => {
          if (!oldData?.data) return oldData

          const updatedCustomers = oldData.data.map((customer: Customer) =>
            customer._id === variables
              ? { ...customer, status: "active" }
              : customer
          )

          return {
            ...oldData,
            data: updatedCustomers,
          }
        }
      )
      queryClient.invalidateQueries({ queryKey: ["customer-summary"] })
    },
  })

  const handleDelete = () => {
    if (selectedCustomers.length > 0) {
      console.log("Deleting:", selectedCustomers)
      setDeleteDialogOpen(false)
      setSelectedCustomers([])
    }
  }

  const handleExport = () => {
    console.log("Exporting CSV...")
  }

  const openQuickView = (customer: Customer) => {
    setSelectedCustomer(customer)
    setDetailSheetOpen(true)
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý khách hàng</h1>
          <p className="text-muted-foreground mt-1">Theo dõi và quản lý thông tin khách hàng</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Xuất CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className={`font-bold text-lg`}>
                    {stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4}>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="new">Mới</SelectItem>
                  <SelectItem value="blocked">Bị chặn</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4}>
                  <SelectItem value="newest">Mới nhất</SelectItem>
                  <SelectItem value="oldest">Cũ nhất</SelectItem>
                  <SelectItem value="most_orders">Nhiều đơn nhất</SelectItem>
                  <SelectItem value="most_spent">Chi tiêu cao nhất</SelectItem>
                  <SelectItem value="name_asc">Tên A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedCustomers.length > 0 && (
            <div className="flex items-center justify-between mb-4 p-3 bg-muted/50 rounded-lg border">
              <span className="text-sm font-medium">
                Đã chọn <strong>{selectedCustomers.length}</strong> khách hàng
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEmailDialogOpen(true)}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Gửi email
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa
                </Button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="w-12 py-3 px-4">
                    <Checkbox
                      checked={
                        selectedCustomers.length > 0 &&
                        selectedCustomers.length === customers.filter(c => c.status !== "blocked").length
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Khách hàng</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Liên hệ</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Đơn hàng</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Chi tiêu</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Trạng thái</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Hoạt động gần nhất</th>
                  <th className="w-12 py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr
                    key={customer._id}
                    className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${customer.status === "blocked" ? "opacity-60" : ""
                      }`}
                  >
                    <td className="py-3 px-4">
                      <Checkbox
                        checked={selectedCustomers.includes(customer.email)}
                        onCheckedChange={(checked) => handleSelectCustomer(customer.email, checked as boolean)}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Link href={`/customers/${customer._id}`}>
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={customer.avatar} alt={customer.fullName} />
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {customer.fullName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                        <div>
                          <Link href={`/customers/${customer._id}`} className="font-medium hover:underline">
                            {customer.fullName}
                          </Link>
                          <p className="text-xs text-muted-foreground">ID: {customer._id.slice(-6)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          {customer.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          {customer.phone || "Chưa cập nhật"}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{customer.orders}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-emerald-600">
                      {formatPrice(customer.spent)}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(customer.status)}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {customer.lastLogin ? formatTimeAgo(customer.lastLogin) : "Chưa đăng nhập"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => openQuickView(customer)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Xem nhanh
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/admin/customers/${customer._id}`)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Chi tiết / Sửa
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleSendEmailToCustomer(customer)}>
                            <Mail className="h-4 w-4 mr-2" />
                            Gửi email
                          </DropdownMenuItem>
                          {customer.phone && (
                            <DropdownMenuItem onClick={() => window.open(`tel:${customer.phone}`)}>
                              <Phone className="h-4 w-4 mr-2" />
                              Gọi điện
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {customer.status === "blocked" ? (
                            <DropdownMenuItem
                              className="text-emerald-600"
                              onClick={() => {
                                setSelectedCustomer(customer)
                                setUnblockDialogOpen(true)
                              }}
                            >
                              <Unlock className="h-4 w-4 mr-2" />
                              Mở khóa
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                setSelectedCustomer(customer)
                                setBlockDialogOpen(true)
                              }}
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Chặn tài khoản
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {customers.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-1">Không tìm thấy khách hàng</h3>
              <p className="text-muted-foreground text-sm">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-6">
              <PaginationControls
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                setCurrentPage={setCurrentPage}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={setItemsPerPage}
                totalItems={pagination.total}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <QuickView
        customerId={selectedCustomer?._id || ""}
        detailSheetOpen={detailSheetOpen}
        setDetailSheetOpen={setDetailSheetOpen}
        getStatusBadge={getStatusBadge}
      />

      {/* Block Dialog */}
      <BlockCustomer
        blockDialogOpen={blockDialogOpen}
        handleBlockMutation={handleBlockMutation}
        selectedCustomer={selectedCustomer}
        setBlockDialogOpen={setBlockDialogOpen}
      />

      {/* Unblock Dialog */}
      <UnblockCustomer
        unblockDialogOpen={unblockDialogOpen}
        setUnblockDialogOpen={setUnblockDialogOpen}
        selectedCustomer={selectedCustomer}
        handleUnblockMutation={handleUnblockMutation}
      />

      {/* Send Email Dialog */}
      <SendEmailToCustomer
        open={sendEmailToCustomerDialogOpen}
        onClose={() => setSendEmailToCustomerDialogOpen(false)}
        customer={selectedCustomer}
      />

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Xác nhận xóa
            </DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa <strong>{selectedCustomers.length}</strong> khách hàng đã chọn?
              Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Xóa vĩnh viễn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <SendEmailToManyCustomer
        emailDialogOpen={emailDialogOpen}
        setEmailDialogOpen={setEmailDialogOpen}
        selectedCustomers={selectedCustomers}
        setSelectedCustomers={setSelectedCustomers}
      />
    </div>
  )
}