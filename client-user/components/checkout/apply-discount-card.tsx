import { formatPrice } from '@/lib/utils'
import { AppliedDiscount } from '@/types/discount'
import { Tag, X } from 'lucide-react'
import React from 'react'
interface ApplyDiscountCardProps {
  discount: AppliedDiscount
  handleRemoveDiscount: (discountCode: string) => void
}
const ApplyDiscountCard = ({ discount, handleRemoveDiscount }: ApplyDiscountCardProps) => {
  
  return (
    <div
      className="flex items-center justify-between rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-sm text-purple-700 shadow-sm transition hover:shadow-md dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300"
    >
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/50">
          <Tag className="h-4 w-4" />
        </div>

        <div className="flex flex-col leading-tight">
          <span className="font-semibold">{discount?.code}</span>
          <span className="text-xs text-purple-500 dark:text-purple-400">
            {
              discount.type === "shipping" ? discount.amount === 0 ? "Miễn phí vận chuyển" : `Giảm ${formatPrice(discount.amount)} phí vận chuyển` : `Giảm ${formatPrice(discount.amount)}`
            }
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="font-semibold text-purple-700 dark:text-purple-300">
          {
            discount.type === "shipping" ? discount.amount === 0 ? "Miễn phí" : `- ${formatPrice(discount.amount)}` : `- ${formatPrice(discount.amount)}`
          }
        </span>

        <button
          type="button"
          onClick={() => handleRemoveDiscount(discount.code)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-purple-500 transition hover:bg-purple-100 hover:text-purple-700 dark:hover:bg-purple-900/40 dark:hover:text-purple-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default ApplyDiscountCard
