import React, { useState } from 'react'
import { Button } from '../ui/button'
import { XCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogOverlay, DialogTitle } from '../ui/dialog'
import { useMutation } from '@tanstack/react-query'
import { RootState } from '@/store/store'
import { useSelector } from 'react-redux'
import { toast } from 'sonner'

interface BtnCancelOrderProps {
    orderCode: string
    cancelOrderMutation: any
    setOpenDialogCancel: React.Dispatch<React.SetStateAction<boolean>>
    openDialogCancel: boolean
}

const BtnCancelOrder = ({ orderCode, cancelOrderMutation, setOpenDialogCancel, openDialogCancel }: BtnCancelOrderProps) => {
    const { isAuthenticated } = useSelector(((state: RootState) => state.auth))

    return (
        <>
            <Button
                variant="outline"
                className="flex-1 w-full border-red-200 text-red-600 hover:text-red-600 hover:bg-red-50"
                onClick={() => setOpenDialogCancel(true)}
            >
                <XCircle className="h-4 w-4 mr-2" />
                Hủy đơn
            </Button>
            <Dialog open={openDialogCancel} onOpenChange={setOpenDialogCancel}>
                <DialogOverlay className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" />
                <DialogContent className="fixed top-1/2 left-1/2 w-[92%] max-w-md -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 shadow-2xl border animate-in zoom-in-95 duration-200">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
                            <XCircle className="h-6 w-6 text-red-500" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-semibold">
                                Xác nhận hủy đơn
                            </DialogTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                Đơn hàng <span className="font-medium">{orderCode}</span> sẽ bị hủy và không thể khôi phục.
                            </p>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t my-4" />

                    {/* Action buttons */}
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => setOpenDialogCancel(false)}
                        >
                            Giữ lại đơn
                        </Button>

                        <Button
                            disabled={cancelOrderMutation.isPending}
                            onClick={() => {
                                if (!isAuthenticated) {
                                    toast.error("Bạn cần đăng nhập để thực hiện hành động này")
                                    return;
                                }
                                cancelOrderMutation.mutate(orderCode)
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white rounded-xl">
                            Xác nhận hủy
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default BtnCancelOrder
