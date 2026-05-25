"use client"
import { Star } from "lucide-react"

const StarRating = ({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) => {
  // Xử lý rating về khoảng 0-5
  const normalizedRating = Math.max(0, Math.min(5, rating))

  // Kích thước sao
  const starSizeClass = size === 'sm' ? 'h-4 w-4' 
                       : size === 'lg' ? 'h-6 w-6' 
                       : 'h-5 w-5'

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        // Tính % fill cho sao hiện tại
        const fillPercent = Math.min(Math.max(normalizedRating - (star - 1), 0), 1) * 100

        return (
          <div key={star} className={`relative ${starSizeClass}`}>
            {/* Sao nền (outline xám) */}
            <Star 
              className={`${starSizeClass} text-gray-300 stroke-2`} 
              fill="none" 
            />

            {/* Sao fill vàng - clip theo % */}
            <div 
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fillPercent}%` }}
            >
              <Star 
                className={`${starSizeClass} text-yellow-400 fill-yellow-400 stroke-yellow-400`} 
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default StarRating