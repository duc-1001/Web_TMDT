"use client"

import React from "react"
import {
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { deleteUserAddress } from "@/services/auth.service"
import { toast } from "sonner"
import { useDispatch } from "react-redux"
import { AppDispatch } from "@/store/store"
import { updateUserSuccess } from "@/store/slices/authSlice"
import { Button } from "@/components/ui/button"

interface DeleteUserAddressProps {
    setIsDeleteDialogOpen: React.Dispatch<React.SetStateAction<boolean>>,
    deleteAddressId: string
}

export default function DeleteUserAddress({ setIsDeleteDialogOpen, deleteAddressId }: DeleteUserAddressProps) {
    const dispatch = useDispatch<AppDispatch>()
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    const handleDeleteAddress = async () => {
        setIsSubmitting(true)
        try {
            const response = await deleteUserAddress(deleteAddressId)
            console.log(response.data);
            setIsDeleteDialogOpen(false)
            dispatch(updateUserSuccess({ user: response.data! }))
            toast.success("Xóa địa chỉ thành công")
        } catch (error) {
            toast.error("Xóa địa chỉ thất bại, vui lòng thử lại sau")
        } finally {
            setIsSubmitting(false)
        }
    }


    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Xác nhận xóa địa chỉ</DialogTitle>
                <DialogDescription>
                    Bạn có chắc chắn muốn xóa địa chỉ này? Hành động này không thể hoàn tác.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button className='text-white' onClick={() => setIsDeleteDialogOpen(false)} disabled={isSubmitting}>Hủy</Button>
                <Button onClick={handleDeleteAddress} className="bg-red-500 hover:bg-red-600 text-white hover:text-white" disabled={isSubmitting}>
                    Xóa địa chỉ
                </Button>
            </DialogFooter>
        </DialogContent>
    )
}
