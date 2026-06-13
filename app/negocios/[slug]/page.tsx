import { notFound } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Badge } from '@/components/ui/badge'
import { ReviewCard } from '@/components/reviews/review-card'
import { StarRating } from '@/components/reviews/star-rating'
import { BusinessDetailClient } from './client'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'
import { CATEGORY_LABELS, formatPrice, DAY_NAMES } from '@/lib/utils'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function BusinessDetailPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('slug', slug)
    .eq('is_approved', true)
    .single()

  if (!business) notFound()

  const [{ data: services }, { data: staff }, { data: availability }, { data: reviews }] = await Promise.all([
    supabase.from('services').select('*').eq('business_id', business.id).eq('is_active', true).order('price'),
    supabase.from('staff').select('*').eq('business_id', business.id).eq('is_active', true),
    supabase.from('availability').select('*').eq('business_id', business.id).order('day_of_week'),
    supabase
      .from('reviews')
      .select('*, client:profiles(full_name)')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const dayAvailability = Array.from({ length: 7 }, (_, i) => ({
    day: i,
    avail: availability?.find(a => a.day_of_week === i),
  }))

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Cover */}
        <div className="relative h-56 md:h-80 rounded-2xl overflow-hidden bg-slate-200 mb-8">
          {business.cover_image ? (
            <Image src={business.cover_image} alt={business.name} fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
              <span className="text-9xl opacity-20 select-none">✂️</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: info */}
          <div className="lg:col-span-2 space-y-10">
            {/* Business info */}
            <div>
              <div className="flex flex-wrap items-start gap-2.5 mb-4">
                <Badge variant="info">{CATEGORY_LABELS[business.category]}</Badge>
                {business.accepts_online_payment && <Badge variant="success">Pago online</Badge>}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3 tracking-tight">{business.name}</h1>
              <div className="flex items-center gap-2.5 mb-5">
                <StarRating value={Math.round(business.rating_avg)} readonly />
                <span className="text-sm font-bold text-slate-900">
                  {business.rating_avg > 0 ? business.rating_avg.toFixed(1) : 'Sin valoraciones'}
                </span>
                {business.rating_count > 0 && (
                  <span className="text-sm text-slate-400">({business.rating_count} reseñas)</span>
                )}
              </div>
              <p className="text-slate-600 leading-relaxed text-lg">{business.description}</p>
            </div>

            {/* Services */}
            {services && services.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-5">Servicios</h2>
                <div className="space-y-3">
                  {services.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all">
                      <div>
                        <p className="font-semibold text-slate-900">{s.name}</p>
                        {s.description && <p className="text-sm text-slate-500 mt-1">{s.description}</p>}
                        <p className="text-xs text-slate-400 mt-1.5 font-medium">{s.duration_minutes} min</p>
                      </div>
                      <span className="font-bold text-indigo-600 ml-4 text-lg">{formatPrice(s.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-5">
                Reseñas {reviews && reviews.length > 0 && `(${reviews.length})`}
              </h2>
              {reviews && reviews.length > 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <div className="space-y-6">
                    {reviews.map(r => <ReviewCard key={r.id} review={r as any} />)}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                  <p className="text-slate-500 font-medium">Todavía no hay reseñas para este negocio.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: booking + info sidebar */}
          <div className="space-y-5">
            {/* Booking CTA */}
            <BusinessDetailClient
              business={business}
              services={services ?? []}
              staff={staff ?? []}
              availability={availability ?? []}
            />

            {/* Contact info */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
              <h3 className="font-bold text-slate-900">Información</h3>
              {business.address && (
                <div className="flex items-start gap-3 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <span>{business.address}, {business.city}</span>
                </div>
              )}
              {business.phone && (
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <a href={`tel:${business.phone}`} className="hover:text-indigo-600 font-medium transition-colors">{business.phone}</a>
                </div>
              )}
              {business.email && (
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <a href={`mailto:${business.email}`} className="hover:text-indigo-600 font-medium transition-colors truncate">{business.email}</a>
                </div>
              )}
            </div>

            {/* Hours */}
            {availability && availability.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4">Horario</h3>
                <div className="space-y-3">
                  {dayAvailability.map(({ day, avail }) => (
                    <div key={day} className="flex items-center justify-between text-sm">
                      <span className={avail ? 'text-slate-800 font-semibold' : 'text-slate-400'}>{DAY_NAMES[day]}</span>
                      {avail ? (
                        <span className="text-slate-600 font-medium">
                          {avail.start_time.slice(0, 5)} — {avail.end_time.slice(0, 5)}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs font-medium">Cerrado</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
