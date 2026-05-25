import { queryClient } from '@/components/QueryClientProviders';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { productBatchedSchema, ProductBatchedSchema } from '@/schemas/product_batched.schema';
import { createProductBatch } from '@/services/product.service';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import React from 'react'
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
interface CreateNewBatchProps {
    productId: string;
    currentPage: number;
    itemsPerPage: number;
    setOpenNewBatchDialog: React.Dispatch<React.SetStateAction<boolean>>;
}
const CreateNewBatch = ({ productId, currentPage, itemsPerPage, setOpenNewBatchDialog }: CreateNewBatchProps) => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
        watch,
        setValue,
        getValues,
    } = useForm<ProductBatchedSchema>({
        resolver: zodResolver(productBatchedSchema),
        defaultValues: {
            expirationDate: undefined,
            importPrice: 0,
            quantity: 0,
        }
    });

    const createMutation = useMutation({
        mutationFn: (payload: any) => createProductBatch(productId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["product-batches", productId, currentPage, itemsPerPage] })
            toast.success("Nhập kho thành công")
            reset()
            setOpenNewBatchDialog(false)
        }
    })

    const handleCreateBatch = async (data: ProductBatchedSchema) => {
        await createMutation.mutateAsync({
            quantity: data.quantity,
            importPrice: data.importPrice,
            expirationDate: data.expirationDate ? data.expirationDate.toISOString().split("T")[0] : undefined,
        })
    }
    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Thông tin nhập kho mới</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(handleCreateBatch)} className="space-y-4">
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Số lượng nhập</Label>
                            <Input type="number" {...register("quantity", { valueAsNumber: true })} />
                            {errors.quantity && <p className="text-xs font-medium text-red-600">{errors.quantity.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Giá nhập (đơn vị)</Label>
                            <Input type="number" {...register("importPrice", { valueAsNumber: true })} />
                            {errors.importPrice && <p className="text-xs font-medium text-red-600">{errors.importPrice.message}</p>}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Hạn sử dụng</Label>
                        <Input
                            type="date"
                            value={
                                watch("expirationDate")
                                    ? watch("expirationDate")?.toISOString().split("T")[0]
                                    : ""
                            }
                            onChange={(e) => {
                                const value = e.target.value
                                if (value) {
                                    setValue("expirationDate", new Date(value))
                                }
                            }}
                        />
                        {errors.expirationDate && <p className="text-xs font-medium text-red-600">{errors.expirationDate.message}</p>}
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>Xác nhận nhập kho</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    )
}

export default CreateNewBatch
