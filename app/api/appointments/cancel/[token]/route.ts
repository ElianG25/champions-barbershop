import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { sendTelegramMessage } from '@/lib/telegram'

function escapeHtml(value: string) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params

    if (!token) {
      return NextResponse.json(
        { error: 'Token inválido.' },
        { status: 400 }
      )
    }

    const { data: appointment, error: findError } = await supabase
      .from('appointments')
      .select(`
        *,
        services (
          name
        )
      `)
      .eq('cancel_token', token)
      .in('status', ['pending', 'confirmed'])
      .maybeSingle()

    if (findError || !appointment) {
      return NextResponse.json(
        { error: 'La cita no existe o ya fue cancelada.' },
        { status: 404 }
      )
    }

    const { data: updated, error: updateError } = await supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_source: 'client',
      })
      .eq('id', appointment.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: 'No se pudo cancelar la cita.' },
        { status: 400 }
      )
    }

    const customerName = escapeHtml(appointment.customer_name || 'Cliente')
    const customerPhone = escapeHtml(
      appointment.customer_phone || 'No especificado'
    )
    const serviceName = escapeHtml(
      appointment.services?.name || 'No especificado'
    )
    const appointmentDate = escapeHtml(
      appointment.date || 'No especificada'
    )
    const appointmentHour = escapeHtml(
      String(appointment.start_time || '').slice(0, 5)
    )

    await sendTelegramMessage(
      `<b>❌ CITA CANCELADA</b>

👤 <b>Cliente:</b> ${customerName}
📞 <b>Teléfono:</b> ${customerPhone}
💈 <b>Servicio:</b> ${serviceName}
📅 <b>Fecha:</b> ${appointmentDate}
🕒 <b>Hora:</b> ${appointmentHour}

⚠️ <i>La cita fue cancelada directamente por el cliente desde el enlace de cancelación.</i>`
    )

    return NextResponse.json({
      success: true,
      appointment: updated,
    })
  } catch (error) {
    console.error('Cancel appointment error:', error)

    return NextResponse.json(
      { error: 'Error inesperado cancelando la cita.' },
      { status: 500 }
    )
  }
}