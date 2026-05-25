'use client'
import { Button } from "@/components/ui/button"
import {  LoaderCircle } from "lucide-react"
import { Discount } from "@/types/discount"
import { formatDate, formatPrice } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"


interface DiscountDetailProps {
    showDetailDiscountDialog: boolean;
    setShowDetailDiscountDialog: (open: boolean) => void;
    selectedDiscount: Discount;
}

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


const DiscountDetail = ({ showDetailDiscountDialog, setShowDetailDiscountDialog, selectedDiscount }: DiscountDetailProps) => {
    return (
        <Dialog open={showDetailDiscountDialog} onOpenChange={setShowDetailDiscountDialog}>
            <DialogContent className="max-w-4xl sm:max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 bg-white dark:bg-gray-900 border shadow-2xl rounded-xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">
                        {selectedDiscount.name}
                    </DialogTitle>
                    <DialogDescription>
                        Chi tiết chương trình khuyến mãi
                    </DialogDescription>
                </DialogHeader>

                {/* Content */}
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Image */}
                    <img
                        src={selectedDiscount.image || "/placeholder.svg"}
                        alt={selectedDiscount.name}
                        className="w-full  object-cover rounded"
                    />

                    {/* Info */}
                    <div className="space-y-4">
                        {/* Discount highlight */}
                        <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
                            <p className="text-sm text-muted-foreground">Giá trị ưu đãi</p>
                            <p className="text-3xl font-bold text-orange-600">
                                {selectedDiscount.type === "percentage"
                                    ? `${selectedDiscount.value}%`
                                    : formatPrice(selectedDiscount.value)}
                            </p>
                        </div>

                        {/* Description */}
                        <p className="text-muted-foreground">
                            {selectedDiscount.description}
                        </p>

                        {/* Conditions */}
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Loại khuyến mãi</span>
                                <span className="font-medium">{getDiscountType(selectedDiscount.type)}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Đơn tối thiểu</span>
                                <span className="font-medium">
                                    {selectedDiscount.minOrderValue
                                        ? formatPrice(selectedDiscount.minOrderValue)
                                        : "Không giới hạn"}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Giảm tối đa</span>
                                <span className="font-medium">
                                    {selectedDiscount.maxDiscountValue
                                        ? formatPrice(selectedDiscount.maxDiscountValue)
                                        : "Không giới hạn"}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Mỗi người dùng</span>
                                <span className="font-medium">
                                    {selectedDiscount.maxUsagePerUser === 0
                                        ? "Không giới hạn"
                                        : `${selectedDiscount.maxUsagePerUser} lần`}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Thời gian</span>
                                <span className="font-medium  whitespace-nowrap">
                                    {formatDate(selectedDiscount.startDate)}
                                    → {formatDate(selectedDiscount.endDate)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Áp dụng cùng khuyến mãi khác</span>
                                {selectedDiscount.stackable ? (
                                    <span className="text-green-600 font-semibold">Có thể áp dụng</span>
                                ) : (
                                    <span className="text-red-500 font-semibold">Không áp dụng</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="mt-6">
                    <Button variant="outline" onClick={() => setShowDetailDiscountDialog(false)}>
                        Đóng
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default DiscountDetail
