-- ============================================================
-- ReservaPro Security & Constraints Migration
-- Run this in your Supabase SQL Editor (or via CLI migration)
-- ============================================================

-- 1. Create rate_limits table for serverless rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  reset_time BIGINT NOT NULL
);

-- 2. Ensure unique slugs for businesses (prevents duplicate URLs)
ALTER TABLE public.businesses
  ADD CONSTRAINT businesses_slug_unique UNIQUE (slug);

-- 3. Prevent active overbooking: same business/staff/time slot cannot be double-booked
-- COALESCE makes NULL staff_id count as one shared slot.
CREATE UNIQUE INDEX IF NOT EXISTS bookings_no_double_booking
  ON public.bookings (
    business_id,
    COALESCE(staff_id, '00000000-0000-0000-0000-000000000000'::uuid),
    date,
    start_time
  )
  WHERE status IN ('pending', 'confirmed');

-- 4. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policies
-- ============================================================

-- PROFILES
-- Anyone can read public profiles (needed for business listings, reviews)
CREATE POLICY "Public profiles are viewable"
  ON public.profiles FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Only service role / admin can insert/delete profiles
CREATE POLICY "Service role can insert profiles"
  ON public.profiles FOR INSERT WITH CHECK (false); -- managed by server/API
CREATE POLICY "Service role can delete profiles"
  ON public.profiles FOR DELETE USING (false);

-- BUSINESSES
-- Anyone can view approved active businesses
CREATE POLICY "Businesses are viewable if approved and active"
  ON public.businesses FOR SELECT USING (is_approved = true AND is_active = true);

-- Business owners can view and manage their own business
CREATE POLICY "Business owners can manage own business"
  ON public.businesses FOR ALL USING (auth.uid() = owner_id);

-- Admins can view all businesses
CREATE POLICY "Admins can view all businesses"
  ON public.businesses FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- SERVICES
-- Anyone can view active services (needed for business detail pages)
CREATE POLICY "Active services are viewable"
  ON public.services FOR SELECT USING (is_active = true);

-- Business owners can manage services of their business
CREATE POLICY "Business owners can manage services"
  ON public.services FOR ALL USING (
    EXISTS (SELECT 1 FROM public.businesses WHERE id = services.business_id AND owner_id = auth.uid())
  );

-- STAFF
-- Anyone can view active staff
CREATE POLICY "Active staff are viewable"
  ON public.staff FOR SELECT USING (is_active = true);

-- Business owners can manage staff
CREATE POLICY "Business owners can manage staff"
  ON public.staff FOR ALL USING (
    EXISTS (SELECT 1 FROM public.businesses WHERE id = staff.business_id AND owner_id = auth.uid())
  );

-- AVAILABILITY
-- Anyone can view availability (needed for booking modal)
CREATE POLICY "Availability is viewable"
  ON public.availability FOR SELECT USING (true);

-- Business owners can manage availability
CREATE POLICY "Business owners can manage availability"
  ON public.availability FOR ALL USING (
    EXISTS (SELECT 1 FROM public.businesses WHERE id = availability.business_id AND owner_id = auth.uid())
  );

-- BOOKINGS
-- Clients can view their own bookings
CREATE POLICY "Clients can view own bookings"
  ON public.bookings FOR SELECT USING (auth.uid() = client_id);

-- Business owners can view bookings for their business
CREATE POLICY "Business owners can view business bookings"
  ON public.bookings FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.businesses WHERE id = bookings.business_id AND owner_id = auth.uid())
  );

-- Clients can create bookings (they are the client)
CREATE POLICY "Clients can create bookings"
  ON public.bookings FOR INSERT WITH CHECK (auth.uid() = client_id);

-- Business owners can update status of their bookings
CREATE POLICY "Business owners can update booking status"
  ON public.bookings FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.businesses WHERE id = bookings.business_id AND owner_id = auth.uid())
  );

-- REVIEWS
-- Anyone can view reviews
CREATE POLICY "Reviews are viewable"
  ON public.reviews FOR SELECT USING (true);

-- Clients can create reviews for their own bookings
CREATE POLICY "Clients can create reviews"
  ON public.reviews FOR INSERT WITH CHECK (auth.uid() = client_id);

-- Clients can delete their own reviews
CREATE POLICY "Clients can delete own reviews"
  ON public.reviews FOR DELETE USING (auth.uid() = client_id);

-- SUBSCRIPTIONS
-- Business owners can view their own subscriptions
CREATE POLICY "Business owners can view subscriptions"
  ON public.subscriptions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.businesses WHERE id = subscriptions.business_id AND owner_id = auth.uid())
  );

-- Only server role can insert/update subscriptions (via webhooks)
CREATE POLICY "Server role manages subscriptions"
  ON public.subscriptions FOR ALL USING (false);

-- RATE_LIMITS (internal — only service role can access)
CREATE POLICY "Server role manages rate limits"
  ON public.rate_limits FOR ALL USING (false);
