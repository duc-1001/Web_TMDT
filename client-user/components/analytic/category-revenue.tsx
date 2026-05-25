import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { formatPrice } from '@/lib/utils'
import { getCategoryRevenue } from '@/services/analytics.service'
import { useQuery } from '@tanstack/react-query'
import { CategoryRevenue } from '@/types/analytic'

interface CategoryRevenueProps {
    day: number
    tab?: string
}

const CategoryRevenueComponent = ({ day, tab }: CategoryRevenueProps) => {
    const { data, isLoading } = useQuery({
        queryKey: ["categoryRevenue", day],
        queryFn: () => getCategoryRevenue(day),
        enabled: tab === "overview",
    })

    if (isLoading) return <p className="text-gray-500">Đang tải dữ liệu...</p>
    if (!data || data.length === 0) return <p className="text-gray-500">Chưa có dữ liệu doanh thu</p>

    // Tổng doanh thu để tính percent
    const totalRevenue = data.reduce((sum, cat) => sum + cat.revenue, 0)

    const chartData: CategoryRevenue[] = data.map((cat) => ({
        ...cat,
        percent: totalRevenue ? (cat.revenue / totalRevenue) * 100 : 0
    }))

    return (
        <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle>Doanh thu theo danh mục</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 max-h-[500px] overflow-y-auto">
                {chartData.map((cat) => (
                    <div key={cat.categoryId}>
                        <div className="flex justify-between text-sm mb-1.5">
                            <span className="font-medium">{cat.categoryName}</span>
                            <span>{formatPrice(cat.revenue)}</span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-orange-500 rounded-full"
                                style={{ width: `${cat.percent.toFixed(1)}%` }}
                            />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}

export default CategoryRevenueComponent