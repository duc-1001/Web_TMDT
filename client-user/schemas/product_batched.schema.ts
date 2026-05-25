import { z } from "zod";

export const productBatchedSchema = z.object({
    quantity: z
        .number({ message: "Vui lòng nhập số lượng" })
        .min(1, "Số lượng phải lớn hơn hoặc bằng 1"),

    importPrice: z
        .number({ message: "Vui lòng nhập giá nhập" })
        .min(1, "Giá nhập phải lớn hơn hoặc bằng 1"),

    expirationDate: z
        .date({ message: "Vui lòng nhập hạn sử dụng" }),
}).refine(
    (data) => data.expirationDate > new Date(),
    {
        message: "Hạn sử dụng phải lớn hơn ngày hiện tại",
        path: ["expirationDate"],
    }
);



export type ProductBatchedSchema = z.infer<typeof productBatchedSchema>;
