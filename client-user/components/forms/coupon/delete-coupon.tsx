import React from 'react'
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { queryClient } from '@/components/QueryClientProviders';
import { useMutation } from '@tanstack/react-query';
import { Coupon } from '@/types/coupon';
import { deleteCoupon } from '@/services/coupon.service';
import { toast } from 'sonner';
interface DeleteCouponProps {
    selectedCoupon: Coupon;
    setDeleteDialogOpen: (open: boolean) => void;
}
const DeleteCoupon = ({ selectedCoupon, setDeleteDialogOpen }: DeleteCouponProps) => {
    const deleteCouponMutation = useMutation({
        mutationFn: deleteCoupon,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['coupons-admin'] });
            setDeleteDialogOpen(false);
            toast.success("Phiếu giảm giá đã được xóa thành công.");
        },
        onError: (error) => {
            console.error("Error deleting coupon:", error);
            toast.error("Đã xảy ra lỗi khi xóa phiếu giảm giá! Vui lòng thử lại sau.");
        }
    });

    const handleDelete = () => {
        if (!selectedCoupon) return;
        deleteCouponMutation.mutate(selectedCoupon._id);
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Xác nhận xóa phiếu giảm giá</DialogTitle>
                <DialogDescription>
                    Bạn có chắc chắn muốn xóa phiếu giảm giá "{selectedCoupon?.code}"? Hành động này không thể hoàn tác.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button
                    variant="outline"
                    onClick={() => setDeleteDialogOpen(false)}
                    disabled={deleteCouponMutation.isPending}
                >
                    Hủy
                </Button>

                <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleteCouponMutation.isPending}
                >
                    {deleteCouponMutation.isPending ? "Đang xóa..." : "Xóa phiếu giảm giá"}
                </Button>
            </DialogFooter>
        </DialogContent>
    );
};


export default DeleteCoupon
