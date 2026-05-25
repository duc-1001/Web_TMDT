import { ProductCard  } from '@/types/product'
import React, { use } from 'react'
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import Link from 'next/link'
import { Badge } from '../ui/badge'
import { Heart, ShoppingCart, Star } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { Button } from '../ui/button'
import LikeButton from './like-button'
import AddToCartButton from './add-to-card-button'
import { RootState } from '@/store/store'
import { useSelector } from 'react-redux'
import { addToCart } from '@/services/cart.service'
import { toast } from 'sonner'

interface HomeProductCardProps {
  product: ProductCard 
  onToggleLike: (productId: string) => void
}

const HomeProductCard = ({ product, onToggleLike }: HomeProductCardProps) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)

  return (
    <Card key={product._id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 gap-2 p-2">
      <Link href={`/product/${product.slug}`}>
        <div className="relative overflow-hidden bg-muted/50">
          <img
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            className="h-[300px] m-auto object-cover group-hover:scale-110 transition-transform duration-300"
          />
          {product.badge && <Badge className="absolute top-2 left-2 text-white bg-orange-600">{product.badge}</Badge>}
          {Number(product.discount) > 0 && (
            <Badge className="absolute top-2 right-2 text-white bg-destructive">
              -{product.discount}%
            </Badge>
          )}
        </div>
      </Link>

      <CardContent className="px-2 m-0">
        <div className="flex items-center gap-1 mb-2">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-medium">{product?.ratingAvg || 0}</span>
          <span className="text-sm text-muted-foreground">({product?.ratingCount || 0})</span>
        </div>
        <Link className='w-fit block ' href={`/product/${product.slug}`}>
          <h3 className="font-semibold mb-1 text-balance line-clamp-1 hover:underline hover:text-orange-500 w-fit">{product.name}</h3>
        </Link>
        <p className="text-sm text-muted-foreground line-clamp-1">{product.shortDescription}</p>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-orange-500">{formatPrice(product.price)}</span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
      </CardContent>

      <CardFooter className="px-2 py-3 pt-0 flex items-center gap-2">
        <AddToCartButton productId={product._id} quantity={1} />
        <LikeButton product={product} onToggleLike={onToggleLike} />
      </CardFooter>
    </Card>
  )
}

export default HomeProductCard