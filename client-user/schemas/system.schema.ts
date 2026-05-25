import {z} from "zod";

export const SystemSettingsSchema = z.object({
    websiteName: z.string().min(1, "Tên website là bắt buộc"),
    shortName: z.string().min(1, "Tên viết tắt là bắt buộc"),
    websiteDescription: z.string().optional()
});

export const ContactSettingsSchema = z.object({
    contactEmail: z.string().email("Địa chỉ email không hợp lệ").optional(),
    contactPhone: z.string().optional(),
    contactAddress: z.string().optional(),
    contactMapEmbed: z.string().optional(),
    province: z.object({
        code: z.string().min(1, "Tỉnh/Thành phố là bắt buộc"),
        name: z.string().optional(),
    }),
    ward: z.object({
        code: z.string().min(1, "Phường/Xã là bắt buộc"),
        name: z.string().optional(),
    }),
});

export const LegalSettingsSchema = z.object({
    companyName: z.string().min(1, "Tên doanh nghiệp là bắt buộc"),
    businessRegistrationNumber: z.string().min(1, "Số đăng ký kinh doanh là bắt buộc"),
    legalRepresentative: z.string().min(1, "Đại diện pháp lý là bắt buộc"),
    legalAddress: z.string().min(1, "Địa chỉ pháp lý là bắt buộc"),
});

export const LocaleSettingsSchema = z.object({
    dateFormat: z.enum(["DD/MM/YYYY", "YYYY-MM-DD"]),
    timeFormat: z.enum(["HH:mm:ss", "hh:mm A"]),
    country: z.string().min(1, "Quốc gia là bắt buộc"),
    timeZone: z.string().min(1, "Múi giờ là bắt buộc"),
});

export const DisplaySettingsSchema = z.object({
    itemsPerPage: z.number().min(1, "Số mục trên mỗi trang phải lớn hơn 0"),
    headerTitle: z.string().optional(),
});

export const StatusSettingsSchema = z.object({
    isSiteOnline: z.boolean(),
    maintenanceMessage: z.string().optional(),
});

export type SystemSettings = z.infer<typeof SystemSettingsSchema>;
export type ContactSettings = z.infer<typeof ContactSettingsSchema>;
export type LegalSettings = z.infer<typeof LegalSettingsSchema>;
export type LocaleSettings = z.infer<typeof LocaleSettingsSchema>;
export type DisplaySettings = z.infer<typeof DisplaySettingsSchema>;
export type StatusSettings = z.infer<typeof StatusSettingsSchema>;
