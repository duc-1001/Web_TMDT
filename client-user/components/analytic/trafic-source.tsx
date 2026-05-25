import React from "react"
import { CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Card } from "../ui/card"
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { useQuery } from "@tanstack/react-query"
import { getTrafficSources } from "@/services/analytics.service"

const SOURCE_META: Record<string, { name: string; color: string }> = {
    organic: { name: "Tìm kiếm tự nhiên", color: "#f97316" },
    ads: { name: "Quảng cáo", color: "#10b981" },
    direct: { name: "Trực tiếp", color: "#3b82f6" },
    social: { name: "Mạng xã hội", color: "#ec4899" },
    other: { name: "Khác", color: "#6b7280" },
}

interface TrafficSourceProps {
    day: number
    tab: string
}

const TrafficSource = ({ day, tab }: TrafficSourceProps) => {
    const { data, isLoading } = useQuery({
        queryKey: ["trafficSources", day],
        queryFn: () => getTrafficSources(day),
        enabled: tab === "overview",
    })

    const chartData =
        data?.map((item: any) => ({
            name: SOURCE_META[item.name]?.name || item.name,
            value: item.value,
            color: SOURCE_META[item.name]?.color || "#9ca3af",
        })) || []

    return (
        <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle>Nguồn traffic</CardTitle>
                <CardDescription>Phân bổ lượt truy cập</CardDescription>
            </CardHeader>

            <CardContent className="h-[340px] flex items-center justify-center">
                {isLoading ? (
                    <p className="text-sm text-gray-500">Đang tải dữ liệu...</p>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                dataKey="value"
                                label={({ name, percent }) =>
                                    `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                                }
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `${value} lượt`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    )
}

export default TrafficSource