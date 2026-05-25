import { ApiClient } from "@/lib/apiClient";
import { buildFormData } from "@/lib/formData";
import { CaculateCartPricing, Cart, GuestCartItem } from "@/types/cart";
import { ApiResponse } from "@/types/commons";


export const getCart = async () => {
    const response = await ApiClient.get<ApiResponse<Cart>>('/cart');
    return response.data;
}

export const getGuestCart = async (items: GuestCartItem[]) => {
    const response = await ApiClient.post<ApiResponse<Cart>>(
        '/cart/guest',
        {
            items
        }
    )

    return response.data
}

export const addToCart = async (productId: string, quantity: number) => {
    const response = await ApiClient.post<ApiResponse>(`/cart/add`, buildFormData({ productId, quantity }));
    return response.data;
}

export const removeFromCart = async (productId: string) => {
    const response = await ApiClient.delete<ApiResponse>(`/cart/item/${productId}`);
    return response.data;
}

export const clearCart = async () => {
    const response = await ApiClient.delete<ApiResponse>('/cart/clear');
    return response.data;
}

export const updateCartItemQuantity = async (productId: string, quantity: number) => {
    const response = await ApiClient.put<ApiResponse<{ cart: Cart, pricing: CaculateCartPricing }>>(`/cart/item/${productId}`, buildFormData({ quantity }));
    return response.data;
}

export const mergeGuestCart = async (items: GuestCartItem[]) => {
    const response = await ApiClient.post<ApiResponse<Cart>>(
        '/cart/merge',
        {
            items
        }
    )
    return response.data;
}

export const calculateCartPricing = async (items: GuestCartItem[], discounts: string[], shippingAddress: { provinceCode: number, wardCode: number }) => {
    const response = await ApiClient.post<ApiResponse<CaculateCartPricing>>(
        '/cart/calculate-pricing',
        {
            items,
            discounts,
            shippingAddress
        }
    )
    return response.data;
}


export const applyDiscountToCart = async (discountCode: string, cartItems: GuestCartItem[]) => {
    const response = await ApiClient.post<ApiResponse<CaculateCartPricing>>(
        '/cart/discounts/apply',
        {
            discountCode,
            items: cartItems
        }
    )
    return response.data;
}

export const removeDiscountFromCart = async (discountCode: string, cartItems: GuestCartItem[]) => {
    const response = await ApiClient.post<ApiResponse<CaculateCartPricing>>(
        '/cart/discounts/remove',
        {
            discountCode,
            items: cartItems
        }
    )
    return response.data;
}

export const removeMultipleItemsFromCart = async (productIds: string[], clearDiscounts = false) => {
    const response = await ApiClient.delete<ApiResponse<Cart>>(
        '/cart/items',
        {
            productIds,
            clearDiscounts
        }
    )
    return response.data;
}



// export const applyDiscountToCart = async (DiscountId: string) => {
//     const response = await ApiClient.post<ApiResponse<CaculateCartPricing>>(
//         '/cart/Discounts/apply',
//         { DiscountId }
//     )
//     return response.data;
// }

// export const removeDiscountFromCart = async (DiscountId: string) => {
//     const response = await ApiClient.post<ApiResponse<CaculateCartPricing>>(
//         '/cart/Discounts/remove',
//         { DiscountId }
//     )
//     return response.data;
// }

// export const applyAutoDiscountsToCart = async () => {
//     const response = await ApiClient.post<ApiResponse<CaculateCartPricing>>(
//         '/cart/Discounts/auto'
//     )
//     return response.data;
// }