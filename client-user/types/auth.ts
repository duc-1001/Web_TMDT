// types/user.ts

import { UserAddress } from "./user_address";


export interface User {
  _id: string;
  email: string;
  fullName: string;
  role: "user" | "admin";
  isEmailVerified?: boolean;
  avatar?: string;
  phoneNumber?: string;
  addresses: UserAddress[];
}
