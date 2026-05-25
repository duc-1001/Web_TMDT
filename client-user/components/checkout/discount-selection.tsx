import React from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Tag, Lock } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { getAvailableCoupons } from "@/services/coupon.service"
import { formatPrice } from "@/lib/utils"
import { applyDiscountToCart } from "@/services/cart.service"
import { useSelector } from "react-redux"
import { RootState } from "@/store/store"
import { queryClient } from "../QueryClientProviders"
import { toast } from "sonner"
import { getAvailableDiscounts } from "@/services/discount.service"
import { DiscountAvailable } from "@/types/discount"

interface CouponSelectionProps {
    showCouponDialog: boolean
    setShowCouponDialog: React.Dispatch<React.SetStateAction<boolean>>
    subtotal: number
}

interface DiscountSelectionProps {
    showDiscountDialog: boolean
    setShowDiscountDialog: React.Dispatch<React.SetStateAction<boolean>>
    subtotal: number
    provinceCode: number
    wardCode: number
}

const DiscountSelection = ({
    showDiscountDialog,
    setShowDiscountDialog,
    subtotal,
    wardCode,
    provinceCode,
}: DiscountSelectionProps) => {
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);
    const { data, isLoading } = useQuery({
        queryKey: ["available-discounts", subtotal],
        queryFn: () => getAvailableDiscounts(subtotal),
        enabled: showDiscountDialog && subtotal > 0,
    })

    const discounts: DiscountAvailable[] = data?.data || []

    const handleSelectDiscount = async (discount: DiscountAvailable) => {
        const cartItems = JSON.parse(localStorage.getItem("guest-cart") || "[]")
        if (!discount.eligible) return
        try {
            await applyDiscountToCart(discount.code, cartItems);
            if (!isAuthenticated) {
                const discounts = localStorage.getItem("guest-discounts") ? new Set(JSON.parse(localStorage.getItem("guest-discounts") || "[]")) : new Set<string>();
                discounts.add(discount.code);
                localStorage.setItem("guest-discounts", JSON.stringify(Array.from(discounts)));
            }
            queryClient.invalidateQueries({ queryKey: ["cart-pricing"], exact: false });
            if (discount.type === "shipping" && (provinceCode === 0 || wardCode === 0)) {
                toast.success(`Mã giảm giá "${discount.code}" đã được lưu, sẽ áp dụng khi chọn địa chỉ giao hàng`)
            } else {
                toast.success(`Áp dụng mã giảm giá "${discount.code}" thành công`)
            }

        } catch (error: any) {
            toast.error(error.message || "Mã giảm giá không hợp lệ hoặc không thể áp dụng")
        }
        setShowDiscountDialog(false)
    }

    return (
        <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Danh sách mã giảm giá</DialogTitle>
                    <DialogDescription>
                        Chọn mã để áp dụng cho đơn hàng của bạn
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <p className="text-sm text-muted-foreground">
                        Đang tải danh sách mã giảm giá...
                    </p>
                ) : discounts.length === 0 ? (
                    <p className="text-sm text-center text-muted-foreground">
                        Hiện chưa có mã giảm giá nào khả dụng.
                    </p>
                ) : (
                    <div className="grid gap-3 max-h-96 overflow-y-auto">
                        {discounts.map((discount) => {
                            const discountAmount = discount.estimatedDiscount ?? 0

                            return (
                                <button
                                    key={discount._id}
                                    type="button"
                                    onClick={() => handleSelectDiscount(discount)}
                                    disabled={!discount.eligible}
                                    className={`p-4 border-2 rounded-lg transition-all duration-200 text-left ${discount.eligible
                                        ? "hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/20 border-purple-200 dark:border-purple-900/30"
                                        : "opacity-60 border-gray-200 dark:border-gray-800 cursor-not-allowed"
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-2 gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                                                <Tag className="h-6 w-6 text-purple-600" />
                                            </div>

                                            <div>
                                                <h4 className="font-bold text-sm">{discount.code}</h4>
                                                <p className="text-xs text-muted-foreground line-clamp-2">
                                                    {discount.description}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <p className="font-bold text-purple-600">
                                                {discount.type === "percentage"
                                                    ? `${discount.value}%`
                                                    : discount.type === "shipping"
                                                        ? discount.value === 0 ? "Miễn phí" : `- ${formatPrice(discount.value)}`
                                                        : `- ${formatPrice(discount.value)}`
                                                }
                                            </p>

                                            {discountAmount > 0 && (
                                                <p className="text-xs text-muted-foreground">
                                                    -{formatPrice(discountAmount)}
                                                </p>
                                            )}

                                        </div>
                                    </div>

                                    <div className="space-y-1 text-xs text-muted-foreground">
                                        {discount.minOrderValue > 0 && (
                                            <p>
                                                Đơn tối thiểu:{" "}
                                                <span className="font-semibold text-foreground">
                                                    {formatPrice(discount.minOrderValue)}
                                                </span>
                                            </p>
                                        )}

                                        {discount.maxDiscountValue > 0 && (
                                            <p>
                                                Giảm tối đa:{" "}
                                                <span className="font-semibold text-foreground">
                                                    {formatPrice(discount.maxDiscountValue)}
                                                </span>
                                            </p>
                                        )}

                                        {discount.requireLoginToUse && (
                                            <p className="flex items-center gap-1 text-orange-600 font-medium">
                                                <Lock className="h-3 w-3" />
                                                Cần đăng nhập để sử dụng
                                            </p>
                                        )}

                                        {
                                            discount.stackable ?
                                            <p className="text-green-600 font-medium">Có thể dùng cùng mã giảm giá khác</p>
                                            :
                                            <p className="text-red-600 font-medium">Không thể dùng cùng mã giảm giá khác</p>
                                        }

                                        {!discount.eligible && discount.reason && (
                                            <p className="text-red-500 font-medium">{discount.reason}</p>
                                        )}
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

export default DiscountSelection
