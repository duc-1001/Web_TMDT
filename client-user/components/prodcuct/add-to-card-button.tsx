import { Button } from '../ui/button'
import { ShoppingCart } from 'lucide-react'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { toast } from 'sonner'
import { addToCart } from '@/services/cart.service'
import { queryClient } from '../QueryClientProviders'
import { useCartActions } from '@/hooks/use-cart-actions'

interface AddToCartButtonProps {
    productId: string
    quantity: number
}

const AddToCartButton = ({ productId, quantity }: AddToCartButtonProps) => {
    const { isAuthenticated } = useSelector((state: RootState) => state.auth)

    const { addItem } = useCartActions(isAuthenticated)

    return (
        <Button className="flex-1 text-white cursor-pointer" onClick={() => addItem(productId, quantity)}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Thêm vào giỏ
        </Button>
    )
}

export default AddToCartButton
