import React from 'react'
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { queryClient } from '@/components/QueryClientProviders';
import { useMutation } from '@tanstack/react-query';
import { Discount } from '@/types/discount';
import { deleteDiscount } from '@/services/discount.service';
import { toast } from 'sonner';
interface DeleteDiscountProps {
    selectedDiscount: Discount;
    setDeleteDialogOpen: (open: boolean) => void;
}
const DeleteDiscount = ({ selectedDiscount, setDeleteDialogOpen }: DeleteDiscountProps) => {
    const deleteDiscountMutation = useMutation({
        mutationFn: deleteDiscount,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['discounts-admin'] });
            setDeleteDialogOpen(false);
            toast.success("Khuyến mãi đã được xóa thành công.");
        },
        onError: (error) => {
            console.error("Error deleting product:", error);
            toast.error("Đã xảy ra lỗi khi xóa khuyến mãi! Vui lòng thử lại sau.");
        }
    });

    const handleDelete = () => {
        if (!selectedDiscount) return;
        deleteDiscountMutation.mutate(selectedDiscount._id);
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Xác nhận xóa khuyến mãi</DialogTitle>
                <DialogDescription>
                    Bạn có chắc chắn muốn xóa khuyến mãi "{selectedDiscount?.name}"? Hành động này không thể hoàn tác.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button
                    variant="outline"
                    onClick={() => setDeleteDialogOpen(false)}
                    disabled={deleteDiscountMutation.isPending}
                >
                    Hủy
                </Button>

                <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleteDiscountMutation.isPending}
                >
                    {deleteDiscountMutation.isPending ? "Đang xóa..." : "Xóa khuyến mãi"}
                </Button>
            </DialogFooter>
        </DialogContent>
    );
};


export default DeleteDiscount
