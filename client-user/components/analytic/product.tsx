"use client"

import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPrice } from "@/lib/utils"
import { useQuery } from "@tanstack/react-query"
import {
    getExpiringProducts,
    getLowSellingProducts,
    getLowStockProducts,
    getTopSellingProducts,
} from "@/services/analytics.service"
import Link from "next/link"
import { getDaysUntil } from "@/lib/time"

interface ProductReportProps {
    day: number
    tab?: string
}

type ProductType = "top" | "lowSelling" | "lowStock" | "expiring"

interface ProductRowProps {
    product: any
    type: ProductType
}

const ProductRow = ({ product, type }: ProductRowProps) => (
    <div className="flex items-center justify-between border-b pb-3 last:border-0">
        <div className="flex items-center gap-3">
            <Link href={`/products/${product.productId}`} className="flex items-center gap-3">
                <Image
                    src={product.image || "/placeholder.png"}
                    alt={product.name}
                    width={40}
                    height={40}
                    className="rounded object-cover"
                />
            </Link>

            <div>
                <Link href={`/products/${product.productId}`} className="font-medium hover:underline">
                    {product.name}
                </Link>

                {type === "top" && (
                    <p className="text-sm text-muted-foreground">
                        {product.sold} đã bán
                    </p>
                )}

                {type === "lowSelling" && (
                    <p className="text-sm text-muted-foreground">
                        {product.sold} bán
                    </p>
                )}

                {type === "expiring" && (
                    <p className="text-sm text-orange-500">
                        Hết hạn: {getDaysUntil(product.expirationDate)} ngày nữa
                    </p>
                )}
            </div>
        </div>

        {type === "lowStock" && (
            <span className="text-sm font-semibold text-red-500">
                Còn {product.stock}
            </span>
        )}

        {(type === "top" || type === "lowSelling") && (
            <p className="font-semibold">{formatPrice(product.revenue)}</p>
        )}
    </div>
)

interface ProductCardProps {
    title: string
    data?: any[]
    loading: boolean
    type: ProductType
}

const ProductCard = ({ title, data = [], loading, type }: ProductCardProps) => {
    if (!loading && data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                </CardHeader>

                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-4">
                        Không có dữ liệu
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {loading && (
                    <p className="text-sm text-muted-foreground">Đang tải...</p>
                )}

                {!loading &&
                    data.map((product) => (
                        <ProductRow
                            key={product.productId}
                            product={product}
                            type={type}
                        />
                    ))}
            </CardContent>
        </Card>
    )
}

const ProductReport = ({ day, tab }: ProductReportProps) => {
    const { data: topProducts = [], isLoading: isLoadingTop } = useQuery({
        queryKey: ["top-selling-products", day],
        queryFn: () => getTopSellingProducts(day, 5),
        enabled: tab === "products",
    })

    const { data: lowSellingProducts = [], isLoading: isLoadingLowSelling } =
        useQuery({
            queryKey: ["low-selling-products", day],
            queryFn: () => getLowSellingProducts(day, 5),
            enabled: tab === "products",
        })

    const { data: lowStockProducts = [], isLoading: isLoadingLowStock } =
        useQuery({
            queryKey: ["low-stock-products"],
            queryFn: () => getLowStockProducts(5, 10),
            enabled: tab === "products",
        })

    const { data: expiringProducts = [], isLoading: isLoadingExpiring } =
        useQuery({
            queryKey: ["expiring-products"],
            queryFn: () => getExpiringProducts(5, 7),
            enabled: tab === "products",
        })

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <ProductCard
                title="Sản phẩm bán chạy"
                data={topProducts}
                loading={isLoadingTop}
                type="top"
            />

            <ProductCard
                title="Sản phẩm bán chậm"
                data={lowSellingProducts}
                loading={isLoadingLowSelling}
                type="lowSelling"
            />

            <ProductCard
                title="Sản phẩm sắp hết hàng"
                data={lowStockProducts}
                loading={isLoadingLowStock}
                type="lowStock"
            />

            <ProductCard
                title="Sản phẩm sắp hết hạn"
                data={expiringProducts}
                loading={isLoadingExpiring}
                type="expiring"
            />
        </div>
    )
}

export default ProductReport