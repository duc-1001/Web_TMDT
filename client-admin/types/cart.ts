import { AppliedDiscount } from "./discount";

export interface CartItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
    availableStock: number;
    isOutOfStock: boolean;
}

export interface Cart {
    items: CartItem[];
}

export type GuestCartItem = {
  productId: string
  quantity: number
}

export type CaculateCartPricing = {
    subtotal: number;
    totalPrice: number;
    shippingFee: number;
    discount: number;
    shippingDiscount: number;
    appliedDiscounts: AppliedDiscount[];
}

export type ApplyCoupon = {
    _id: string;
    code: string;
    name: string;
    description: string;
    type: string;   
    value: number;
    maxDiscountValue: number;
    minOrderValue: number;
    discountValue: number;
}