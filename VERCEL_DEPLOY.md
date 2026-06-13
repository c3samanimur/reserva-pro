# Guía de Despliegue en Vercel — ReservaPro

## Paso 1: Conectar GitHub con Vercel

1. Ve a https://vercel.com
2. Regístrate con tu cuenta de GitHub (o email)
3. Click en **"Add New Project"**
4. Selecciona tu repo `reserva-pro` (si no aparece, click en "Import Git Repository")
5. Vercel detectará automáticamente que es un proyecto Next.js

## Paso 2: Configurar Variables de Entorno

En el panel de Vercel, antes de hacer deploy, ve a **Settings → Environment Variables** y añade estas:

### Obligatorias (para que funcione todo)

| Variable | Valor | Ejemplo |
|----------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase | `https://tytrxvrgtwtcjgxptbmw.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Key `anon` de Supabase | `eyJhbGci...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Key `service_role` de Supabase | `eyJhbGci...` |
| `NEXT_PUBLIC_APP_URL` | Tu dominio en Vercel | `https://reserva-pro.vercel.app` |
| `RESEND_API_KEY` | API key de Resend | `re_...` |
| `FROM_EMAIL` | Email de envío | `onboarding@resend.dev` |
| `CRON_SECRET` | Secreto para cron jobs | `openssl rand -base64 32` |

### Solo para pagos (Stripe)

| Variable | Valor | Ejemplo |
|----------|-------|---------|
| `STRIPE_SECRET_KEY` | Secret key de Stripe | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Webhook secret de Stripe | `whsec_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Publishable key | `pk_live_...` |
| `STRIPE_PRICE_ID` | ID del precio de suscripción | `price_...` |

## Paso 3: Deploy

1. Click en **Deploy**
2. Vercel compilará tu proyecto (~2 minutos)
3. Obtendrás un dominio: `https://reserva-pro.vercel.app` (o similar)

## Paso 4: Configurar Dominio y URLs

### Actualizar en Supabase Auth
1. Ve a Supabase → Authentication → URL Configuration
2. Añade tu dominio de Vercel en "Site URL"
3. Añade `https://reserva-pro.vercel.app` en "Redirect URLs"

### Actualizar en Stripe (si tienes pagos)
1. Ve a Stripe Dashboard → Webhooks
2. Añade endpoint: `https://reserva-pro.vercel.app/api/stripe/webhook`
3. Selecciona eventos:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
4. Copia el `Signing secret` y pégalo en Vercel como `STRIPE_WEBHOOK_SECRET`

### Actualizar en Resend
1. Ve a Resend → Domains
2. Añade tu dominio y verifica los registros DNS
3. Actualiza `FROM_EMAIL` en Vercel a tu dominio verificado

## Paso 5: Ejecutar Migración SQL en Supabase

Abre el SQL Editor de Supabase y ejecuta el archivo:

```bash
supabase/migrations/001_security_and_constraints.sql
```

Esto añade:
- RLS policies (seguridad)
- Constraints únicos (no overbooking, slugs únicos)
- Tabla `rate_limits` para serverless

## Paso 6: Verificar Funcionamiento

Prueba estas funcionalidades en tu dominio de Vercel:

1. ✅ Registro de usuario
2. ✅ Login
3. ✅ Recuperar contraseña
4. ✅ Crear negocio (onboarding)
5. ✅ Reservar cita
6. ✅ Emails (bienvenida, confirmación)
7. ✅ Recordatorios automáticos (cron job)

## Comandos útiles

```bash
# Para ver logs en Vercel
vercel logs --app reserva-pro

# Para deploy manual
vercel --prod

# Para variables de entorno local
vercel env pull .env.local
```

## Solución de Problemas

### Error: "Stripe is not configured"
- Significa que las variables de Stripe son placeholders
- La app funciona sin pagos (modo demo)
- Para activar pagos: configura las variables de Stripe reales

### Error: "Too many requests"
- El rate limiter funciona correctamente
- Espera 1 minuto entre intentos

### Error: "Unauthorized" en cron job
- Asegúrate de que `CRON_SECRET` está configurado en Vercel
- El cron job se ejecuta automáticamente sin auth header

### Emails no llegan
- Verifica `RESEND_API_KEY` en Vercel
- Si usas `onboarding@resend.dev`, solo funciona para tu email de Resend
- Verifica en spam

## Contacto

Si tienes problemas, revisa:
- Vercel logs: `https://vercel.com/dashboard`
- Supabase logs: `https://supabase.com/dashboard/project/.../logs`
- Stripe logs: `https://dashboard.stripe.com/events`
