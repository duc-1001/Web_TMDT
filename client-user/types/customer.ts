import { UserAddress } from "./user_address"

export type CustomerStatus = "active" | "new" | "blocked" | "inactive"

export interface Customer {
  _id: string
  fullName: string
  email: string
  phone: string
  orders: number
  spent: number
  joinDate: string | null
  lastLogin: string | null
  status: CustomerStatus
  avatar?: string
}

export interface CustomerSummary {
   "totalCustomers": number
   "activeCustomers": number
   "newCustomers": number
   "inactiveCustomers": number
}

export interface CustomerQuickView {
  _id: string
  fullName: string
  avatar?: string
  email: string
  phone: string
  orders: number
  spent: number
  status: CustomerStatus
  joinDate: string | null
  lastLogin: string | null
  addresses: UserAddress[]
}

// Địa chỉ khách hàng
export interface CustomerAddress {
  _id: string
  isDefault: boolean
  name: string
  phone: string
  province: string
  receiver: string
  street: string
  ward: string
}

// Dữ liệu chi tiết khách hàng
export interface CustomerDetail {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  avatar?: string | null;
  status: CustomerStatus;
  joinDate: string;       
  lastLogin?: string | null;  
  addresses: CustomerAddress[];
  totalOrders: number;
  totalSpent: number;
  avgOrderValue: number;
  lastOrderDate?: string | null; 
}

// Mỗi đơn hàng của khách
export interface CustomerOrder {
  orderCode: string;
  date: string; // ISO string
  total: number;
  status: "pending" | "confirmed" | "shipping" | "delivered" | "cancelled";
  items: number;
  paymentMethod: string;
}

export interface UpdateCustomerRequest {
  fullName?: string;
  email?: string;
  phone?: string;
  addresses?: {
    _id?: string;        // Nếu update address có sẵn
    name?: string;
    receiver?: string;
    phone?: string;
    street?: string;
    ward?: string;
    wardCode?: string;
    province?: string;
    provinceCode?: string;
    isDefault?: boolean;
  }[];
}