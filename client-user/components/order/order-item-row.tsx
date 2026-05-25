import { formatPrice } from "@/lib/utils"
import { OrderItemSnapshot } from "@/types/order"

interface OrderItemRowProps {
  item: OrderItemSnapshot
}

export const OrderItemRow = ({ item }: OrderItemRowProps) => {
  return (
    <div className="flex gap-4 items-center border rounded-lg p-3">
      {/* Image */}
      <div className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-muted">
        {item.image ? (
          <img
            src={item.image.url}
            alt={item.name}
            className=" m-auto h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
            No image
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{item.name}</p>
        <p className="text-sm text-muted-foreground">
          Số lượng: x{item.quantity}
        </p>
      </div>

      {/* Price */}
      <div className="text-right">
        <p className="font-semibold text-orange-500">
          {formatPrice(item.price * item.quantity)}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatPrice(item.price)} / sp
        </p>
      </div>
    </div>
  )
}
