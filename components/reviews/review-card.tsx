import { StarRating } from './star-rating'
import { formatDate } from '@/lib/utils'
import type { Review } from '@/types/database'

export function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700 ring-2 ring-indigo-50">
            {review.client?.full_name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{review.client?.full_name ?? 'Cliente'}</p>
            <p className="text-xs text-slate-400 font-medium">{formatDate(review.created_at)}</p>
          </div>
        </div>
        <StarRating value={review.rating} readonly size="sm" />
      </div>
      {review.comment && (
        <p className="text-sm text-slate-600 leading-relaxed pl-12">{review.comment}</p>
      )}
    </div>
  )
}
