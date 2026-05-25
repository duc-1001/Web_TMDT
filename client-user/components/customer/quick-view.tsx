"use client"

import { CustomerStatus } from '@/types/customer'
import { useRouter } from 'next/navigation'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Mail,
  Phone,
  ShoppingCart,
  TrendingUp,
  Edit,
  User,
  ExternalLink,
  MapPin
} from "lucide-react"
import { useQuery } from '@tanstack/react-query'
import { getCustomerQuickView } from '@/services/customer.service'
import { formatPrice } from '@/lib/utils'
import { JSX } from 'react'
import { formatTimeAgo } from '@/lib/time'

interface QuickViewProps {
  customerId: string | null
  detailSheetOpen: boolean
  setDetailSheetOpen: (open: boolean) => void
  getStatusBadge: (status: CustomerStatus) => JSX.Element
}

const QuickView = ({
  customerId,
  detailSheetOpen,
  setDetailSheetOpen,
  getStatusBadge
}: QuickViewProps) => {

  const router = useRouter()

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customerQuickView', customerId],
    queryFn: () => getCustomerQuickView(customerId!),
    enabled: !!customerId && detailSheetOpen,
  })

  const getDefaultAddress = () => {
    if (!customer?.addresses?.length) return null
    return (
      customer.addresses.find(a => a.isDefault) ||
      customer.addresses[0]
    )
  }

  return (
    <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">

        {/* LOADING */}
        {isLoading && (
          <div className="p-6 text-sm text-muted-foreground">
            Đang tải...
          </div>
        )}

        {/* CONTENT */}
        {!isLoading && customer && (
          <>
            {/* HEADER */}
            <div className="relative px-6 pt-8 pb-6 text-center bg-gradient-to-br from-primary/10 to-background border-b">
              <Avatar className="h-20 w-20 mx-auto mb-3 ring-4 ring-background shadow-lg">
                <AvatarImage src={customer.avatar} alt={customer.fullName} />
                <AvatarFallback className="text-xl font-bold bg-primary text-primary-foreground">
                  {customer.fullName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>

              <SheetTitle className="text-lg font-semibold">
                {customer.fullName}
              </SheetTitle>

              <div className="mt-2 flex justify-center">
                {getStatusBadge(customer.status)}
              </div>
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

              {/* CONTACT */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Liên hệ
                </h3>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <Mail className="w-4 h-4 text-blue-500" />
                  <span className="text-sm truncate">{customer.email}</span>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <Phone className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm">
                    {customer.phone || "Chưa có"}
                  </span>
                </div>
              </div>

              {/* ADDRESS */}
              {customer.addresses?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Địa chỉ
                  </h3>

                  {(() => {
                    const address = getDefaultAddress()
                    if (!address) return null

                    return (
                      <div className="p-3 rounded-xl bg-muted/50 space-y-1">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-orange-500" />
                          <p className="text-sm font-medium">
                            {address.receiver} • {address.phone}
                          </p>
                        </div>

                        <p className="text-sm text-muted-foreground pl-6">
                          {address.street}, {address.ward.name},{" "}
                          {address.province.name}
                        </p>

                        {address.isDefault && (
                          <span className="text-xs text-emerald-600 pl-6">
                            Mặc định
                          </span>
                        )}
                      </div>
                    )
                  })()}

                  {customer.addresses.length > 1 && (
                    <p className="text-xs text-muted-foreground">
                      +{customer.addresses.length - 1} địa chỉ khác
                    </p>
                  )}
                </div>
              )}

              {/* STATS */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Thống kê
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border">
                    <div className="flex items-center gap-2 text-xs text-blue-600 mb-1">
                      <ShoppingCart className="w-4 h-4" />
                      Đơn hàng
                    </div>
                    <p className="text-xl font-bold">
                      {customer.orders ?? 0}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border">
                    <div className="flex items-center gap-2 text-xs text-emerald-600 mb-1">
                      <TrendingUp className="w-4 h-4" />
                      Chi tiêu
                    </div>
                    <p className="text-sm font-bold text-emerald-600">
                      {formatPrice(customer.spent ?? 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* DATES */}
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">Tham gia:</span>{" "}
                  {customer.joinDate ? formatTimeAgo(customer.joinDate) || "--" : "--"}
                </p>
                <p>
                  <span className="font-medium text-foreground">Đăng nhập:</span>{" "}
                  {customer.lastLogin ? formatTimeAgo(customer.lastLogin) || "Chưa có" : "Chưa có"}
                </p>
              </div>

            </div>
          </>
        )}

        {/* FOOTER */}
        <div className="p-4 border-t bg-background/80 backdrop-blur-sm flex gap-2">
          <Button
            className="flex-1 h-11"
            onClick={() => {
              setDetailSheetOpen(false)
              router.push(`/admin/customers/${customerId}`)
            }}
          >
            <Edit className="w-4 h-4 mr-2" />
            Chi tiết
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11"
            onClick={() =>
              window.open(`mailto:${customer?.email}`)
            }
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>

      </SheetContent>
    </Sheet>
  )
}

export default QuickView