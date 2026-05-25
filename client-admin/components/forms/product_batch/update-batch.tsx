import { queryClient } from '@/components/QueryClientProviders'
import { Button } from '@/components/ui/button'
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateBatchQuantity } from '@/services/product.service'
import { ProductBatch } from '@/types/product'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from "zod";
interface UpdateBatchProps {
    batchEditData: ProductBatch,
    productId: string,
    currentPage: number,
    itemsPerPage: number,
    setEditingBatch: React.Dispatch<React.SetStateAction<ProductBatch | null>>;
}

const updateBatchSchema = z.object({
    quantity: z.number().min(0, "Số lượng phải lớn hơn hoặc bằng 0"),
});

type UpdateBatchSchema = z.infer<typeof updateBatchSchema>;

const UpdateBatch = (props: UpdateBatchProps) => {
    const { batchEditData: batch, productId, currentPage, itemsPerPage, setEditingBatch } = props;
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<UpdateBatchSchema>({
        resolver: zodResolver(updateBatchSchema),
        defaultValues: {
            quantity: batch.remainingQuantity,
        }
    })
    const adjustMutation = useMutation({
        mutationFn: (payload: any) => updateBatchQuantity(productId, batch._id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["product-batches", productId, currentPage, itemsPerPage] })
            toast.success("Cập nhật số lượng thành công")
            setEditingBatch(null)
        }
    })

    const handleAdjustBatch = async (data: any) => {
        await adjustMutation.mutateAsync({
            quantity: Number(data.quantity),
        })
    }

    console.log("Batch edit data:", batch)

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Điều chỉnh số lượng tồn kho</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
                <div className="p-3 bg-muted rounded-md text-sm">
                    Lô ngày: <b>{new Date(batch.importedAt).toLocaleDateString()}</b> - Hiện có: <b>{batch.remainingQuantity}</b>
                </div>
                <div className="space-y-2">
                    <Label>Số lượng mới thực tế</Label>
                    <Input
                        type="number"
                        placeholder="Nhập số lượng thực tế..."
                        {...register("quantity",{ valueAsNumber: true })}
                    />
                    {errors.quantity && <p className="text-xs font-medium text-red-600">{errors.quantity.message}</p>}
                </div>
            </div>
            <DialogFooter>
                <Button
                    variant="destructive"
                    onClick={handleSubmit(handleAdjustBatch)}
                    disabled={isSubmitting}
                >
                    {adjustMutation.isPending ? "Đang lưu..." : "Cập nhật tồn thực tế"}
                </Button>
            </DialogFooter>
        </DialogContent>
    )
}

export default UpdateBatch
