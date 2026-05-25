
export interface UserAddress {
  _id: string;
  receiver: string;
  phone: string;
  province: {"code": string; "name": string};
  ward: {"code": string; "name": string};
  street: string;
  isDefault: boolean;
  name: string;
}