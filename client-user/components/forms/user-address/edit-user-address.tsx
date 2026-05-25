"use client"

import React, { useEffect } from "react"
import {
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { UserAddressForm, userAddressSchema } from "@/schemas/user_address.shema"
import { getProvinces, getWardsByProvince, Province, Ward } from "@/lib/address"
import { ScrollArea } from "@/components/ui/scroll-area"
import { addUserAddress, editUserAddress } from "@/services/auth.service"
import { toast } from "sonner"
import { useDispatch } from "react-redux"
import { AppDispatch, } from "@/store/store"
import { UserAddress } from "@/types/user_address"
import { updateUserSuccess } from "@/store/slices/authSlice"

interface EditUserAddressProps {
    setIsEditDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
    selectedAddress: UserAddress
}

export default function EditUserAddress({ setIsEditDialogOpen, selectedAddress }: EditUserAddressProps) {
    const dispatch = useDispatch<AppDispatch>()
    const [provinces, setProvinces] = React.useState<Province[]>([])
    const [wards, setWards] = React.useState<Ward[]>([])
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const {
        setValue,
        register,
        control,
        handleSubmit,
        formState: { errors },
        resetField,
        reset,
    } = useForm<UserAddressForm>({
        resolver: zodResolver(userAddressSchema),
        defaultValues: {
            name: "",
            receiver: "",
            phone: "",
            province: { code: "", name: "" },
            ward: { code: "", name: "" },
            street: "",
            isDefault: false,
        },
    })

    React.useEffect(() => {
        getProvinces().then(setProvinces)
    }, [])

    const onSubmit = async (data: UserAddressForm) => {
        setIsSubmitting(true)
        try {
            const response = await editUserAddress(selectedAddress._id, data);
            console.log(response);
            if (response.data) {
                dispatch(updateUserSuccess({ user: response.data! }))
            }
            setIsEditDialogOpen(false)
            toast.success("Chỉnh sửa địa chỉ thành công")
            reset()
        } catch (error) {
            toast.error("Chỉnh sửa địa chỉ thất bại, vui lòng thử lại sau")
        } finally {
            setIsSubmitting(false)
        }
    }

    useEffect(() => {
        if (selectedAddress) {
            setValue("name", selectedAddress.name)
            setValue("receiver", selectedAddress.receiver)
            setValue("phone", selectedAddress.phone)
            setValue("province", selectedAddress.province)
            getWardsByProvince(Number(selectedAddress.province.code)).then(setWards)
            setValue("ward", selectedAddress.ward)
            setValue("street", selectedAddress.street)
            setValue("isDefault", selectedAddress.isDefault)
        }
    }, [selectedAddress, setValue])


    return (
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Chỉnh sửa địa chỉ</DialogTitle>
                <DialogDescription>
                    Nhập thông tin địa chỉ giao hàng
                </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                    <Label className="mb-3">Tên địa chỉ</Label>
                    <Input placeholder="Nhà riêng" {...register("name")} />
                    {errors.name && (<p className="text-xs font-medium text-red-500 mt-1">{errors.name.message}</p>)}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="mb-3">Người nhận</Label>
                        <Input placeholder="Nguyễn Văn A" {...register("receiver")} />
                        {errors.receiver && (<p className="text-xs font-medium text-red-500 mt-1">{errors.receiver.message}</p>)}
                    </div>
                    <div>
                        <Label className="mb-3">Số điện thoại</Label>
                        <Input placeholder="0912345678" {...register("phone")} />
                        {errors.phone && (<p className="text-xs font-medium text-red-500 mt-1">{errors.phone.message}</p>)}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2">

                    {/* Province */}
                    <div>
                        <Label className="mb-3">Tỉnh / Thành phố</Label>
                        <Controller
                            control={control}
                            name="province"
                            render={({ field }) => (
                                <Select
                                    value={field.value?.code ? String(field.value.code) : undefined}
                                    onValueChange={(value) => {
                                        const p = provinces.find(province => province.code === Number(value));
                                        console.log(p);

                                        if (p) {
                                            field.onChange({ code: String(p.code), name: p.name });
                                            getWardsByProvince(Number(p.code)).then(setWards);
                                            resetField("ward");
                                        }
                                    }}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Chọn tỉnh / thành phố" />
                                    </SelectTrigger>
                                    <SelectContent position="popper" sideOffset={4}>
                                        <ScrollArea className="h-48">
                                            {provinces.map((p) => (
                                                <SelectItem key={p.code} value={String(p.code)}>
                                                    {p.name}
                                                </SelectItem>
                                            ))}
                                        </ScrollArea>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.province?.code?.message && (<p className="text-xs font-medium text-red-500 mt-1">{errors.province.code.message}</p>)}
                    </div>


                    {/* Ward */}
                    <div>
                        <Label className="mb-3">Phường / Xã</Label>
                        <Controller
                            control={control}
                            name="ward"
                            render={({ field }) => (
                                <Select
                                    value={field.value?.code ? String(field.value.code) : undefined}
                                    onValueChange={(value) => {
                                        const w = wards.find(ward => ward.code === Number(value));
                                        if (w) {
                                            field.onChange({ code: String(w.code), name: w.name });
                                        }
                                    }}
                                    disabled={!wards.length}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Chọn phường / xã" />
                                    </SelectTrigger>
                                    <SelectContent position="popper" sideOffset={4}>
                                        <ScrollArea className="h-48">
                                            {wards.map((w) => (
                                                <SelectItem key={w.code} value={String(w.code)}>
                                                    {w.name}
                                                </SelectItem>
                                            ))}
                                        </ScrollArea>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.ward?.code?.message && (<p className="text-xs font-medium text-red-500 mt-1">{errors.ward.code.message}</p>)}
                    </div>
                </div>
                <div>
                    <Label className="mb-3">Số nhà, tên đường</Label>
                    <Input placeholder="123 Đường ABC" {...register("street")} />
                    {errors.street && (<p className="text-xs font-medium text-red-500 mt-1">{errors.street.message}</p>)}
                </div>

                <div className="flex items-center gap-2">
                    <Controller
                        name="isDefault"
                        control={control}
                        render={({ field }) => (
                            <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                        )}
                    />
                    <Label className="text-sm">Đặt làm địa chỉ mặc định</Label>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditDialogOpen(false)}
                    >
                        Hủy
                    </Button>
                    <Button className="text-white" type="submit" disabled={isSubmitting}>Chỉnh sửa địa chỉ</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    )
}
