'use client'

import { useSelector } from "react-redux"
import { RootState } from "@/store/store"
import { useEffect, useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { mergeGuestCart } from "@/services/cart.service"
import { toast } from "sonner"
import { queryClient } from "../QueryClientProviders"
import { Cart } from "@/types/cart"

const MergeCartNotify = () => {
    const { isAuthenticated } = useSelector((state: RootState) => state.auth)
    const [showMergeCartModal, setShowMergeCartModal] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (!isAuthenticated) return

        const guestCart = JSON.parse(
            localStorage.getItem("guest-cart") || "[]"
        )
        const mergeHandled = localStorage.getItem("merge-cart-handled") === "true"

        if (guestCart.length > 0 && !mergeHandled) {
            setShowMergeCartModal(true)
        }
    }, [isAuthenticated])

    const handleCloseMerge = () => {
        localStorage.setItem("merge-cart-handled", "true")
        setShowMergeCartModal(false)
    }

    const handleMergeCart = async () => {
        try {
            setIsSubmitting(true)

            const guestCart = JSON.parse(
                localStorage.getItem("guest-cart") || "[]"
            )

            const res = await mergeGuestCart(guestCart)

            queryClient.setQueryData(
                ["user-cart"],
                (old: Cart | undefined) => res ?? old
            )
            queryClient.invalidateQueries({ queryKey: ["cart-pricing"], exact: false })
            localStorage.removeItem("guest-cart")
            localStorage.setItem("merge-cart-handled", "true")
            setShowMergeCartModal(false)
            toast.success("Hợp nhất giỏ hàng thành công!")
        } catch (error) {
            toast.error(
                "Có lỗi xảy ra khi hợp nhất giỏ hàng. Vui lòng thử lại sau."
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={showMergeCartModal} onOpenChange={setShowMergeCartModal}>
            <DialogContent className="sm:max-w-[420px] rounded-2xl px-6 py-6">
                <DialogHeader className="space-y-3">
                    {/* ICON / LOADING */}
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
                        {isSubmitting ? (
                            <svg
                                className="h-7 w-7 animate-spin text-orange-500"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                />
                            </svg>
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-7 w-7 text-orange-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.5 3h13M7 13l1.5 3M10 21a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z"
                                />
                            </svg>
                        )}
                    </div>

                    <DialogTitle className="text-center text-xl font-semibold text-orange-600">
                        Hợp nhất giỏ hàng
                    </DialogTitle>
                </DialogHeader>

                <div className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">
                    Chúng tôi phát hiện bạn có sản phẩm trong giỏ hàng khi chưa đăng nhập.
                    <br />
                    Bạn có muốn{" "}
                    <span className="font-medium text-orange-600">
                        hợp nhất giỏ hàng này
                    </span>{" "}
                    với giỏ hàng hiện tại của bạn không?
                </div>

                <DialogFooter className="mt-6 flex gap-3 sm:justify-center">
                    <Button
                        variant="outline"
                        className="flex-1 rounded-xl border-orange-300 text-orange-600 hover:bg-orange-50"
                        disabled={isSubmitting}
                        onClick={handleCloseMerge}
                    >
                        Hủy
                    </Button>

                    <Button
                        className="flex-1 rounded-xl bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-60"
                        onClick={handleMergeCart}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Đang hợp nhất..." : "Hợp nhất"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default MergeCartNotify
