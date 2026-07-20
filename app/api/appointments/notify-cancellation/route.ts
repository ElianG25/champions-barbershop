import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { sendTelegramMessage } from '@/lib/telegram'
import { escapeHtml, formatDate, formatTime } from '@/lib/utils'

// Called from the admin panel when a día libre or a bloqueo cancels one or
// more existing appointments in bulk, so staff get a Telegram alert (with a
// ready WhatsApp link per customer) instead of having to notice and notify
// each affected client by hand from the Citas panel.
export async function POST(req: Request) {
  try {
    const { appointmentIds, reason } = await req.json()

    if (!Array.isArray(appointmentIds) || appointmentIds.length === 0) {
      return NextResponse.json({ error: 'Sin citas para notificar.' }, { status: 400 })
    }

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*, services(name), staff(full_name, telegram_chat_id)')
      .in('id', appointmentIds)

    if (error || !appointments) {
      return NextResponse.json({ error: 'No se pudieron cargar las citas.' }, { status: 400 })
    }

    for (const appointment of appointments) {
      const customerName = appointment.customer_name || 'Cliente'
      const phone = String(appointment.customer_phone || '').replace(/\D/g, '')
      const serviceName = appointment.services?.name || 'servicio'
      const workerName = appointment.staff?.full_name || 'Sin asignar'
      const dateText = formatDate(appointment.date)
      const timeText = formatTime(appointment.start_time)
      const reasonText = reason || 'cambio de horario'

      const clientMessage = `Hola, *${customerName}* 👋

Lamentamos informarte que tu cita de *${serviceName}* del ${dateText} a las ${timeText} fue cancelada por el negocio (motivo: ${reasonText}).

Contáctanos cuando gustes para reagendar. Disculpa las molestias.`

      const whatsappLink = `https://wa.me/${phone}?text=${encodeURIComponent(clientMessage)}`

      await sendTelegramMessage(
        `<b>⚠️ CITA CANCELADA POR EL NEGOCIO</b>

👤 <b>Cliente:</b> ${escapeHtml(customerName)}
📞 <b>Teléfono:</b> ${escapeHtml(phone)}
💈 <b>Servicio:</b> ${escapeHtml(serviceName)}
✂️ <b>Barbero:</b> ${escapeHtml(workerName)}
📅 <b>Fecha:</b> ${escapeHtml(dateText)}
🕒 <b>Hora:</b> ${escapeHtml(timeText)}
📝 <b>Motivo:</b> ${escapeHtml(reasonText)}

📲 <b>Notificar por WhatsApp:</b>
<a href="${escapeHtml(whatsappLink)}">Abrir mensaje listo para enviar</a>`,
        appointment.staff?.telegram_chat_id
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Notify cancellation error:', error)

    return NextResponse.json(
      { error: 'Error inesperado notificando la cancelación.' },
      { status: 500 }
    )
  }
}
