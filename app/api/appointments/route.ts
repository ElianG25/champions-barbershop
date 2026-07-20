import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { DEFAULT_TIMEZONE, getZonedToday, isPastDate, isPastSlot } from '@/lib/booking'
import { getAvailableSlots } from '@/lib/availability'
import { sendTelegramMessage } from '@/lib/telegram'
import { escapeHtml, formatDate, formatTime } from '@/lib/utils'

function getClientIp(req: Request) {
  const forwardedFor = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')

  if (forwardedFor) return forwardedFor.split(',')[0].trim()
  if (realIp) return realIp.trim()

  return 'unknown'
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const clientIp = getClientIp(req)
    const userAgent = req.headers.get('user-agent') || 'unknown'

    const {
      service_id,
      worker_id,
      customer_name,
      customer_phone,
      customer_email,
      date,
      start_time,
      end_time,
      notes,
      device_fingerprint,
      language,
    } = body

    const bookingLanguage = language === 'en' ? 'en' : 'es'

    const normalizedPhone = String(customer_phone || '').replace(/\D/g, '')

    const deviceFingerprint =
      typeof device_fingerprint === 'string' && device_fingerprint.trim()
        ? device_fingerprint.trim()
        : `${clientIp}:${userAgent}`

    if (
      !service_id ||
      !worker_id ||
      !customer_name ||
      !customer_phone ||
      !date ||
      !start_time ||
      !end_time
    ) {
      return NextResponse.json(
        { error: 'Faltan datos obligatorios.' },
        { status: 400 }
      )
    }

    const { data: business } = await supabase
      .from('business_settings')
      .select('*')
      .single()

    if (!business?.booking_enabled) {
      return NextResponse.json(
        { error: 'Las reservas no están disponibles ahora mismo.' },
        { status: 400 }
      )
    }

    const timeZone = business.timezone || DEFAULT_TIMEZONE

    if (isPastDate(date, timeZone) || isPastSlot(date, start_time, timeZone)) {
      return NextResponse.json(
        { error: 'No puedes reservar una fecha u hora pasada.' },
        { status: 400 }
      )
    }

    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('*')
      .eq('id', service_id)
      .eq('is_active', true)
      .single()

    if (serviceError || !service) {
      return NextResponse.json(
        { error: 'Servicio no disponible.' },
        { status: 400 }
      )
    }

    const { data: worker, error: workerError } = await supabase
      .from('staff')
      .select('*')
      .eq('id', worker_id)
      .eq('is_worker', true)
      .eq('is_active', true)
      .single()

    if (workerError || !worker) {
      return NextResponse.json(
        { error: 'Barbero no disponible.' },
        { status: 400 }
      )
    }

    const slotsResult = await getAvailableSlots(date, service.duration_minutes, worker_id, undefined, timeZone)

    if (slotsResult.status !== 'ok' || !slotsResult.slots.includes(start_time)) {
      return NextResponse.json(
        { error: 'Ese horario ya no está disponible con este barbero.' },
        { status: 400 }
      )
    }

    const today = getZonedToday(timeZone)

    const { data: recentBookings, error: recentBookingsError } = await supabase
      .from('appointments')
      .select('id, date, customer_phone, customer_ip, device_fingerprint, status')
      .gte('date', today)
      .in('status', ['pending', 'confirmed'])

    if (recentBookingsError) {
      return NextResponse.json(
        { error: 'No se pudo validar el límite de reservas.' },
        { status: 400 }
      )
    }

    const sameIpBookings = (recentBookings || []).filter(
      (appointment) => appointment.customer_ip === clientIp
    )

    const sameDeviceBookings = (recentBookings || []).filter(
      (appointment) => appointment.device_fingerprint === deviceFingerprint
    )

    const samePhoneBookings = (recentBookings || []).filter(
      (appointment) =>
        String(appointment.customer_phone || '').replace(/\D/g, '') === normalizedPhone
    )

    if (
      sameIpBookings.length >= 3 ||
      sameDeviceBookings.length >= 2 ||
      samePhoneBookings.length >= 2
    ) {
      return NextResponse.json(
        {
          error:
            'Has alcanzado el límite de reservas activas permitidas. Contacta al negocio para más asistencia.',
        },
        { status: 429 }
      )
    }

    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        service_id,
        worker_id,
        customer_name,
        customer_phone: normalizedPhone,
        customer_email,
        date,
        start_time,
        end_time,
        status: business.auto_confirm_appointments ? 'confirmed' : 'pending',
        notes: notes || null,
        customer_ip: clientIp,
        device_fingerprint: deviceFingerprint,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'No se pudo crear la reserva. Intenta nuevamente.' },
        { status: 400 }
      )
    }
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
    const cancelUrl = `${siteUrl}/cancelar-cita/${appointment.cancel_token}${bookingLanguage === 'en' ? '?lang=en' : ''}`

    const customerNameText = customer_name || 'Cliente'
    const businessNameText = business.name || 'el negocio'
    const serviceNameText = service.name || 'servicio'
    const workerNameText = worker.full_name || 'Sin asignar'
    const appointmentDateText = formatDate(date || 'fecha no especificada')
    const appointmentHourText = formatTime(appointment.start_time || 'No especificada')
    const phoneText = normalizedPhone || 'No especificado'

    const clientMessage =
      bookingLanguage === 'en'
        ? `Hi, *${customerNameText}* 👋

✅ We have confirmed your appointment at *${businessNameText}* 💈

💇🏼‍♂️ *Service:* ${serviceNameText}
💈 *Barber:* ${workerNameText}
📅 *Date:* ${appointmentDateText}
🕒 *Time:* ${appointmentHourText}

You can ignore this message if you confirm your attendance.

🚨 If you need to cancel your appointment due to an emergency, visit this link:

${cancelUrl}`
        : `Hola, *${customerNameText}* 👋

✅ Hemos confirmado tu cita en *${businessNameText}* 💈

💇🏼‍♂️ *Servicio:* ${serviceNameText}
💈 *Barbero:* ${workerNameText}
📅 *Fecha:* ${appointmentDateText}
🕒 *Hora:* ${appointmentHourText}

Puedes ignorar este mensaje si confirmas tu asistencia.

🚨 Si necesitas cancelar tu cita por alguna emergencia, visita este enlace:

${cancelUrl}`

    const whatsappLink = `https://wa.me/${phoneText}?text=${encodeURIComponent(clientMessage)}`

    await sendTelegramMessage(
      `<b>🆕 TIENES UNA NUEVA CITA</b>

👤 <b>Cliente:</b> ${escapeHtml(customerNameText)}
📞 <b>Teléfono:</b> ${escapeHtml(phoneText)}
💈 <b>Servicio:</b> ${escapeHtml(serviceNameText)}
✂️ <b>Barbero:</b> ${escapeHtml(workerNameText)}
📅 <b>Fecha:</b> ${escapeHtml(appointmentDateText)}
🕒 <b>Hora:</b> ${escapeHtml(appointmentHourText)}

📲 <b>Notificar por WhatsApp:</b>
<a href="${escapeHtml(whatsappLink)}">Abrir mensaje listo para enviar</a>`,
      worker.telegram_chat_id
    )

    return NextResponse.json(appointment)
  } catch (error) {
    console.error('Appointment API error:', error)

    return NextResponse.json(
      { error: 'Error inesperado creando la reserva.' },
      { status: 500 }
    )
  }
}