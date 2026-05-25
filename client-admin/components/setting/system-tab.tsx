import React, { useEffect } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { CardContent } from "@/components/ui/card";
import { FormField } from "@/components/layout/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/layout/image-upload";
import { useForm } from "react-hook-form";
import { SystemSettings, SystemSettingsSchema } from "@/schemas/system.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { LoaderCircle, Save, UploadIcon, X } from "lucide-react";
import { uploadFile } from "@/services/upload.service";
import { SystemSettingsPayload } from "@/types/setting";
import { toast } from "sonner";

interface SystemTabProps {
    data?: SystemSettingsPayload;
    onUpdate: (section: string, data: SystemSettingsPayload) => void;
}

const SystemTab = ({ data, onUpdate }: SystemTabProps) => {
    const {
        reset,
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<SystemSettings>({
        resolver: zodResolver(SystemSettingsSchema),
        defaultValues: {
            websiteName: "",
            shortName: "",
            websiteDescription: "",
        },
    });

    useEffect(() => {
        if (data) {
            reset({
                websiteName: data.websiteName || "",
                shortName: data.shortName || "",
                websiteDescription: data.websiteDescription || "",
            });
        }
    }, [data, reset]);

    const [logo, setLogo] = React.useState<File | null>(null);
    const [favicon, setFavicon] = React.useState<File | null>(null);
    const [socialImage, setSocialImage] = React.useState<File | null>(null);

    const onSubmit = async (data: SystemSettings) => {
        try {
            // upload song song – chỉ upload khi có file
            const [logoData, faviconData, socialImageData] = await Promise.all([
                logo ? uploadFile(logo, "system") : null,
                favicon ? uploadFile(favicon, "system") : null,
                socialImage ? uploadFile(socialImage, "system") : null,
            ]);

            // chỉ gửi field nào thực sự thay đổi
            const payload: SystemSettingsPayload = {
                ...data,
                ...(logoData && { logo: logoData }),
                ...(faviconData && { favicon: faviconData }),
                ...(socialImageData && { socialImage: socialImageData }),
            };

            if (onUpdate) {
                onUpdate("system", payload);
            }
            toast.success("Cài đặt hệ thống đã được lưu thành công.");
        } catch (error) {
            toast.error("Đã có lỗi xảy ra khi lưu cài đặt hệ thống! Vui lòng thử lại.");
        }
    };

    return (
        <TabsContent value="system">
            <CardContent className="space-y-6">
                <FormField label="Tên website" error={errors.websiteName?.message}>
                    <Input {...register("websiteName")} />
                </FormField>

                <FormField label="Tên viết tắt" error={errors.shortName?.message}>
                    <Input {...register("shortName")} />
                </FormField>

                <FormField
                    label="Mô tả website"
                    error={errors.websiteDescription?.message}
                >
                    <Textarea rows={3} {...register("websiteDescription")} />
                </FormField>

                <div className="grid md:grid-cols-3 gap-6">
                    <ImageUpload
                        label="Logo"
                        preview={logo ? URL.createObjectURL(logo) : data?.logo?.url}
                        onUpload={setLogo}
                    />

                    <ImageUpload
                        label="Favicon"
                        size="sm"
                        preview={favicon ? URL.createObjectURL(favicon) : data?.favicon?.url}
                        onUpload={setFavicon}
                    />

                    <ImageUpload
                        label="Ảnh chia sẻ"
                        size="lg"
                        preview={socialImage ? URL.createObjectURL(socialImage) : data?.socialImage?.url}
                        onUpload={setSocialImage}
                    />
                </div>
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

export default SystemTab;
