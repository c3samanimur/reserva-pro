export type UserRole = 'client' | 'business' | 'admin'
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'
export type PaymentStatus = 'not_required' | 'pending' | 'paid' | 'refunded'
export type BusinessCategory = 'barberia' | 'peluqueria' | 'estetica' | 'unas' | 'spa'
export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'inactive'

export interface Profile {
  id: string
  full_name: string
  email: string
  role: UserRole
  avatar_url: string | null
  phone: string | null
  created_at: string
}

export interface Business {
  id: string
  owner_id: string
  name: string
  slug: string
  description: string
  address: string
  city: string
  phone: string
  email: string
  category: BusinessCategory
  images: string[]
  cover_image: string | null
  is_approved: boolean
  is_active: boolean
  accepts_online_payment: boolean
  rating_avg: number
  rating_count: number
  created_at: string
}

export interface Service {
  id: string
  business_id: string
  name: string
  description: string | null
  duration_minutes: number
  price: number
  is_active: boolean
}

export interface Staff {
  id: string
  business_id: string
  name: string
  avatar_url: string | null
  is_active: boolean
}

export interface Availability {
  id: string
  business_id: string
  staff_id: string | null
  day_of_week: number
  start_time: string
  end_time: string
}

export interface Booking {
  id: string
  client_id: string
  business_id: string
  service_id: string
  staff_id: string | null
  date: string
  start_time: string
  end_time: string
  status: BookingStatus
  payment_status: PaymentStatus
  stripe_payment_intent_id: string | null
  total_price: number
  notes: string | null
  created_at: string
  // Relations
  business?: Business
  service?: Service
  staff?: Staff
  client?: Profile
}

export interface Subscription {
  id: string
  business_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  status: SubscriptionStatus
  current_period_start: string | null
  current_period_end: string | null
  created_at: string
  updated_at: string
}

export interface Review {
  id: string
  client_id: string
  business_id: string
  booking_id: string | null
  rating: number
  comment: string | null
  created_at: string
  client?: Profile
}
