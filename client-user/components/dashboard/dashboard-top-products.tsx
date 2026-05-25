import { getTopProducts } from '@/services/dashboard.service'
import { useQuery } from '@tanstack/react-query'
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { formatPrice } from '@/lib/utils'
import { Progress } from '../ui/progress'
import { Button } from '../ui/button'
import Link from 'next/link'

const DashboardTopProducts = () => {
    const { data, isLoading } = useQuery({
        queryKey: ["dashboard-top-products"],
        queryFn: () => getTopProducts(5), // Lấy 5 sản phẩm bán chạy nhất
    })
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Sản phẩm bán chạy</CardTitle>
                    <CardDescription>Top snack bán nhiều nhất</CardDescription>
                </div>

                <Button asChild size="sm" variant="outline">
                    <Link href="/products">Xem tất cả</Link>
                </Button>
            </CardHeader>

            <CardContent className="space-y-4">
                {data && data.map((product, i) => {
                    const percent = (product.sold / 250) * 100

                    return (
                        <div key={product._id} className="space-y-2">

                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">{product.name}</p>
                                <span className="text-xs text-muted-foreground">
                                    {product.sold} đã bán
                                </span>
                            </div>

                            <Progress value={percent} className='h-2 bg-gray-200 [&>div]:bg-green-500' />

                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Doanh thu</span>
                                <span className="font-medium">
                                    {formatPrice(product.revenue)}
                                </span>
                            </div>
                        </div>
                    )
                })}
            </CardContent>
        </Card>
    )
}

export default DashboardTopProducts
