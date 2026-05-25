export interface Brand {
    _id: string;          // MongoDB id
    name: string;
    slug: string;
    description?: string;
    logo?: string;       // URL Cloudinary
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
    productCount: number;
    isSystem: boolean;
}

export interface ProductBrand {
    _id: string;
    name: string;
    slug: string;
}