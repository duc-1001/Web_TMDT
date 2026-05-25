import React, { useEffect } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { CardContent } from "@/components/ui/card";
import { FormField } from "@/components/layout/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/layout/image-upload";
import { Controller, useForm } from "react-hook-form";
import { LocaleSettings, LocaleSettingsSchema, } from "@/schemas/system.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { LoaderCircle, Save, UploadIcon, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { toast } from "sonner";

interface LocalTabProps {
  data?: LocaleSettings;
  onUpdate: (section: string, data: LocaleSettings) => void;
}

const LocalTab = ({ data, onUpdate }: LocalTabProps) => {

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LocaleSettings>({
    resolver: zodResolver(LocaleSettingsSchema),
    defaultValues: {
      dateFormat: data?.dateFormat || "DD/MM/YYYY",
      timeFormat: data?.timeFormat || "HH:mm:ss",
      country: data?.country || "",
      timeZone: data?.timeZone || "Asia/Ho_Chi_Minh",
    },
  });

  useEffect(() => {
    reset({
      dateFormat: data?.dateFormat || "DD/MM/YYYY",
      timeFormat: data?.timeFormat || "HH:mm:ss",
      country: data?.country || "",
      timeZone: data?.timeZone || "",
    });
  }, [data, reset]);

  const onSubmit = async (formData: LocaleSettings) => {
    try {
      await onUpdate("locale", formData);
      toast.success("Cập nhật cài đặt địa phương thành công");
    } catch (error) {
      console.error("Failed to update locale settings", error);
      toast.error("Cập nhật cài đặt địa phương thất bại! Vui lòng thử lại.");
    }
  };

  return (
    <TabsContent value="locale">
      <CardContent className="grid md:grid-cols-2 gap-6">
        <FormField isRequired={true} label="Múi giờ" error={errors.timeZone?.message}>
          <Controller
            control={control}
            name="timeZone"
            render={({ field }) => (
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4}>
                  <SelectItem value="Asia/Ho_Chi_Minh">
                    Asia/Ho_Chi_Minh
                  </SelectItem>
                  <SelectItem value="America/New_York">
                    America/New_York
                  </SelectItem>
                  <SelectItem value="Europe/London">
                    Europe/London
                  </SelectItem>
                  <SelectItem value="Europe/Berlin">
                    Europe/Berlin
                  </SelectItem>
                  <SelectItem value="Asia/Tokyo">
                    Asia/Tokyo
                  </SelectItem>
                  {/* Add more time zones as needed */}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>

        <FormField isRequired label="Quốc gia" error={errors.country?.message}>
          <Input {...register("country")} />
        </FormField>

        <FormField label="Định dạng ngày">
          <Controller
            control={control}
            name="dateFormat"
            render={({ field }) => (
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4}>
                  <SelectItem value="DD/MM/YYYY">
                    DD/MM/YYYY
                  </SelectItem>
                  <SelectItem value="YYYY-MM-DD">
                    YYYY-MM-DD
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </FormField>

        <FormField label="Định dạng giờ">
          <Controller
            control={control}
            name="timeFormat"
            render={({ field }) => (
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4}>
                  <SelectItem value="HH:mm:ss">
                    HH:mm:ss
                  </SelectItem>
                  <SelectItem value="hh:mm A">
                    hh:mm A
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          />
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

export default LocalTab;
