import { formatDate, formatPrice } from './utils'

const baseStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; }
  .container { max-width: 560px; margin: 0 auto; padding: 32px 24px; }
  .header { text-align: center; padding-bottom: 24px; border-bottom: 1px solid #e5e7eb; margin-bottom: 24px; }
  .logo { font-size: 24px; font-weight: 700; color: #4f46e5; }
  .title { font-size: 20px; font-weight: 700; color: #111827; margin: 0 0 8px; }
  .subtitle { font-size: 14px; color: #6b7280; margin: 0; }
  .card { background: #f9fafb; border-radius: 12px; padding: 20px; margin: 20px 0; }
  .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
  .row:last-child { border-bottom: none; }
  .label { color: #6b7280; font-size: 14px; }
  .value { color: #111827; font-size: 14px; font-weight: 500; }
  .cta { display: inline-block; background: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin: 16px 0; }
  .footer { text-align: center; font-size: 12px; color: #9ca3af; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; }
  .status-badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
  .status-pending { background: #fef3c7; color: #92400e; }
  .status-confirmed { background: #d1fae5; color: #065f46; }
  .status-cancelled { background: #fee2e2; color: #991b1b; }
`

function layout(title: string, content: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">✂️ ReservaPro</div>
    </div>
    ${content}
    <div class="footer">
      <p>ReservaPro — Reservas para peluquerías, barberías y centros de estética</p>
      <p>Si tienes dudas, responde a este email.</p>
    </div>
  </div>
</body>
</html>`
}

export function bookingConfirmationClientEmail({
  clientName,
  businessName,
  serviceName,
  date,
  time,
  price,
  address,
  status,
}: {
  clientName: string
  businessName: string
  serviceName: string
  date: string
  time: string
  price: number
  address?: string
  status: string
}) {
  const statusClass = status === 'confirmed' ? 'status-confirmed' : 'status-pending'
  const statusLabel = status === 'confirmed' ? 'Confirmada' : 'Pendiente de confirmación'

  const html = layout(
    'Tu reserva en ReservaPro',
    `
    <h1 class="title">Hola ${clientName},</h1>
    <p class="subtitle">Tu reserva ha sido registrada correctamente.</p>

    <div style="text-align: center; margin: 16px 0;">
      <span class="status-badge ${statusClass}">${statusLabel}</span>
    </div>

    <div class="card">
      <div class="row"><span class="label">Negocio</span><span class="value">${businessName}</span></div>
      <div class="row"><span class="label">Servicio</span><span class="value">${serviceName}</span></div>
      <div class="row"><span class="label">Fecha</span><span class="value">${formatDate(date)}</span></div>
      <div class="row"><span class="label">Hora</span><span class="value">${time}</span></div>
      <div class="row"><span class="label">Precio</span><span class="value">${formatPrice(price)}</span></div>
      ${address ? `<div class="row"><span class="label">Dirección</span><span class="value">${address}</span></div>` : ''}
    </div>

    <p style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/mis-reservas" class="cta">Ver mis reservas</a>
    </p>

    <p style="font-size: 13px; color: #6b7280; text-align: center;">
      ${status === 'pending' ? 'El negocio debe confirmar tu cita. Te avisaremos cuando esté confirmada.' : '¡Nos vemos pronto! Llega 5 minutos antes de tu cita.'}
    </p>
    `
  )

  return {
    subject: `${status === 'confirmed' ? '✅' : '⏳'} Tu reserva en ${businessName} — ${status === 'confirmed' ? 'Confirmada' : 'Pendiente'}`,
    html,
  }
}

export function bookingNotificationBusinessEmail({
  businessName,
  clientName,
  clientEmail,
  clientPhone,
  serviceName,
  date,
  time,
  price,
  notes,
}: {
  businessName: string
  clientName: string
  clientEmail?: string
  clientPhone?: string
  serviceName: string
  date: string
  time: string
  price: number
  notes?: string | null
}) {
  const html = layout(
    'Nueva reserva en tu negocio',
    `
    <h1 class="title">Nueva reserva en ${businessName}</h1>
    <p class="subtitle">Un cliente ha reservado una cita contigo.</p>

    <div class="card">
      <div class="row"><span class="label">Cliente</span><span class="value">${clientName}</span></div>
      ${clientEmail ? `<div class="row"><span class="label">Email</span><span class="value">${clientEmail}</span></div>` : ''}
      ${clientPhone ? `<div class="row"><span class="label">Teléfono</span><span class="value">${clientPhone}</span></div>` : ''}
      <div class="row"><span class="label">Servicio</span><span class="value">${serviceName}</span></div>
      <div class="row"><span class="label">Fecha</span><span class="value">${formatDate(date)}</span></div>
      <div class="row"><span class="label">Hora</span><span class="value">${time}</span></div>
      <div class="row"><span class="label">Precio</span><span class="value">${formatPrice(price)}</span></div>
      ${notes ? `<div class="row"><span class="label">Notas</span><span class="value">${notes}</span></div>` : ''}
    </div>

    <p style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/reservas" class="cta">Gestionar reservas</a>
    </p>

    <p style="font-size: 13px; color: #6b7280; text-align: center;">
      Recuerda confirmar o rechazar la cita desde tu panel de control.
    </p>
    `
  )

  return {
    subject: `📅 Nueva reserva: ${clientName} — ${serviceName} (${formatDate(date)})`,
    html,
  }
}

export function bookingStatusUpdateEmail({
  clientName,
  businessName,
  serviceName,
  date,
  time,
  price,
  status,
}: {
  clientName: string
  businessName: string
  serviceName: string
  date: string
  time: string
  price: number
  status: 'confirmed' | 'cancelled' | 'completed'
}) {
  const statusConfig = {
    confirmed: {
      title: 'Tu cita ha sido confirmada',
      badge: 'status-confirmed',
      label: 'Confirmada',
      message: '¡Tu cita está confirmada! Llega 5 minutos antes. Si necesitas cancelar, hazlo con al menos 24h de antelación.',
    },
    cancelled: {
      title: 'Tu cita ha sido cancelada',
      badge: 'status-cancelled',
      label: 'Cancelada',
      message: 'El negocio ha cancelado tu cita. Puedes reservar otra fecha desde la app.',
    },
    completed: {
      title: 'Tu cita ha sido completada',
      badge: 'status-confirmed',
      label: 'Completada',
      message: '¡Esperamos que hayas quedado satisfecho! Te invitamos a dejar una reseña.',
    },
  }

  const config = statusConfig[status]

  const html = layout(
    config.title,
    `
    <h1 class="title">Hola ${clientName},</h1>
    <p class="subtitle">${config.title}</p>

    <div style="text-align: center; margin: 16px 0;">
      <span class="status-badge ${config.badge}">${config.label}</span>
    </div>

    <div class="card">
      <div class="row"><span class="label">Negocio</span><span class="value">${businessName}</span></div>
      <div class="row"><span class="label">Servicio</span><span class="value">${serviceName}</span></div>
      <div class="row"><span class="label">Fecha</span><span class="value">${formatDate(date)}</span></div>
      <div class="row"><span class="label">Hora</span><span class="value">${time}</span></div>
      <div class="row"><span class="label">Precio</span><span class="value">${formatPrice(price)}</span></div>
    </div>

    <p style="font-size: 13px; color: #6b7280; text-align: center;">
      ${config.message}
    </p>

    <p style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/mis-reservas" class="cta">Ver mis reservas</a>
    </p>
    `
  )

  const emoji = status === 'confirmed' ? '✅' : status === 'cancelled' ? '❌' : '✅'
  return {
    subject: `${emoji} ${config.label}: ${serviceName} en ${businessName}`,
    html,
  }
}

export function welcomeEmail({
  name,
  role,
}: {
  name: string
  role: 'client' | 'business'
}) {
  const isBusiness = role === 'business'

  const html = layout(
    'Bienvenido a ReservaPro',
    `
    <h1 class="title">¡Hola ${name}!</h1>
    <p class="subtitle">Bienvenido a ReservaPro.</p>

    <p style="margin: 24px 0; color: #374151;">
      ${isBusiness
        ? 'Estos son los siguientes pasos para empezar a recibir reservas:'
        : 'Ya puedes empezar a reservar citas en los mejores salones:'}
    </p>

    <div class="card">
      ${isBusiness
        ? `
      <div class="row"><span class="value">1. Completa tu perfil de negocio</span></div>
      <div class="row"><span class="value">2. Añade tus servicios y precios</span></div>
      <div class="row"><span class="value">3. Configura tus horarios de apertura</span></div>
      <div class="row"><span class="value">4. Activa tu suscripción</span></div>
      `
        : `
      <div class="row"><span class="value">1. Explora negocios cerca de ti</span></div>
      <div class="row"><span class="value">2. Elige tu servicio y reserva</span></div>
      <div class="row"><span class="value">3. Recibe confirmación por email</span></div>
      <div class="row"><span class="value">4. Disfruta de tu cita</span></div>
      `}
    </div>

    <p style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}${isBusiness ? '/dashboard/onboarding' : '/negocios'}" class="cta">${isBusiness ? 'Configurar mi negocio' : 'Buscar negocios'}</a>
    </p>

    <p style="font-size: 13px; color: #6b7280; text-align: center; margin-top: 24px;">
      ¿Tienes dudas? Responde a este email y te ayudamos.
    </p>
    `
  )

  return {
    subject: `✂️ Bienvenido a ReservaPro, ${name}`,
    html,
  }
}

export function bookingReminderEmail({
  clientName,
  businessName,
  serviceName,
  date,
  time,
  address,
  phone,
}: {
  clientName: string
  businessName: string
  serviceName: string
  date: string
  time: string
  address?: string
  phone?: string
}) {
  const html = layout(
    'Recordatorio de tu cita',
    `
    <h1 class="title">Hola ${clientName},</h1>
    <p class="subtitle">Te recordamos que mañana tienes una cita reservada.</p>

    <div style="text-align: center; margin: 16px 0;">
      <span class="status-badge status-confirmed">Mañana</span>
    </div>

    <div class="card">
      <div class="row"><span class="label">Negocio</span><span class="value">${businessName}</span></div>
      <div class="row"><span class="label">Servicio</span><span class="value">${serviceName}</span></div>
      <div class="row"><span class="label">Fecha</span><span class="value">${formatDate(date)}</span></div>
      <div class="row"><span class="label">Hora</span><span class="value">${time}</span></div>
      ${address ? `<div class="row"><span class="label">Dirección</span><span class="value">${address}</span></div>` : ''}
      ${phone ? `<div class="row"><span class="label">Teléfono</span><span class="value">${phone}</span></div>` : ''}
    </div>

    <p style="font-size: 13px; color: #6b7280; text-align: center; margin: 16px 0;">
      Te recomendamos llegar 5 minutos antes. Si necesitas cancelar o modificar tu cita, hazlo con al menos 24 horas de antelación.
    </p>

    <p style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/mis-reservas" class="cta">Ver mis reservas</a>
    </p>
    `
  )

  return {
    subject: `📅 Recordatorio: Tu cita en ${businessName} es mañana`,
    html,
  }
}
