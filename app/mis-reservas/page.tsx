import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { BookingList } from '@/components/booking/booking-list'

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, business:businesses(name, slug, city, cover_image), service:services(name, duration_minutes)')
    .eq('client_id', user.id)
    .order('date', { ascending: false })

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mis reservas</h1>
          <p className="text-slate-500 mt-1">Todas tus citas en un solo lugar</p>
        </div>
        <BookingList bookings={bookings ?? []} />
      </main>
      <Footer />
    </div>
  )
}
