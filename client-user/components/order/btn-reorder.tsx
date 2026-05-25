import React, { use } from "react"
import { Button } from "../ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "../ui/dialog"
import { RotateCcw, Loader2 } from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { reorder } from "@/services/order.service"
import { toast } from "sonner"
import { RootState } from "@/store/store"
import { useSelector } from "react-redux"
import { queryClient } from "../QueryClientProviders"

interface BtnReorderProps {
    orderCode: string
}

const BtnReorder = ({ orderCode }: BtnReorderProps) => {
    const { isAuthenticated } = useSelector(((state: RootState) => state.auth))
    const router = useRouter()
    const [open, setOpen] = React.useState(false)

    const reorderMutation = useMutation({
        mutationFn: (orderCode: string) => reorder(orderCode),
        onSuccess: () => {
            router.push(`/checkout`)
            queryClient.invalidateQueries({ queryKey: ["cart-pricing"], exact: false });
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Đặt lại đơn hàng thất bại")
        }
    })

    const isLoading = reorderMutation.isPending

    return (
        <>
            {/* Main Button */}
            <Button
                onClick={() => setOpen(true)}
                className="flex-1 w-full bg-black hover:bg-black text-white  transition-all duration-200 shadow-sm"
            >
                <RotateCcw className="h-4 w-4 mr-2" />
                Mua lại
            </Button>

            {/* Dialog */}
            <Dialog
                open={open}
                onOpenChange={(value) => {
                    if (!isLoading) setOpen(value)
                }}
            >
                <DialogContent
                    className="rounded-2xl"
                    onInteractOutside={(e) => {
                        if (isLoading) e.preventDefault()
                    }}
                    onEscapeKeyDown={(e) => {
                        if (isLoading) e.preventDefault()
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>Xác nhận mua lại</DialogTitle>
                        <DialogDescription>
                            Bạn có muốn đặt lại đơn hàng{" "}
                            <span className="font-semibold">{orderCode}</span> không?
                            <br />
                            Giá và tồn kho có thể thay đổi.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            disabled={isLoading}
                            onClick={() => setOpen(false)}
                        >
                            Huỷ
                        </Button>

                        <Button
                            onClick={() => {
                                if (!isAuthenticated) {
                                    toast.error("Bạn cần đăng nhập để thực hiện hành động này")
                                    return;
                                }
                                reorderMutation.mutate(orderCode)
                            }}
                            disabled={isLoading}
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                        >
                            {isLoading && (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            )}
                            {isLoading ? "Đang xử lý..." : "Xác nhận"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default BtnReorder