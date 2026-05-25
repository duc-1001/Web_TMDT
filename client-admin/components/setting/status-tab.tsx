import { TabsContent } from "@/components/ui/tabs";
import { CardContent } from "@/components/ui/card";
import { FormField } from "@/components/layout/form-field";
import { Textarea } from "@/components/ui/textarea";
import { Controller, useForm } from "react-hook-form";
import { StatusSettings, StatusSettingsSchema, } from "@/schemas/system.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { LoaderCircle, Save, X } from "lucide-react";
import { } from "@/services/system.service";
import { Switch } from "../ui/switch";
import { useEffect } from "react";
import { toast } from "sonner";

interface StatusTabProps {
    data?: StatusSettings;
    onUpdate: (section: string, data: StatusSettings) => void;
}

const StatusTab = ({ data, onUpdate }: StatusTabProps) => {
    const {
        control,
        reset,
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<StatusSettings>({
        resolver: zodResolver(StatusSettingsSchema),
        defaultValues: {
            isSiteOnline: true,
            maintenanceMessage: "",
        },
    });

    useEffect(() => {
        if (data) {
            reset({
                isSiteOnline: data.isSiteOnline ?? true,
                maintenanceMessage: data.maintenanceMessage || "",
            });
        }
    }, [data, reset]);

    const onSubmit = async (formData: StatusSettings) => {
        try {
            await onUpdate("status", formData);
            toast.success("Cập nhật cài đặt trạng thái thành công");
        } catch (error) {
            console.error("Failed to update status settings", error);
            toast.error("Cập nhật cài đặt trạng thái thất bại! Vui lòng thử lại.");
        }
    }

    return (
        <TabsContent value="status">
            <CardContent className="space-y-6">
                <div className="flex justify-between items-center border rounded-lg p-4">
                    <div>
                        <p className="font-medium">
                            Trạng thái hệ thống
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Bật/tắt toàn bộ website
                        </p>
                    </div>
                    <Controller
                        control={control}
                        name="isSiteOnline"
                        render={({ field }) => (
                            <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                        )}
                    />
                </div>

                <FormField label="Thông báo bảo trì">
                    <Textarea rows={3} {...register("maintenanceMessage")} />
                </FormField>
            </CardContent>
            <div className="flex justify-end gap-3 border-t p-4 mt-5">
                <Button disabled={isSubmitting} type="button" variant="outline">
                    <X className="h-4 w-4 mr-1" /> Hủy
                </Button>

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

export default StatusTab;
