import { ApiClient } from "@/lib/apiClient";
import { ContactSettings } from "@/schemas/system.schema";
import { GuestCartItem } from "@/types/cart";
import { ApiResponse } from "@/types/commons";
import { SystemSettingsPayload } from "@/types/setting";


export const caculateShippingFee = async ( provinceCode: number, wardCode: number, items: GuestCartItem[] ) => {
    const data = {
        provinceCode,
        wardCode,
        items: items
    };
    const response = await ApiClient.post<ApiResponse<{ shipping_fee: number }>>('/shipping/estimate', data);
    return response.data;
}