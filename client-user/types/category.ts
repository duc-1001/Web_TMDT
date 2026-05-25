export interface Category {
  _id: string;          // MongoDB id
  name: string;
  slug: string;
  description?: string;
  image?: string;       // URL Cloudinary
  order: number;
  parent: string | null; 
  isActive: boolean;
  isFeatured: boolean;
  createdAt?: string;
  updatedAt?: string;
  productCount?: number;
}

export interface ProductCategory {
  _id: string
  name: string
  slug: string
  children: ProductCategory[]
}

export interface CategoryTree {
   _id: string;          
  name: string;
  slug: string;
  image?: string;     
  productCount?: number;  
  children: CategoryTree[];
}

export interface CategoryForSelect{
  _id: string;
  name: string;
}



