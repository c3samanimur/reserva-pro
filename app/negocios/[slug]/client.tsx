'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { BookingModal } from '@/components/booking/booking-modal'
import { Calendar } from 'lucide-react'
import type { Business, Service, Staff, Availability } from '@/types/database'

interface Props {
  business: Business
  services: Service[]
  staff: Staff[]
  availability: Availability[]
}

export function BusinessDetailClient({ business, services, staff, availability }: Props) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-500/20">
        <h3 className="font-bold text-lg mb-1.5">Reservar cita</h3>
        <p className="text-indigo-200 text-sm mb-5">
          {services.length} servicios disponibles. Confirma al instante.
        </p>
        <Button
          size="lg"
          className="w-full bg-white text-indigo-700 hover:bg-indigo-50 shadow-sm"
          onClick={() => setShowModal(true)}
          disabled={services.length === 0}
        >
          <Calendar className="w-4 h-4 mr-2" />
          {services.length === 0 ? 'Sin servicios disponibles' : 'Reservar ahora'}
        </Button>
      </div>

      {showModal && (
        <BookingModal
          business={business}
          services={services}
          staff={staff}
          availability={availability}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
