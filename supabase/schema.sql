-- =====================================================
-- RESERVA PRO - Schema SQL para Supabase
-- Ejecutar en el SQL Editor de tu proyecto Supabase
-- =====================================================

-- Extensiones
create extension if not exists "uuid-ossp";

-- =====================================================
-- TABLA: profiles
-- =====================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  email text not null,
  role text not null default 'client' check (role in ('client', 'business', 'admin')),
  avatar_url text,
  phone text,
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Usuarios pueden ver perfiles públicos" on public.profiles
  for select using (true);

create policy "Usuarios pueden editar su propio perfil" on public.profiles
  for update using (auth.uid() = id);

-- Trigger para crear perfil al registrarse
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'client')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =====================================================
-- TABLA: businesses
-- =====================================================
create table public.businesses (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  slug text unique not null,
  description text not null default '',
  address text not null default '',
  city text not null default '',
  phone text not null default '',
  email text not null default '',
  category text not null default 'peluqueria' check (category in ('barberia', 'peluqueria', 'estetica', 'unas', 'spa')),
  images text[] default '{}',
  cover_image text,
  is_approved boolean default false not null,
  is_active boolean default true not null,
  accepts_online_payment boolean default false not null,
  rating_avg numeric(3,2) default 0,
  rating_count int default 0,
  created_at timestamptz default now() not null
);

alter table public.businesses enable row level security;

create policy "Negocios aprobados son visibles para todos" on public.businesses
  for select using (is_approved = true and is_active = true);

create policy "Dueños ven su propio negocio" on public.businesses
  for select using (auth.uid() = owner_id);

create policy "Admin ve todos los negocios" on public.businesses
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Dueños pueden crear su negocio" on public.businesses
  for insert with check (auth.uid() = owner_id);

create policy "Dueños pueden actualizar su negocio" on public.businesses
  for update using (auth.uid() = owner_id);

create policy "Admin puede actualizar cualquier negocio" on public.businesses
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- =====================================================
-- TABLA: services
-- =====================================================
create table public.services (
  id uuid default uuid_generate_v4() primary key,
  business_id uuid references public.businesses(id) on delete cascade not null,
  name text not null,
  description text,
  duration_minutes int not null default 30,
  price numeric(8,2) not null default 0,
  is_active boolean default true not null
);

alter table public.services enable row level security;

create policy "Servicios de negocios activos son públicos" on public.services
  for select using (
    exists (select 1 from public.businesses where id = business_id and is_approved = true and is_active = true)
  );

create policy "Dueños gestionan sus servicios" on public.services
  for all using (
    exists (select 1 from public.businesses where id = business_id and owner_id = auth.uid())
  );

-- =====================================================
-- TABLA: staff
-- =====================================================
create table public.staff (
  id uuid default uuid_generate_v4() primary key,
  business_id uuid references public.businesses(id) on delete cascade not null,
  name text not null,
  avatar_url text,
  is_active boolean default true not null
);

alter table public.staff enable row level security;

create policy "Staff de negocios activos es público" on public.staff
  for select using (
    exists (select 1 from public.businesses where id = business_id and is_approved = true)
  );

create policy "Dueños gestionan su staff" on public.staff
  for all using (
    exists (select 1 from public.businesses where id = business_id and owner_id = auth.uid())
  );

-- =====================================================
-- TABLA: availability
-- =====================================================
create table public.availability (
  id uuid default uuid_generate_v4() primary key,
  business_id uuid references public.businesses(id) on delete cascade not null,
  staff_id uuid references public.staff(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  unique (business_id, staff_id, day_of_week)
);

alter table public.availability enable row level security;

create policy "Disponibilidad es pública" on public.availability
  for select using (true);

create policy "Dueños gestionan disponibilidad" on public.availability
  for all using (
    exists (select 1 from public.businesses where id = business_id and owner_id = auth.uid())
  );

-- =====================================================
-- TABLA: bookings
-- =====================================================
create table public.bookings (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.profiles(id) on delete cascade not null,
  business_id uuid references public.businesses(id) on delete cascade not null,
  service_id uuid references public.services(id) on delete cascade not null,
  staff_id uuid references public.staff(id) on delete set null,
  date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_status text not null default 'not_required' check (payment_status in ('not_required', 'pending', 'paid', 'refunded')),
  stripe_payment_intent_id text,
  total_price numeric(8,2) not null default 0,
  notes text,
  created_at timestamptz default now() not null
);

alter table public.bookings enable row level security;

create policy "Clientes ven sus reservas" on public.bookings
  for select using (auth.uid() = client_id);

create policy "Dueños ven reservas de su negocio" on public.bookings
  for select using (
    exists (select 1 from public.businesses where id = business_id and owner_id = auth.uid())
  );

create policy "Clientes pueden crear reservas" on public.bookings
  for insert with check (auth.uid() = client_id);

create policy "Clientes pueden cancelar sus reservas" on public.bookings
  for update using (auth.uid() = client_id);

create policy "Dueños pueden actualizar reservas de su negocio" on public.bookings
  for update using (
    exists (select 1 from public.businesses where id = business_id and owner_id = auth.uid())
  );

-- =====================================================
-- TABLA: reviews
-- =====================================================
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.profiles(id) on delete cascade not null,
  business_id uuid references public.businesses(id) on delete cascade not null,
  booking_id uuid references public.bookings(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now() not null,
  unique (client_id, business_id, booking_id)
);

alter table public.reviews enable row level security;

create policy "Reseñas son públicas" on public.reviews
  for select using (true);

create policy "Clientes pueden escribir reseñas" on public.reviews
  for insert with check (auth.uid() = client_id);

create policy "Clientes pueden editar sus reseñas" on public.reviews
  for update using (auth.uid() = client_id);

-- =====================================================
-- FUNCIÓN: actualizar rating del negocio
-- =====================================================
create or replace function update_business_rating()
returns trigger as $$
begin
  update public.businesses
  set
    rating_avg = (select avg(rating) from public.reviews where business_id = new.business_id),
    rating_count = (select count(*) from public.reviews where business_id = new.business_id)
  where id = new.business_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_review_change
  after insert or update on public.reviews
  for each row execute procedure update_business_rating();

-- =====================================================
-- TABLA: subscriptions
-- =====================================================
create table public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  business_id uuid references public.businesses(id) on delete cascade not null unique,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  status text not null default 'inactive' check (status in ('active', 'past_due', 'cancelled', 'inactive')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.subscriptions enable row level security;

create policy "Dueños ven su propia suscripción" on public.subscriptions
  for select using (
    exists (select 1 from public.businesses where id = business_id and owner_id = auth.uid())
  );

create policy "Admin ve todas las suscripciones" on public.subscriptions
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- =====================================================
-- FUNCIÓN: prevenir doble-booking
-- =====================================================
create or replace function public.check_booking_conflict()
returns trigger as $$
begin
  if exists (
    select 1 from public.bookings
    where business_id = new.business_id
      and staff_id is not distinct from new.staff_id
      and date = new.date
      and start_time = new.start_time
      and status in ('pending', 'confirmed')
      and id != new.id
  ) then
    raise exception 'Este horario ya está reservado. Por favor, elige otro.';
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_booking_insert_update
  before insert or update on public.bookings
  for each row execute procedure public.check_booking_conflict();

-- =====================================================
-- FUNCIÓN: actualizar timestamp de suscripción
-- =====================================================
create or replace function public.handle_subscription_updated()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

create trigger on_subscription_change
  before update on public.subscriptions
  for each row execute procedure public.handle_subscription_updated();

-- =====================================================
-- Storage bucket para imágenes
-- =====================================================
insert into storage.buckets (id, name, public)
values ('business-images', 'business-images', true)
on conflict do nothing;

create policy "Imágenes son públicas" on storage.objects
  for select using (bucket_id = 'business-images');

create policy "Dueños pueden subir imágenes" on storage.objects
  for insert with check (bucket_id = 'business-images' and auth.role() = 'authenticated');

create policy "Dueños pueden eliminar sus imágenes" on storage.objects
  for delete using (bucket_id = 'business-images' and auth.uid()::text = (storage.foldername(name))[1]);
