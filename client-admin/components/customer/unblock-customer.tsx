import React from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Unlock } from 'lucide-react'
import { Customer, CustomerDetail } from '@/types/customer'

interface UnblockCustomerProps {
    unblockDialogOpen: boolean
    setUnblockDialogOpen: (open: boolean) => void
    selectedCustomer: Customer|CustomerDetail | null
    handleUnblockMutation: any
}

const UnblockCustomer = ({ unblockDialogOpen, setUnblockDialogOpen, selectedCustomer, handleUnblockMutation }: UnblockCustomerProps) => {
    return (
        <Dialog open={unblockDialogOpen} onOpenChange={setUnblockDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-emerald-600">
                        <Unlock className="h-5 w-5" />
                        Mở khóa tài khoản
                    </DialogTitle>
                    <DialogDescription>
                        Bạn có chắc chắn muốn mở khóa <strong>{selectedCustomer?.fullName}</strong>?
                        Khách hàng sẽ có thể đăng nhập và đặt hàng bình thường.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button disabled={handleUnblockMutation.isPending} variant="outline" onClick={() => setUnblockDialogOpen(false)}>
                        Hủy
                    </Button>
                    <Button
                        disabled={!selectedCustomer || handleUnblockMutation.isPending}
                        onClick={async () => {
                            if (!selectedCustomer) return;                            
                            await handleUnblockMutation.mutateAsync(selectedCustomer._id);

                            setUnblockDialogOpen(false);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white hover:text-white"
                    >
                        {handleUnblockMutation.isPending ? "Đang mở khóa..." : "Mở khóa"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default UnblockCustomer
