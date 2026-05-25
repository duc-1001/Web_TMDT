import React, { useEffect } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { CardContent } from "@/components/ui/card";
import { FormField } from "@/components/layout/form-field";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { DisplaySettings, DisplaySettingsSchema } from "@/schemas/system.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { LoaderCircle, Save, UploadIcon, X } from "lucide-react";
import { toast } from "sonner";

interface DisplayTabProps {
  data?: DisplaySettings;
  onUpdate: (section: string, data: DisplaySettings) => void;
}

const DisplayTab = ({ data, onUpdate }: DisplayTabProps) => {

  const {
    reset,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DisplaySettings>({
    resolver: zodResolver(DisplaySettingsSchema),
    defaultValues: {
      itemsPerPage: 10,
      headerTitle: "",
    },
  });

  useEffect(() => {
    reset({
      itemsPerPage: data?.itemsPerPage || 10,
      headerTitle: data?.headerTitle || "",
    });
  }, [data, reset]);

  const onSubmit = async (formData: DisplaySettings) => {
    try {
      await onUpdate("display", formData);
      toast.success("Cập nhật cài đặt hiển thị thành công");
    } catch (error) {
      console.error("Failed to update display settings", error);
      toast.error("Cập nhật cài đặt hiển thị thất bại! Vui lòng thử lại.");
    }
  }

  return (
    <TabsContent value="display">
      <CardContent className="space-y-6">
        <FormField label="Tiêu đề trình duyệt" error={errors.headerTitle?.message}>
          <Input {...register("headerTitle")} />
        </FormField>
        <FormField label="Số mục mỗi trang" error={errors.itemsPerPage?.message}>
          <Input type="number" {...register("itemsPerPage", { valueAsNumber: true })} />
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

export default DisplayTab;
