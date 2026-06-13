import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { BusinessCard } from '@/components/business/business-card'
import { BusinessSearch } from '@/components/business/business-search'
import { CATEGORY_LABELS } from '@/lib/utils'

interface Props {
  searchParams: Promise<{ q?: string; categoria?: string; ciudad?: string }>
}

export default async function NegociosPage({ searchParams }: Props) {
  const params = await searchParams
  const { q, categoria, ciudad } = params

  const supabase = await createClient()

  let query = supabase
    .from('businesses')
    .select('*, services(*)')
    .eq('is_approved', true)
    .eq('is_active', true)
    .order('rating_avg', { ascending: false })

  if (q) query = query.ilike('name', `%${q}%`)
  if (categoria) query = query.eq('category', categoria)
  if (ciudad) query = query.ilike('city', `%${ciudad}%`)

  const { data: businesses } = await query

  const activeCategory = categoria ? CATEGORY_LABELS[categoria] : null

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header />

      <main className="flex-1">
        {/* Header section */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">
              {activeCategory ? `${activeCategory}s` : 'Todos los negocios'}
            </h1>
            <p className="text-slate-500 text-sm mb-6">
              {businesses?.length ?? 0} negocios disponibles
            </p>
            <BusinessSearch initialQ={q} initialCiudad={ciudad} initialCategoria={categoria} />
          </div>
        </div>

        {/* Results */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {businesses && businesses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {businesses.map(b => (
                <BusinessCard key={b.id} business={b as any} />
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-white rounded-2xl border border-slate-200">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">No se encontraron negocios</h3>
              <p className="text-slate-500 text-sm">Prueba con otros filtros o términos de búsqueda</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
