import { queryClient } from '@/components/QueryClientProviders'
import { Button } from '@/components/ui/button'
import {
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { deleteCategory } from '@/services/category.service'
import { Category } from '@/types/category'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

interface DeleteCategoryProps {
    selectedCategory: Category
    setIsDeleteDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
}
const DeleteCategory = ({ selectedCategory, setIsDeleteDialogOpen }: DeleteCategoryProps) => {
    const [submitting, setSubmitting] = useState(false);
    const deleteCategoryMutation = useMutation({
        mutationFn: deleteCategory,
        onSuccess: () => {
            setIsDeleteDialogOpen(false)
            queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
            toast.success('Xóa danh mục thành công')
        },
        onError: () => {
            toast.error('Xóa danh mục thất bại, vui lòng thử lại sau')
        }
    })

    const handleDeleteCategory = async () => {
        setSubmitting(true);
        try {
            if (selectedCategory) {
                await deleteCategoryMutation.mutateAsync(selectedCategory._id);
            }
        } catch (error) {
            console.error("Lỗi khi xóa danh mục:", error);
        } finally {
            setSubmitting(false);
        }
    }
    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Xác nhận xóa danh mục</DialogTitle>
                <DialogDescription>
                    Bạn có chắc chắn muốn xóa danh mục <strong>{selectedCategory?.name}</strong>? Hành động này không thể
                    hoàn tác.
                    {selectedCategory && selectedCategory.productCount && selectedCategory.productCount > 0 && (
                        <span className="block mt-2 text-destructive">
                            Cảnh báo: Danh mục này đang chứa {selectedCategory.productCount} sản phẩm. Các sản phẩm sẽ không còn
                            thuộc danh mục nào.
                        </span>
                    )}
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button
                    className="bg-transparent border text-black hover:bg-gray-100"
                    onClick={() => setIsDeleteDialogOpen(false)}
                    disabled={submitting}
                >
                    Hủy
                </Button>
                <Button
                    onClick={handleDeleteCategory}
                    className="bg-destructive text-white cursor-pointer hover:bg-destructive/90"
                    disabled={submitting}
                >
                    Xóa danh mục
                </Button>
            </DialogFooter>
        </DialogContent>
    )
}

export default DeleteCategory
