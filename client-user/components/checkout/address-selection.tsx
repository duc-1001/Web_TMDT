import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Phone, MapPin, PlusCircle } from "lucide-react"
import { UserAddress } from '@/types/user_address';
import Link from 'next/link';
interface AddressSelectionProps {
    showAddressDialog: boolean;
    setShowAddressDialog: (open: boolean) => void;
    addresses: UserAddress[];
    handleSelectAddress: (address: UserAddress) => void;
}

const AddressSelection = (props: AddressSelectionProps) => {
    const { showAddressDialog, setShowAddressDialog, addresses, handleSelectAddress } = props
    return (
        <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Chọn địa chỉ giao hàng</DialogTitle>
                    <DialogDescription>Chọn từ danh sách địa chỉ đã lưu hoặc thêm địa chỉ mới</DialogDescription>
                </DialogHeader>

                {
                    addresses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center py-16 px-6 bg-white border border-gray-100 rounded-3xl shadow-sm">

                            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-orange-50 mb-4">
                                <MapPin className="h-8 w-8 text-orange-500" />
                            </div>

                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Chưa có địa chỉ giao hàng
                            </h3>

                            <p className="text-gray-500 mb-6 max-w-sm">
                                Bạn chưa lưu địa chỉ nào. Hãy thêm địa chỉ để việc đặt hàng nhanh chóng và thuận tiện hơn.
                            </p>

                            <Link
                                href="/account?add-address=true"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-all shadow-sm hover:shadow-md"
                            >
                                <PlusCircle className="h-4 w-4" />
                                Thêm địa chỉ mới
                            </Link>

                        </div>
                    ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {addresses.map((address) => (
                                <button
                                    key={address._id}
                                    onClick={() => handleSelectAddress(address)}
                                    className="w-full text-left p-4 border-2 rounded-lg hover:border-orange-500 hover:bg-orange-500/5 transition-all duration-200"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h4 className="font-semibold text-sm">{address.receiver}</h4>
                                        <div className="flex items-center gap-1">
                                            {address.isDefault && (
                                                <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-xs">
                                                    Mặc định
                                                </Badge>
                                            )}
                                            {/* {
                            watch("_id") === address._id && (
                              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">
                                Đang sử dụng
                              </Badge>
                            )
                          } */}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Phone className="h-3 w-3" />
                                            {address.phone}
                                        </div>
                                        <div className="flex items-start gap-2 text-xs text-muted-foreground">
                                            <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                            <span className="line-clamp-2">{address?.street + ", " + address?.ward.name + ", " + address?.province.name}</span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
            </DialogContent>
        </Dialog>
    )
}

export default AddressSelection