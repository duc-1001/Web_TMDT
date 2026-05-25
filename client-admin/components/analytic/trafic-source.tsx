import React from "react"
import { CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Card } from "../ui/card"
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { useQuery } from "@tanstack/react-query"
import { getTrafficSources } from "@/services/analytics.service"

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

    // API trả về sẵn: { name, label, color, value, percent }
    const chartData =
        data?.map((item: any) => ({
            name: item.label || item.name,   // label hiển thị đẹp (VD: "Facebook")
            value: item.value,
            color: item.color || "#9ca3af",
            percent: item.percent,
        })) || []

    const total = chartData.reduce((sum: number, d: any) => sum + d.value, 0)

    return (
        <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle>Nguồn traffic</CardTitle>
                <CardDescription>
                    Phân bổ lượt truy cập theo kênh •{" "}
                    <span className="font-medium text-foreground">{total.toLocaleString()} lượt</span>
                </CardDescription>
            </CardHeader>

            <CardContent className="h-[340px] flex items-center justify-center">
                {isLoading ? (
                    <p className="text-sm text-gray-500">Đang tải dữ liệu...</p>
                ) : chartData.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Chưa có dữ liệu trong khoảng thời gian này</p>
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
                                {chartData.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: any, name: any, props: any) =>
                                    [`${value} lượt (${props.payload.percent}%)`, name]
                                }
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    )
}

export default TrafficSource
