import {z} from "zod"

export const categorySchema = z.object({
    name: z.string().min(2, "Tên danh mục phải có ít nhất 2 ký tự").max(100, "Tên danh mục không được vượt quá 100 ký tự"),
    description: z.string().max(500, "Mô tả không được vượt quá 500 ký tự").optional(),
    parent: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    order: z.number().min(1, "Thứ tự phải là số lớn hơn hoặc bằng 1").optional(),
    image: z.any().optional(),
})

export type CategoryForm = z.infer<typeof categorySchema>

// "id": str(category["_id"]),
//         "name": category["name"],
//         "slug": category["slug"],
//         "description": category.get("description"),
//         "image": category.get("image"),
//         "icon": category.get("icon"),
//         "parent": str(category["parent"]) if category.get("parent") else None,
//         "productCount": category.get("productCount", 0),
//         "isActive": category.get("isActive", True),
//         "isFeatured": category.get("isFeatured", False),
//         "order": category.get("order", 0),
//         "createdAt": category["createdAt"],
//         "updatedAt": category.get("updatedAt")