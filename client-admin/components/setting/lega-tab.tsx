import React, { use, useEffect } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { CardContent } from "@/components/ui/card";
import { FormField } from "@/components/layout/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { LegalSettings, LegalSettingsSchema, } from "@/schemas/system.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { LoaderCircle, Save, X } from "lucide-react";
import { toast } from "sonner";

interface LegalTabProps {
    data: LegalSettings;
    onUpdate: (section: string, data: LegalSettings) => void;
}

const LegalTab = ({ data, onUpdate }: LegalTabProps) => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<LegalSettings>({
        resolver: zodResolver(LegalSettingsSchema),
        defaultValues: {
            companyName: "",
            businessRegistrationNumber: "",
            legalRepresentative: "",
            legalAddress: "",
        },
    });

    useEffect(() => {
        if (data) {
            {
                reset({
                    companyName: data.companyName || "",
                    businessRegistrationNumber: data.businessRegistrationNumber || "",
                    legalRepresentative: data.legalRepresentative || "",
                    legalAddress: data.legalAddress || "",
                });
            }
        }
    }, [data, reset]);

    const onSubmit = async (formData: LegalSettings) => {
        try {
            await onUpdate("legal", formData);
            toast.success("Cập nhật cài đặt pháp lý thành công");
        } catch (error) {
            toast.error("Cập nhật cài đặt pháp lý thất bại! Vui lòng thử lại.");
        }
    }

    return (
        <TabsContent value="legal">
            <CardContent className="grid md:grid-cols-2 gap-6">
                <FormField isRequired={true} label="Tên doanh nghiệp" error={errors.companyName?.message}>
                    <Input {...register("companyName")} />
                </FormField>
                <FormField isRequired={true} label="Số đăng ký kinh doanh" error={errors.businessRegistrationNumber?.message}>
                    <Input {...register("businessRegistrationNumber")} />
                </FormField>
                <FormField isRequired={true} label="Đại diện pháp lý" error={errors.legalRepresentative?.message}>
                    <Input {...register("legalRepresentative")} />
                </FormField>
                <FormField isRequired={true} label="Địa chỉ pháp lý" error={errors.legalAddress?.message}>
                    <Textarea {...register("legalAddress")} rows={2} />
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

export default LegalTab;
