import { Button } from '@/components/ui/button'
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useMutation } from '@tanstack/react-query'
import React, { useState } from 'react'
import { toast } from 'sonner'
import deleteCategory from '../category/delete-category'
import { deleteBrand } from '@/services/brand.service'
import { queryClient } from '@/components/QueryClientProviders'
interface DeleteBrandProps {
    setDeleteDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
    deleteTarget: { _id: string; name: string } | null
}
const DeleteBrand = ({ setDeleteDialogOpen, deleteTarget }: DeleteBrandProps) => {
    const [submitting, setSubmitting] = useState(false);
    const deleteBrandMutation = useMutation({
        mutationFn: deleteBrand,
        onSuccess: () => {
            setDeleteDialogOpen(false)
            queryClient.invalidateQueries({ queryKey: ['admin-brands'] })
            queryClient.invalidateQueries({ queryKey: ['brand-for-product'] });
            queryClient.invalidateQueries({ queryKey: ['brands-for-select'] });

            toast.success('Xóa thương hiệu thành công')
        },
        onError: (error) => {
            toast.error(error.message || 'Xóa thương hiệu thất bại, vui lòng thử lại sau')
        }
    })

    const handleDeleteBrand = async () => {
        setSubmitting(true);
        try {
            if (deleteTarget) {
                await deleteBrandMutation.mutateAsync(deleteTarget._id);
            }
        } catch (error) {
            console.error("Lỗi khi xóa thương hiệu:", error);
        } finally {
            setSubmitting(false);
        }
    }
    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Xác nhận xóa thương hiệu</DialogTitle>
                <DialogDescription>
                    Bạn có chắc chắn muốn xóa thương hiệu "{deleteTarget?.name}"? Hành động này không thể hoàn tác.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button
                    variant="outline"
                    onClick={() => setDeleteDialogOpen(false)}
                    className="bg-transparent"
                    disabled={submitting}
                >
                    Hủy
                </Button>
                <Button variant="destructive" onClick={handleDeleteBrand} disabled={submitting}>
                    Xóa thương hiệu
                </Button>
            </DialogFooter>
        </DialogContent>
    )
}

export default DeleteBrand