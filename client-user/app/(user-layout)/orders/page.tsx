"use client"

import { useState } from "react"
import { Package, Search, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import useDebounce from "@/hooks/use-debounce"
import { getMyOrders } from "@/services/order.service"
import PaginationControls from "@/components/layout/pagination-controls-admin"
import OrderCard from "@/components/order/order-card"
import { useSelector } from "react-redux"
import { RootState } from "@/store/store"

export default function OrdersPage() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const q = useDebounce(searchQuery, 500)

  const { data, isLoading, refetch: refetchOrders } = useQuery({
    queryKey: ["my-orders", q, itemsPerPage, currentPage, activeTab],
    queryFn: () => getMyOrders(currentPage, itemsPerPage, activeTab, q),
    enabled: isAuthenticated,
  })

  const orders = data?.data || []
  const totalPages = data?.pagination.totalPages || 1
  const totalItems = data?.pagination.total || 0
  
  if (!isAuthenticated) {
    return (
      <div className=" py-40 bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md shadow-sm">
          <CardContent className="p-6 text-center">
            <XCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold mb-2">Bạn chưa đăng nhập</h3>
            <p className="text-sm text-muted-foreground mb-6">Vui lòng đăng nhập để xem đơn hàng của bạn</p>
            <Button asChild className="bg-blue-500 hover:bg-blue-500/90 transition-colors duration-200">
              <Link href="/login">Đăng nhập</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Đơn hàng của tôi</h1>
          <p className="text-muted-foreground">Theo dõi và quản lý đơn hàng của bạn</p>
        </div>

        <Card className="mb-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm đơn hàng theo mã..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5 md:grid-cols-5">
                  <TabsTrigger value="all" className="text-xs md:text-sm">Tất cả</TabsTrigger>
                  <TabsTrigger value="pending" className="text-xs md:text-sm">Đang xử lý</TabsTrigger>
                  <TabsTrigger value="shipping" className="text-xs md:text-sm">Đang giao</TabsTrigger>
                  <TabsTrigger value="delivered" className="text-xs md:text-sm">Đã giao</TabsTrigger>
                  <TabsTrigger value="cancelled" className="text-xs md:text-sm">Đã hủy</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {orders.length === 0 && !isLoading ? (
            <Card className="shadow-sm">
              <CardContent className="p-12 text-center">
                <Package className="h-20 w-20 mx-auto mb-4 text-muted-foreground/40" />
                <h3 className="text-lg font-semibold mb-2">Không tìm thấy đơn hàng</h3>
                <p className="text-sm text-muted-foreground mb-6">Bạn chưa có đơn hàng nào trong mục này</p>
                <Button asChild className="bg-orange-500 hover:bg-orange-500/90 transition-colors duration-200">
                  <Link href="/products" className="text-white">Khám phá sản phẩm</Link>

                </Button>
              </CardContent>
            </Card>
          ) : (
            orders.map((order) => (
              <OrderCard refetchOrders={refetchOrders} key={order._id} order={order} />
            ))
          )}
        </div>
        <div className="mt-5">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            setCurrentPage={setCurrentPage}
            setItemsPerPage={setItemsPerPage}
            totalItems={totalItems}
          />
        </div>
      </div>
    </div>
  )
}
