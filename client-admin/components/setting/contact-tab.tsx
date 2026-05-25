import React, { useEffect } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { CardContent } from "@/components/ui/card";
import { FormField } from "@/components/layout/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Controller, useForm } from "react-hook-form";
import { ContactSettings, ContactSettingsSchema } from "@/schemas/system.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { LoaderCircle, Save } from "lucide-react";
import { toast } from "sonner";
import { getProvinces, getWardsByProvince, Province, Ward } from "@/lib/address";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { ScrollArea } from "@radix-ui/react-scroll-area";

interface ContactTabProps {
    data?: ContactSettings;
    onUpdate: (section: string, data: ContactSettings) => void;
}

const ContactTab = ({ data, onUpdate }: ContactTabProps) => {
    const [provinces, setProvinces] = React.useState<Province[]>([])
    const [wards, setWards] = React.useState<Ward[]>([])

    useEffect(() => {
        getProvinces().then(setProvinces)
    }, []);

    const {
        reset,
        control,
        register,
        handleSubmit,
        resetField,
        formState: { errors, isSubmitting },
    } = useForm<ContactSettings>({
        resolver: zodResolver(ContactSettingsSchema),
        defaultValues: {
            contactEmail: "",
            contactPhone: "",
            workingHours: "",
            contactAddress: "",
            contactMapEmbed: "",
            province: {
                code: "",
                name: "",
            },
            ward: {
                code: "",
                name: "",
            },
        },
    });

    useEffect(() => {
        if (data) {
            reset({
                contactEmail: data.contactEmail || "",
                contactPhone: data.contactPhone || "",
                workingHours: data.workingHours || "",
                contactAddress: data.contactAddress || "",
                contactMapEmbed: data.contactMapEmbed || "",
                province: data.province || { code: "", name: "" },
                ward: data.ward || { code: "", name: "" },
            });
            if (data.province?.code) {
                getWardsByProvince(Number(data.province.code)).then(setWards);
            }
        }
    }, [data, register, reset]);

    const onSubmit = async (data: ContactSettings) => {
        try {
            await onUpdate("contact", data);
            toast.success("Cài đặt liên hệ đã được lưu thành công.");
        } catch (error) {
            toast.error("Đã có lỗi xảy ra khi lưu cài đặt liên hệ! Vui lòng thử lại.");
            console.error("Lỗi khi lưu cài đặt liên hệ:", error);
        }
    }

    return (
        <TabsContent value="contact">
            <CardContent className="grid md:grid-cols-2 gap-6">
                <FormField isRequired={true} label="Email liên hệ" error={errors.contactEmail?.message}>
                    <Input {...register("contactEmail")} />
                </FormField>
                <FormField label="Số điện thoại" error={errors.contactPhone?.message}>
                    <Input {...register("contactPhone")} />
                </FormField>
                <FormField label="Thời gian làm việc" error={errors.workingHours?.message}>
                    <Input placeholder="VD: 08:00 - 22:00 (T2 - CN)" {...register("workingHours")} />
                </FormField>
                <FormField isRequired={true} label="Tỉnh / Thành phố" error={errors.province?.code?.message}>
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
                                            ))},
                                        </ScrollArea>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                </FormField>
                <FormField isRequired={true} label="Xã / Phường" error={errors.ward?.code?.message}>
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
                </FormField>
                <FormField label="Địa chỉ cửa hàng" error={errors.contactAddress?.message}>
                    <Textarea rows={2} {...register("contactAddress")} />
                </FormField>
                <FormField label="Khu vực hoạt động" error={errors.contactMapEmbed?.message}>
                    <Textarea rows={2} {...register("contactMapEmbed")} />
                </FormField>
            </CardContent>
            <div className="flex justify-end gap-3 border-t p-4 mt-5">
                <Button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleSubmit(onSubmit)}
                    className=" cursor-pointer"
                >
                    {
                        isSubmitting ?
                            <>
                                <LoaderCircle className="h-4 w-4 mr-1 animate-spin" />
                                Đang lưu...
                            </>
                            :
                            <>
                                <Save className="h-4 w-4 mr-1" />
                                Lưu cài đặt
                            </>
                    }
                </Button>
            </div>
        </TabsContent>
    );
};

export default ContactTab;
