import Link from 'next/link'
import Image from 'next/image'
import { Star, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CATEGORY_LABELS, formatPrice } from '@/lib/utils'
import type { Business, Service } from '@/types/database'

interface BusinessCardProps {
  business: Business & { services?: Service[] }
}

export function BusinessCard({ business }: BusinessCardProps) {
  const minPrice = business.services?.length
    ? Math.min(...business.services.map(s => s.price))
    : null

  return (
    <Link href={`/negocios/${business.slug}`}>
      <div className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden">
        {/* Image */}
        <div className="relative h-52 bg-slate-100 overflow-hidden">
          {business.cover_image ? (
            <Image
              src={business.cover_image}
              alt={business.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
              <span className="text-6xl opacity-40 select-none">✂️</span>
            </div>
          )}
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge variant="info">{CATEGORY_LABELS[business.category]}</Badge>
            {business.accepts_online_payment && (
              <Badge variant="success">Pago online</Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="font-bold text-slate-900 text-base mb-1.5 truncate group-hover:text-indigo-600 transition-colors">
            {business.name}
          </h3>

          <div className="flex items-center gap-1.5 mb-2.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-sm text-slate-500">{business.city}</span>
          </div>

          <p className="text-sm text-slate-500 line-clamp-2 mb-4 leading-relaxed">
            {business.description}
          </p>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="text-sm font-semibold text-slate-800">
                {business.rating_avg > 0 ? business.rating_avg.toFixed(1) : 'Nuevo'}
              </span>
              {business.rating_count > 0 && (
                <span className="text-xs text-slate-400">({business.rating_count})</span>
              )}
            </div>
            {minPrice !== null && (
              <span className="text-sm font-bold text-indigo-600">
                Desde {formatPrice(minPrice)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
