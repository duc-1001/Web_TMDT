import { ProductCard  } from '@/types/product'
import { Card, CardContent } from '../ui/card'
import { formatPrice } from '@/lib/utils'
import { Star } from 'lucide-react'
import { Badge } from '../ui/badge'

interface SimilarProductCardProps {
    product: ProductCard 
}

const SimilarProductCard = ({ product }: SimilarProductCardProps) => {
    return (
        <Card className="group hover:shadow-lg transition-all duration-300 p-2 gap-2">
            <div className="relative aspect-square bg-muted rounded-t-lg overflow-hidden">
                <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    className="max-h-[300px] m-auto h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                {product.badge && <Badge className="absolute text-white top-2 left-2 bg-orange-600">{product.badge}</Badge>}
                {product.discount && (
                    <Badge className="absolute text-white top-2 right-2 bg-destructive">-{product.discount}%</Badge>
                )}
            </div>
            <CardContent className="p-4">
                <h3 className="font-medium text-balance line-clamp-1">{product.name}</h3>
                <h3 className="font-medium mb-2 text-sm text-muted-foreground line-clamp-1">{product.shortDescription}</h3>
                <div className="flex items-center justify-between">
                    <span className="font-bold text-orange-500">{formatPrice(product.price)}</span>
                    <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{product?.ratingAvg || 0}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default SimilarProductCard