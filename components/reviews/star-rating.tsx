'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  size?: 'sm' | 'md' | 'lg'
  readonly?: boolean
}

export function StarRating({ value, onChange, size = 'md', readonly }: StarRatingProps) {
  const sizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-7 h-7' }

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={cn('focus:outline-none', !readonly && 'hover:scale-110 transition-transform')}
        >
          <Star
            className={cn(
              sizes[size],
              star <= value ? 'text-amber-500 fill-amber-500' : 'text-slate-300'
            )}
          />
        </button>
      ))}
    </div>
  )
}
