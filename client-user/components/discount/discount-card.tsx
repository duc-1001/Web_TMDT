'use client'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Gift, Sparkles, TrendingUp, Users, Layers, CheckCircle, XCircle, LoaderCircle } from "lucide-react"
import { Discount } from "@/types/discount"
import { formatDate, formatPrice } from "@/lib/utils"

const getDiscountType = (type: string) => {
    switch (type) {
        case "percentage":
            return "Giảm theo %"
        case "fixed":
            return "Giảm theo số tiền"
        case "shipping":
            return "Miễn phí vận chuyển"
        case "buy_x_get_y":
            return "Mua X tặng Y"
        default:
            return "Khuyến mãi"
    }
}

function DiscountCard({ promo, handleShowDetailDiscount }: { promo: Discount, handleShowDetailDiscount: (Discount: Discount) => void }) {

    return (
        <Card className="group relative overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 border-2 hover:border-orange-500/50">
            <CardContent className="p-0">
                {/* Image section with gradient overlay */}
                <div className="relative w-full overflow-hidden bg-muted">
                    <img
                        src={promo.image || "/placeholder.svg"}
                        alt={promo.name}
                        className="object-cover w-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />

                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex gap-2">
                        <Badge className="bg-white/95 text-foreground backdrop-blur-sm shadow-lg">{getDiscountType(promo.type)}</Badge>
                        {promo.isFeature && (
                            <Badge className="bg-orange-600 text-white shadow-lg">
                                <Sparkles className="h-3 w-3 mr-1" />
                                Nổi bật
                            </Badge>
                        )}
                    </div>

                    {/* Discount badge */}
                    <div className="absolute top-4 right-4 bg-white rounded-full  p-3 flex items-center justify-center shadow-2xl transform group-hover:rotate-12 transition-transform duration-300">
                        <div className="text-center">
                            <div className="text-xl font-bold text-orange-500 leading-none">{promo.type === "percentage" ? `${promo.value}%` : `${formatPrice(promo.value)}`}</div>
                        </div>
                    </div>
                </div>

                {/* Content section */}
                <div className="px-6 py-3">
                    <h3 className="text-xl font-bold mb-3 text-balance line-clamp-1 group-hover:text-orange-500 transition-colors">
                        {promo.name}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed mb-3 text-pretty line-clamp-1">{promo.description}</p>

                    {/* Info row */}
                    <div className="flex flex-col gap-3 mb-3">
                        {/* Thời gian */}
                        <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-orange-500" />
                            <span className="text-muted-foreground">Có hiệu lực đến:</span>
                            <span className="font-semibold">{formatDate(promo.endDate)}</span>
                        </div>
                        {/* Usage per user */}
                        {promo.maxUsagePerUser === 0 ?
                            (
                                <div className="flex items-center gap-2 text-sm">
                                    <Users className="h-4 w-4 text-orange-500" />
                                    <span className="text-muted-foreground">Mỗi người:</span>
                                    <span className="font-semibold text-green-600">Không giới hạn</span>
                                </div>
                            ) :
                            (
                                <div className="flex items-center gap-2 text-sm">
                                    <Users className="h-4 w-4 text-orange-500" />
                                    <span className="text-muted-foreground">Mỗi người:</span>
                                    <span className="font-semibold">
                                        {promo.maxUsagePerUser} lần
                                    </span>
                                </div>
                            )}
                        <div className="flex items-center gap-2 text-sm">
                            <Layers className="h-4 w-4 text-orange-500" />
                            <span className="text-muted-foreground">Áp dụng cùng KM khác:</span>

                            {promo.stackable ? (
                                <span className="flex items-center gap-1 font-semibold text-green-600">
                                    <CheckCircle className="h-4 w-4" />
                                    Có thể áp dụng
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 font-semibold text-red-500">
                                    <XCircle className="h-4 w-4" />
                                    Không áp dụng
                                </span>
                            )}
                        </div>

                    </div>

                    {/* Action button */}
                    <Button className="flex-2 group/btn bg-gray-400 hover:bg-gray-500/80 cursor-pointer" size="lg" asChild onClick={() => handleShowDetailDiscount(promo)}>
                        <div className="w-full items-center gap-3">
                            <Gift className="h-4 w-4" />
                            Xem chi tiết
                            <TrendingUp className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                        </div>
                    </Button>
                </div>
            </CardContent >
        </Card >
    )
}
export default DiscountCard