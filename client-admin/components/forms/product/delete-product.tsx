import React from 'react'
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ProductAdmin } from '@/types/product'
import { deleteProduct } from '@/services/product.service';
import { queryClient } from '@/components/QueryClientProviders';
import { useMutation } from '@tanstack/react-query';
interface DeleteProductProps {
    selectedProduct: ProductAdmin;
    setDeleteDialogOpen: (open: boolean) => void;
}
const DeleteProduct = ({ selectedProduct, setDeleteDialogOpen }: DeleteProductProps) => {
    const deleteProductMutation = useMutation({
        mutationFn: deleteProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            setDeleteDialogOpen(false);
        },
        onError: (error) => {
            console.error("Error deleting product:", error);
        }
    });

    const handleDelete = () => {
        if (!selectedProduct) return;
        deleteProductMutation.mutate(selectedProduct._id);
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Xác nhận xóa sản phẩm</DialogTitle>
                <DialogDescription>
                    Bạn có chắc chắn muốn xóa sản phẩm "{selectedProduct?.name}"? Hành động này không thể hoàn tác.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button
                    variant="outline"
                    onClick={() => setDeleteDialogOpen(false)}
                    disabled={deleteProductMutation.isPending}
                >
                    Hủy
                </Button>

                <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleteProductMutation.isPending}
                >
                    {deleteProductMutation.isPending ? "Đang xóa..." : "Xóa sản phẩm"}
                </Button>
            </DialogFooter>
        </DialogContent>
    );
};


export default DeleteProduct
