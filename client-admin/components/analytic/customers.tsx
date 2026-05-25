"use client"

import React from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../ui/card"

import { formatPrice } from "@/lib/utils"

import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Legend,
    BarChart,
    Bar
} from "recharts"

import {
    getChurnCustomers,
    getCustomerGrowth,
    getCustomerSegmentation,
    getPurchaseFrequency,
    getTopCustomers
} from "@/services/analytics.service"

import { useQuery } from "@tanstack/react-query"
import { formatTimeAgo } from "@/lib/time"
import Link from "next/link"

interface CustomerReportProps {
    day: number
    tab?: string
}

const Customers = ({ day, tab }: CustomerReportProps) => {

    const { data: customerTrendChart = [] } = useQuery({
        queryKey: ["customer-trend-chart", day],
        queryFn: () => getCustomerGrowth(day),
        enabled: tab === "customers",
    })

    const { data: purchaseFrequency = [] } = useQuery({
        queryKey: ["purchase-frequency"],
        queryFn: () => getPurchaseFrequency(),
        enabled: tab === "customers",
    })

    const { data: churnCustomers = [] } = useQuery({
        queryKey: ["churn-customers"],
        queryFn: () => getChurnCustomers(5),
        enabled: tab === "customers",
    })

    return (
        <div className="space-y-8">

            {/* ================= CUSTOMER TREND ================= */}
            <Card className="shadow-sm border">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg">
                        Tăng trưởng khách hàng
                    </CardTitle>
                    <CardDescription>
                        Khách mới vs khách quay lại
                    </CardDescription>
                </CardHeader>

                <CardContent className="h-[320px] pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={customerTrendChart}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />

                            <XAxis
                                dataKey="day"
                                axisLine={false}
                                tickLine={false}
                                fontSize={12}
                            />

                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                fontSize={12}
                            />

                            <Tooltip formatter={(v) => `${v} khách`} />

                            <Legend />

                            <Line
                                type="monotone"
                                dataKey="newCustomers"
                                stroke="#f97316"
                                strokeWidth={3}
                                name="Khách mới"
                                dot={false}
                            />

                            <Line
                                type="monotone"
                                dataKey="returning"
                                stroke="#10b981"
                                strokeWidth={3}
                                name="Khách quay lại"
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* ================= PURCHASE FREQUENCY ================= */}
            <Card className="shadow-sm border">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg">
                        Tần suất mua hàng
                    </CardTitle>
                    <CardDescription>
                        Phân bố số đơn theo khách
                    </CardDescription>
                </CardHeader>

                <CardContent className="h-[280px] pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={purchaseFrequency}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />

                            <XAxis dataKey="range" fontSize={12} />

                            <YAxis fontSize={12} />

                            <Tooltip />

                            <Bar
                                dataKey="customers"
                                fill="#f97316"
                                radius={[6, 6, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* ================= CHURN CUSTOMERS ================= */}
            <Card className="shadow-sm border">
                <CardHeader>
                    <CardTitle className="text-lg">
                        Khách có nguy cơ rời bỏ
                    </CardTitle>
                    <CardDescription>
                        Không mua trong 60 ngày
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">

                    {
                        churnCustomers.length > 0 ? (
                            churnCustomers.map((c) => (

                                <div
                                    key={c._id}
                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition"
                                >

                                    <span className="font-medium">
                                        {c.fullName}
                                    </span>

                                    <span className="text-sm text-muted-foreground">
                                        Lần mua cuối: {formatTimeAgo(c.lastOrder)}
                                    </span>

                                </div>

                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                Không có khách hàng nào có nguy cơ rời bỏ.
                            </p>
                        )
                    }

                </CardContent>
            </Card>

        </div>
    )
}

export default Customers