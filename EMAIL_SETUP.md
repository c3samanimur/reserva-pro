# Configuración Completa de Emails — ReservaPro

## Resumen de emails implementados

| Evento | Destinatario | Descripción |
|--------|-------------|-------------|
| **Registro de cuenta** | Usuario nuevo | Bienvenida personalizada (cliente o negocio) |
| **Confirmación de cuenta** | Usuario nuevo | Email de verificación (vía Supabase Auth SMTP) |
| **Recuperar contraseña** | Usuario existente | Link para resetear contraseña (vía Supabase Auth SMTP) |
| **Nueva reserva** | Cliente | Confirmación de reserva con detalles |
| **Nueva reserva** | Negocio | Notificación de nueva cita con datos del cliente |
| **Confirmar reserva** | Cliente | Tu cita ha sido confirmada por el negocio |
| **Cancelar reserva** | Cliente | Tu cita ha sido cancelada |
| **Completar reserva** | Cliente | Tu cita ha sido completada |
| **Recordatorio** | Cliente | 1 día antes de la cita — recordatorio con detalles |

---

## Paso 1: Crear cuenta en Resend

1. Ve a https://resend.com
2. Regístrate con tu email de Google o email corporativo
3. Verifica tu email
4. Ve a **API Keys** → **Create API Key**
5. Copia la clave (empieza por `re_`)

### Pegar la API key en el proyecto

Edita `.env.local`:

```bash
RESEND_API_KEY=re_tu_clave_aqui
FROM_EMAIL=onboarding@resend.dev
```

> **Nota**: `onboarding@resend.dev` funciona solo para enviar emails a tu propia cuenta de Resend (pruebas). Cuando compres dominio, cambia esto.

---

## Paso 2: Configurar SMTP en Supabase Auth (OBLIGATORIO)

Esto activa los emails de **confirmación de cuenta** y **recuperación de contraseña**.

### 2.1 Activar confirmación de email (opcional pero recomendado)

1. Panel de Supabase: https://supabase.com/dashboard/project/tytrxvrgtwtcjgxptbmw
2. Ve a **Authentication** → **Providers** → **Email**
3. Activa **"Confirm email"** (Enable email confirmations) — toggle azul
4. En **Confirmation email**, usa este template:

```html
<h2>Confirma tu cuenta en ReservaPro</h2>
<p>Haz clic en el botón de abajo para verificar tu email:</p>
<p><a href="{{ .ConfirmationURL }}">Confirmar mi cuenta</a></p>
<p>Si no creaste esta cuenta, ignora este email.</p>
```

### 2.2 Configurar SMTP settings

En la misma página (**Authentication** → **Providers** → **Email**), busca **SMTP settings** y pon:

| Campo | Valor |
|-------|-------|
| **SMTP Host** | `smtp.resend.com` |
| **SMTP Port** | `465` |
| **SMTP User** | `resend` |
| **SMTP Password** | Tu API key de Resend (`re_...`) |
| **Sender name** | `ReservaPro` |
| **Sender email** | `onboarding@resend.dev` |

Haz clic en **Save**.

### 2.3 Configurar email de recuperación de contraseña

En la misma página, busca **Password Reset** y pon este template:

```html
<h2>Restablecer contraseña</h2>
<p>Has solicitado restablecer tu contraseña de ReservaPro.</p>
<p><a href="{{ .ConfirmationURL }}">Restablecer mi contraseña</a></p>
<p>Si no solicitaste esto, ignora este email.</p>
```

---

## Paso 3: Probar el sistema de emails

### 3.1 Registro de cuenta

1. Ve a `http://localhost:3000/registro`
2. Crea una cuenta nueva con un email real tuyo
3. Si activaste confirmación por email: revisa tu bandeja y confirma
4. Si desactivaste confirmación: el registro es instantáneo y recibirás email de bienvenida

### 3.2 Recuperar contraseña

1. Ve a `http://localhost:3000/recuperar`
2. Pon tu email
3. Revisa tu bandeja — debería llegar un email con link para resetear

### 3.3 Reserva de cita

1. Inicia sesión como cliente
2. Ve a un negocio y reserva un servicio
3. El cliente recibe: email de confirmación de reserva
4. El negocio recibe: email de notificación de nueva reserva

### 3.4 Confirmar/rechazar reserva (como negocio)

1. Inicia sesión como negocio
2. Ve a **Dashboard** → **Reservas**
3. Confirma una reserva pendiente
4. El cliente recibe: email de "tu cita ha sido confirmada"

### 3.5 Recordatorios

Los recordatorios se envían **1 día antes** de la cita. Para probarlos:

**Opción A — Manual (desarrollo):**

Crea una reserva para **mañana** y luego llama al endpoint:

```bash
curl -X POST http://localhost:3000/api/bookings/reminders \
  -H "Content-Type: application/json"
```

**Opción B — Automático (producción):**

Configura un cron job que llame al endpoint diariamente.

---

## Paso 4: Configurar recordatorios automáticos (producción)

En producción necesitas ejecutar `/api/bookings/reminders` una vez al día.

### Opción A: Vercel Cron Jobs (si deployas en Vercel)

Añade a tu `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/bookings/reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

Esto ejecuta todos los días a las 9:00 AM.

### Opción B: Supabase Edge Function + pg_cron

1. Activa la extensión `pg_cron` en Supabase
2. Crea un cron job en SQL:

```sql
SELECT cron.schedule(
  'booking-reminders',
  '0 9 * * *',
  $$ SELECT net.http_post(
    url:='https://TU_DOMINIO.com/api/bookings/reminders',
    headers:='{"Authorization": "Bearer TU_CRON_SECRET"}'::jsonb
  ) $$ 
);
```

### Opción C: Servicio externo (cron-job.org)

1. Ve a https://cron-job.org (gratis)
2. Crea un cron job cada 24 horas
3. URL: `https://TU_DOMINIO.com/api/bookings/reminders`
4. Método: POST
5. Opcional: añade header `Authorization: Bearer TU_CRON_SECRET`

---

## Paso 5: Verificar dominio en Resend (para producción real)

Cuando tengas un dominio propio (ej: `reservapro.com`):

1. En Resend, ve a **Domains** → **Add Domain**
2. Añade `reservapro.com`
3. Resend te dará 3 registros DNS:
   - **SPF**: `_spf.resend.com`
   - **DKIM**: Clave larga que empieza por `p=MIGfMA0GCS...`
   - **DMARC**: `v=DMARC1; p=quarantine;`
4. Ve a tu registrador de dominios (Namecheap, Cloudflare, etc.) y añade esos registros DNS
5. Vuelve a Resend y haz clic en **Verify**
6. Espera de 5 minutos a 24 horas

### Actualizar configuración

Una vez verificado, cambia en `.env.local`:

```bash
FROM_EMAIL=noreply@reservapro.com
```

Y en Supabase Auth SMTP, cambia **Sender email** a `noreply@reservapro.com`.

---

## Troubleshooting

| Problema | Causa | Solución |
|----------|-------|----------|
| `RESEND_API_KEY not configured` | Clave no pegada en `.env.local` | Pegar `re_...` real |
| Emails no llegan a bandeja | En spam o dominio no verificado | Revisar spam; verificar dominio en Resend |
| Error de SMTP en Supabase | Puerto o credenciales mal | Usar puerto **465**, usuario `resend`, pass = API key |
| Confirmación de cuenta no llega | Confirmación desactivada en Supabase | Activar en Auth → Providers → Email → Confirm email |
| Recuperar contraseña no funciona | Template vacío o SMTP mal | Revisar template y configuración SMTP |
| Recordatorios no se envían | Cron no configurado o `CRON_SECRET` mal | Configurar cron externo; revisar secret |

---

## Flujo completo de un usuario nuevo

1. **Registra cuenta** → Recibe email de bienvenida
2. (Si confirmación activa) → Recibe email de verificación → Clica link → Cuenta activa
3. **Reserva cita** → Recibe email con detalles de la reserva
4. **Negocio confirma** → Recibe email "tu cita está confirmada"
5. **1 día antes** → Recibe email recordatorio
6. **Después de la cita** → Recibe email "cita completada, deja una reseña"
7. **Olvida contraseña** → Recibe email con link para resetear

---

## Archivos relacionados

- `lib/email.ts` — Cliente Resend
- `lib/email-templates.ts` — Templates HTML
- `app/api/welcome/route.ts` — Bienvenida
- `app/api/bookings/notify/route.ts` — Notificación de nueva reserva
- `app/api/bookings/status-notify/route.ts` — Actualización de estado
- `app/api/bookings/reminders/route.ts` — Recordatorios automáticos
- `.env.local` — Variables de entorno
