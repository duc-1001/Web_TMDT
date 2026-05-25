import { ProductCard as ProductCardType } from '@/types/product'
import { Card, CardContent } from "@/components/ui/card"
import Link from 'next/link'
import { Badge } from '../ui/badge'
import { Star } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import StarRating from './star-rating'

interface ProductCardProps {
  product: ProductCardType 
}

const ProductCard = ({ product }: ProductCardProps) => {

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
            <Badge className="absolute top-2 text-white right-2 bg-destructive">
              -{product.discount}%
            </Badge>
          )}
        </div>
      </Link>

      <CardContent className="px-2 m-0">
        <div className="flex items-center gap-1 mb-2">
          <StarRating rating={product.ratingAvg || 0} size="sm" />
          <span className="text-sm text-muted-foreground">({product?.ratingCount || 0})</span>
        </div>
        <Link className='w-fit block ' href={`/product/${product.slug}`}>
          <h3 className="font-semibold mb-1 text-balance line-clamp-1 hover:underline hover:text-orange-500 w-fit">{product.name}</h3>
        </Link>
        <p className="text-sm text-muted-foreground line-clamp-1">{product.shortDescription}</p>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-orange-500">{formatPrice(product.price)}</span>
          {product.originalPrice > product.price && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default ProductCard