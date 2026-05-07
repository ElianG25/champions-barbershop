import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { getDayOfWeek, isPastDate, isPastSlot, rangesOverlap } from '@/lib/booking'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      service_id,
      customer_name,
      customer_phone,
      customer_email,
      date,
      start_time,
      end_time,
      notes,
    } = body

    if (
      !service_id ||
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

    if (isPastDate(date) || isPastSlot(date, start_time)) {
      return NextResponse.json(
        { error: 'No puedes reservar una fecha u hora pasada.' },
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

    const { data: dayOff } = await supabase
      .from('days_off')
      .select('*')
      .eq('date', date)
      .maybeSingle()

    if (dayOff) {
      return NextResponse.json(
        { error: `Este día no está disponible. Motivo: ${dayOff.reason}` },
        { status: 400 }
      )
    }

    const dayOfWeek = getDayOfWeek(date)

    const { data: rules } = await supabase
      .from('availability_rules')
      .select('*')
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)

    if (!rules || rules.length === 0) {
      return NextResponse.json(
        { error: 'No hay horario disponible ese día.' },
        { status: 400 }
      )
    }

    const isInsideWorkHours = rules.some((rule) => {
      const ruleStart = String(rule.start_time).slice(0, 5)
      const ruleEnd = String(rule.end_time).slice(0, 5)

      return start_time >= ruleStart && end_time <= ruleEnd
    })

    if (!isInsideWorkHours) {
      return NextResponse.json(
        { error: 'La hora seleccionada está fuera del horario laboral.' },
        { status: 400 }
      )
    }

    const { data: breaks } = await supabase
      .from('breaks')
      .select('*')
      .eq('date', date)
      .eq('is_active', true)

    const overlapsBreak = (breaks || []).some((breakItem) =>
      rangesOverlap(
        start_time,
        end_time,
        String(breakItem.start_time).slice(0, 5),
        String(breakItem.end_time).slice(0, 5)
      )
    )

    if (overlapsBreak) {
      return NextResponse.json(
        { error: 'Ese horario coincide con un descanso.' },
        { status: 400 }
      )
    }

    const { data: appointments } = await supabase
      .from('appointments')
      .select('*')
      .eq('date', date)
      .in('status', ['pending', 'confirmed'])

    const overlapsAppointment = (appointments || []).some((appointment) =>
      rangesOverlap(
        start_time,
        end_time,
        String(appointment.start_time).slice(0, 5),
        String(appointment.end_time).slice(0, 5)
      )
    )

    if (overlapsAppointment) {
      return NextResponse.json(
        { error: 'Ese horario ya fue reservado.' },
        { status: 400 }
      )
    }

    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        service_id,
        customer_name,
        customer_phone,
        customer_email,
        date,
        start_time,
        end_time,
        status: business.auto_confirm_appointments ? 'confirmed' : 'pending',
        notes: notes || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'No se pudo crear la reserva. Intenta nuevamente.' },
        { status: 400 }
      )
    }

    return NextResponse.json(appointment)
  } catch (error) {
    console.error('Appointment API error:', error)

    return NextResponse.json(
      { error: 'Error inesperado creando la reserva.' },
      { status: 500 }
    )
  }
}