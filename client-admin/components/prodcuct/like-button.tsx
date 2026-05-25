import { Button } from '../ui/button'
import { Heart } from 'lucide-react'
import { ProductCard , Product } from '@/types/product'
interface LikeButtonProps {
    product: ProductCard  | Product
    onToggleLike: (productId: string) => void
}
const LikeButton = ({ product, onToggleLike }: LikeButtonProps) => {
    const handleLikeProduct = async () => {
        onToggleLike(product._id)
    }
    return (
        <Button
            size="icon"
            className={`ml-2 flex items-center justify-center cursor-pointer rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors `}
            onClick={(e) => {
                e.preventDefault()
                handleLikeProduct()
            }}
        >
            <Heart className={`h-5 w-5 ${product.isLiked ? "text-red-500 fill-current" : "text-black"}`} />
        </Button>
    )
}

export default LikeButton
