import { supabase } from '@/lib/supabaseClient'
import { addMinutes, generateSlots, getDayOfWeek, isPastSlot, rangesOverlap } from '@/lib/booking'
import type { AvailabilityRule, Break, Appointment, DayOff } from '@/types/database'

export type SlotsResult =
  | { status: 'ok'; slots: string[] }
  | { status: 'day-off'; reason: string | null }
  | { status: 'closed' }
  | { status: 'error' }
  | { status: 'invalid-duration' }

export async function getAvailableSlots(
  date: string,
  durationMinutes: number,
  workerId: string,
  excludeAppointmentId?: string
): Promise<SlotsResult> {
  if (!durationMinutes || durationMinutes <= 0) {
    return { status: 'invalid-duration' }
  }

  if (!workerId) {
    return { status: 'error' }
  }

  const dayOfWeek = getDayOfWeek(date)

  const { data: dayOffRaw } = await supabase
    .from('days_off')
    .select('*')
    .eq('date', date)
    .or(`worker_id.is.null,worker_id.eq.${workerId}`)
    .maybeSingle()

  const dayOff = dayOffRaw as DayOff | null

  if (dayOff) {
    return { status: 'day-off', reason: dayOff.reason }
  }

  const { data: rules, error: rulesError } = await supabase
    .from('availability_rules')
    .select('*')
    .eq('day_of_week', dayOfWeek)
    .eq('worker_id', workerId)
    .returns<AvailabilityRule[]>()

  if (rulesError) {
    return { status: 'error' }
  }

  const activeRules = (rules || []).filter((rule) => rule.is_active !== false)

  if (activeRules.length === 0) {
    return { status: 'closed' }
  }

  const { data: breaks } = await supabase
    .from('breaks')
    .select('*')
    .eq('worker_id', workerId)
    .or(`date.eq.${date},day_of_week.eq.${dayOfWeek}`)
    .returns<Break[]>()

  const activeBreaks = (breaks || []).filter((b) => b.is_active !== false)

  let appointmentsQuery = supabase
    .from('appointments')
    .select('*')
    .eq('date', date)
    .eq('worker_id', workerId)
    .in('status', ['pending', 'confirmed'])

  if (excludeAppointmentId) {
    appointmentsQuery = appointmentsQuery.neq('id', excludeAppointmentId)
  }

  const { data: appointments } = await appointmentsQuery.returns<Appointment[]>()

  let allSlots: string[] = []

  for (const rule of activeRules) {
    const start = String(rule.start_time).slice(0, 5)
    const end = String(rule.end_time).slice(0, 5)
    allSlots = [...allSlots, ...generateSlots(start, end, durationMinutes)]
  }

  const available = allSlots.filter((slot) => {
    if (isPastSlot(date, slot)) return false

    const slotEnd = addMinutes(slot, durationMinutes)

    const overlapsBreak = activeBreaks.some((b) =>
      rangesOverlap(slot, slotEnd, String(b.start_time).slice(0, 5), String(b.end_time).slice(0, 5))
    )

    const overlapsAppointment = (appointments || []).some((a) =>
      rangesOverlap(slot, slotEnd, String(a.start_time).slice(0, 5), String(a.end_time).slice(0, 5))
    )

    return !overlapsBreak && !overlapsAppointment
  })

  return { status: 'ok', slots: [...new Set(available)].sort() }
}
