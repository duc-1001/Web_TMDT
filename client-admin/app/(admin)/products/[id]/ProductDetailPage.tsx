'use client'
import { SelectItem } from "@/components/ui/select"
import { SelectContent } from "@/components/ui/select"
import { SelectValue } from "@/components/ui/select"
import { SelectTrigger } from "@/components/ui/select"
import { Select } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, TrendingUp, ShoppingCart, Eye, DollarSign, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { useQuery } from "@tanstack/react-query"
import { getAnalyticsRevenueProduct, getAnalyticsSummaryProduct, getBatchProductStatus, getProductBasicInfo, getProductOrdersViewsChart, getProductPerformance } from "@/services/product.service"
import { formatPrice } from "@/lib/utils"

interface ProductDetailPageProps {
    id: string
}

export default function ProductDetailPage({ id }: ProductDetailPageProps) {
    const router = useRouter()
    const { data: productBasicInfo, isLoading, isError } = useQuery({
        queryKey: ['admin-product-basic-info', id],
        queryFn: () => getProductBasicInfo(id),
        enabled: !!id,
        retry: false,
    })
    const { data: batchProductStatus } = useQuery({
        queryKey: ['admin-batch-product-status', id],
        queryFn: () => getBatchProductStatus(id),
        enabled: !!id,
    })
    const { data: analyticsSummary } = useQuery({
        queryKey: ['admin-analytics-summary-product', id],
        queryFn: () => getAnalyticsSummaryProduct(id),
        enabled: !!id,
    })

    const [revenueDays, setRevenueDays] = useState(7)
    const { data: revenueChartData } = useQuery({
        queryKey: ['admin-analytics-revenue-product', id, revenueDays],
        queryFn: () => getAnalyticsRevenueProduct(id, revenueDays),
        enabled: !!id,
    })

    const [trafficDays, setTrafficDays] = useState(7)
    const { data: salesData } = useQuery({
        queryKey: ['admin-analytics-traffic-product', id, trafficDays],
        queryFn: () => getProductOrdersViewsChart(id, trafficDays),
        enabled: !!id,
    })

    const [performanceDays, setPerformanceDays] = useState(7)
    const { data: performanceData } = useQuery({
        queryKey: ['admin-analytics-performance-product', id, performanceDays],
        queryFn: () => getProductPerformance(id, performanceDays),
        enabled: !!id,
    })

    useEffect(() => {
        if (isError || (!isLoading && productBasicInfo === null)) {
            toast.error("Không tìm thấy sản phẩm", {
                description: "Đang chuyển về danh sách sản phẩm...",
            })
            router.replace("/products")
        }
    }, [isError, isLoading, productBasicInfo])

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded bg-muted animate-pulse" />
                    <div className="space-y-2">
                        <div className="h-8 w-56 rounded bg-muted animate-pulse" />
                        <div className="h-4 w-40 rounded bg-muted animate-pulse" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-28 rounded-lg bg-muted animate-pulse" />
                    ))}
                </div>
                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="h-80 rounded-lg bg-muted animate-pulse" />
                        <div className="h-80 rounded-lg bg-muted animate-pulse" />
                    </div>
                    <div className="h-96 rounded-lg bg-muted animate-pulse" />
                </div>
            </div>
        )
    }

    if (isError || !productBasicInfo) return null

    return (
        <div>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/products">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">{productBasicInfo?.name}</h1>
                        <p className="text-muted-foreground">Thống kê doanh số bán hàng {productBasicInfo?.sku && "-" + productBasicInfo.sku}</p>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Doanh thu tháng này</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{analyticsSummary?.revenue?.toLocaleString()} ₫</div>
                            <p className="text-xs text-muted-foreground">{analyticsSummary?.revenueGrowth?.toFixed(2)}% so với tháng trước</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Số đơn hàng</CardTitle>
                            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{analyticsSummary?.orders?.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">{analyticsSummary?.ordersGrowth?.toFixed(2)}% so với tháng trước</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Lượt xem</CardTitle>
                            <Eye className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{analyticsSummary?.views?.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">{analyticsSummary?.viewsGrowth?.toFixed(2)}% so với tháng trước</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Tỉ lệ chuyển đổi</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{analyticsSummary?.conversionRate?.toFixed(2)}%</div>
                            <p className="text-xs text-muted-foreground">{analyticsSummary?.conversionRateGrowth?.toFixed(2)}% so với tháng trước</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Stock Alert */}
                <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold text-yellow-900">Cảnh báo tồn kho</h3>
                            <p className="text-sm text-yellow-800">Tồn kho hiện tại là {productBasicInfo?.stock?.toLocaleString()} sản phẩm. Cân nhắc tạo đơn hàng mới nếu bán chạy tiếp tục.</p>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Revenue Chart */}
                        <Card>
                            <CardHeader className="flex items-center justify-between">
                                <div className="font-medium ">Doanh thu hàng ngày</div>
                                <Select value={revenueDays.toString()} onValueChange={(value) => setRevenueDays(parseInt(value))}>
                                    <SelectTrigger className="w-[100px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent position="popper" sideOffset={4}>
                                        <SelectItem value="7">7 ngày</SelectItem>
                                        <SelectItem value="30">30 ngày</SelectItem>
                                        {/* <SelectItem value="90">90 ngày</SelectItem>
                                        <SelectItem value="180">180 ngày</SelectItem>
                                        <SelectItem value="365">1 năm</SelectItem> */}
                                    </SelectContent>
                                </Select>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={revenueChartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip formatter={(value) => `${value ? value.toLocaleString() : ''} ₫`} />
                                        <Legend />
                                        <Line type="monotone" dataKey="sales" stroke="green" name="Doanh thu" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                        {/* Orders & Views */}
                        <Card>
                            <CardHeader className="flex items-center justify-between">
                                <div className="font-medium ">Đơn hàng & Lượt xem</div>
                                <Select value={trafficDays.toString()} onValueChange={(value) => setTrafficDays(parseInt(value))}>
                                    <SelectTrigger className="w-[100px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent position="popper" sideOffset={4}>
                                        <SelectItem value="7">7 ngày</SelectItem>
                                        <SelectItem value="30">30 ngày</SelectItem>
                                        {/* <SelectItem value="90">90 ngày</SelectItem>
                                        <SelectItem value="180">180 ngày</SelectItem>
                                        <SelectItem value="365">1 năm</SelectItem> */}
                                    </SelectContent>
                                </Select>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={salesData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis yAxisId="left" />
                                        <YAxis yAxisId="right" orientation="right" />
                                        <Tooltip />
                                        <Legend />
                                        <Bar yAxisId="left" dataKey="orders" fill="#4ade80" name="Đơn hàng" />
                                        <Bar yAxisId="right" dataKey="views" fill="#818cf8" name="Lượt xem" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex items-center justify-between">
                                <div className="font-medium">Hiệu suất</div>
                                <Select value={performanceDays.toString()} onValueChange={(value) => setPerformanceDays(parseInt(value))}>
                                    <SelectTrigger className="w-[100px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent position="popper" sideOffset={4}>
                                        <SelectItem value="7">7 ngày</SelectItem>
                                        <SelectItem value="30">30 ngày</SelectItem>
                                        {/* <SelectItem value="90">90 ngày</SelectItem>
                                        <SelectItem value="180">180 ngày</SelectItem>
                                        <SelectItem value="365">1 năm</SelectItem> */}
                                    </SelectContent>
                                </Select>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-muted-foreground">Tỉ lệ tìm kiếm</p>
                                        <p className="font-medium">{performanceData?.searchRate}%</p>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-primary" style={{ width: `${performanceData?.searchRate || 0}%` }} />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-muted-foreground">Tỉ lệ giỏ hàng</p>
                                        <p className="font-medium">{performanceData?.addToCartRate}%</p>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500" style={{ width: `${performanceData?.addToCartRate || 0}%` }} />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-muted-foreground">Tỉ lệ yêu thích</p>
                                        <p className="font-medium">{performanceData?.wishlistRate}%</p>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-red-500" style={{ width: `${performanceData?.wishlistRate || 0}%` }} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        {/* Product Summary */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Thông tin sản phẩm</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">SKU</p>
                                    <p className="font-medium">{productBasicInfo?.sku}</p>
                                </div>
                                <div className="border-t pt-4">
                                    <p className="text-muted-foreground">Danh mục</p>
                                    <p className="font-medium">{productBasicInfo?.category.name}</p>
                                </div>
                                <div className="border-t pt-4">
                                    <p className="text-muted-foreground">Thương hiệu</p>
                                    <p className="font-medium">{productBasicInfo?.brand.name}</p>
                                </div>
                                <div className="border-t pt-4">
                                    <p className="text-muted-foreground">Giá bán hiện tại</p>
                                    <p className="font-medium">{formatPrice(productBasicInfo?.price || 0)}</p>
                                </div>
                                <div className="border-t pt-4">
                                    <p className="text-muted-foreground">Tồn kho</p>
                                    <p className="font-medium text-yellow-600">{productBasicInfo?.stock} sản phẩm</p>
                                </div>
                                <div className="border-t pt-4 flex items-center justify-between">
                                    <p className="text-muted-foreground">Trạng thái</p>
                                    {
                                        productBasicInfo?.isActive ? (
                                            <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                                                Hoạt động
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">
                                                Ngưng hoạt động
                                            </span>
                                        )
                                    }
                                </div>
                            </CardContent>
                        </Card>
                        {/* Batch Summary */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Lô hàng & tồn kho</CardTitle>
                            </CardHeader>

                            <CardContent className="space-y-4 text-sm">
                                <div className="flex items-center justify-between">
                                    <p className="text-muted-foreground">Tổng số lô</p>
                                    <p className="font-medium">{batchProductStatus?.totalBatches}</p>
                                </div>

                                <div className="flex items-center justify-between">
                                    <p className="text-muted-foreground">Lô còn hàng</p>
                                    <p className="font-medium text-green-600">{batchProductStatus?.activeBatches}</p>
                                </div>

                                <div className="flex items-center justify-between">
                                    <p className="text-muted-foreground">Sắp hết hạn (≤ 7 ngày)</p>
                                    <p className="font-medium text-yellow-600">{batchProductStatus?.expiringSoonBatches}</p>
                                </div>

                                <div className="flex items-center justify-between">
                                    <p className="text-muted-foreground">Đã hết / hết hạn</p>
                                    <p className="font-medium text-red-600">{batchProductStatus?.expiredOrEmptyBatches}</p>
                                </div>

                                <div className="pt-2">
                                    <Button variant="outline" className="w-full" asChild>
                                        <Link href={`/products/${id}/batches`}>
                                            Quản lý lô hàng
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                            <Button className="w-full" asChild>
                                <Link href={`/products/edit/${id}`}>Chỉnh sửa sản phẩm</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
