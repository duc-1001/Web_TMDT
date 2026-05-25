import { getRecentOrders } from '@/services/dashboard.service'
import { useQuery, } from '@tanstack/react-query'
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { formatPrice } from '@/lib/utils'
import { Button } from '../ui/button'
import Link from 'next/link'
import { formatTimeAgo } from '@/lib/time'
import { Badge } from '../ui/badge'

const getStatusBadge = (status: string) => {
    switch (status) {
        case "completed":
            return <Badge className="bg-green-100 text-green-700">Hoàn thành</Badge>
        case "confirmed":
            return <Badge className="bg-blue-100 text-blue-700">Đã xác nhận</Badge>
        case "pending":
            return <Badge className="bg-yellow-100 text-yellow-700">Chờ xác nhận</Badge>
        case "shipping":
            return <Badge className="bg-cyan-100 text-cyan-700">Đang giao</Badge>
        case "delivered":
            return <Badge className="bg-green-100 text-green-700">Đã giao</Badge>
        case "cancelled":
            return <Badge className="bg-red-100 text-red-700">Đã hủy</Badge>
        case "failed":
            return <Badge className="bg-red-100 text-red-700">Thất bại</Badge>
        default:
            return <Badge variant="secondary">Khác</Badge>
    }
}

const DashboardRecentOrders = () => {
    const { data, isLoading } = useQuery({
        queryKey: ["dashboard-recent-orders"],
        queryFn: () => getRecentOrders(10), // Lấy 5 đơn hàng gần nhất
    })
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Đơn hàng gần đây</CardTitle>
                    <CardDescription>Những đơn mới nhất</CardDescription>
                </div>

                <Button asChild size="sm" variant="outline">
                    <Link href="/orders">Xem tất cả</Link>
                </Button>
            </CardHeader>

            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Mã đơn</TableHead>
                            <TableHead>Khách</TableHead>
                            <TableHead>Số tiền</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead>Ngày</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {data && data.map((order) => (
                            <TableRow key={order._id}>
                                <TableCell className="font-medium">
                                    <Link
                                        href={`/orders/${order.orderCode}`}
                                        className="hover:text-orange-500"
                                    >
                                        {order.orderCode}
                                    </Link>
                                </TableCell>

                                <TableCell>{order.customer.name}</TableCell>

                                <TableCell className="font-medium">
                                    {formatPrice(order.totalAmount)}
                                </TableCell>

                                <TableCell>{getStatusBadge(order.status)}</TableCell>

                                <TableCell className="text-muted-foreground text-sm">
                                    {formatTimeAgo(order.createdAt)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

export default DashboardRecentOrders
