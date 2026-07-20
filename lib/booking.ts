export function timeToMinutes(time: string) {
  const [hours, minutes] = time.slice(0, 5).split(':').map(Number)
  return hours * 60 + minutes
}

export function minutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function generateSlots(start: string, end: string, durationMinutes: number) {
  const slots: string[] = []

  let current = timeToMinutes(start)
  const endMinutes = timeToMinutes(end)

  while (current + durationMinutes <= endMinutes) {
    slots.push(minutesToTime(current))
    current += durationMinutes
  }

  return slots
}

export function rangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
) {
  return timeToMinutes(startA) < timeToMinutes(endB) &&
    timeToMinutes(endA) > timeToMinutes(startB)
}

export function addMinutes(time: string, minutes: number) {
  return minutesToTime(timeToMinutes(time) + minutes)
}

export function getDayOfWeek(date: string) {
  const day = new Date(`${date}T12:00:00`).getDay()
  return day === 0 ? 7 : day
}

export const DEFAULT_TIMEZONE = 'Europe/Madrid'

function getZonedParts(timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date())

  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value || '0')

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour') % 24,
    minute: get('minute'),
    second: get('second'),
  }
}

// Builds a Date whose local getters (getHours, getDay, etc.) reflect the
// wall-clock time in `timeZone`, regardless of the server's own timezone —
// Vercel runs in UTC by default, so comparing against a plain `new Date()`
// would silently misjudge "past" slots and "today" near midnight in Madrid.
export function getZonedNow(timeZone: string = DEFAULT_TIMEZONE) {
  const { year, month, day, hour, minute, second } = getZonedParts(timeZone)
  return new Date(year, month - 1, day, hour, minute, second)
}

export function getZonedToday(timeZone: string = DEFAULT_TIMEZONE) {
  const { year, month, day } = getZonedParts(timeZone)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function isPastDate(date: string, timeZone: string = DEFAULT_TIMEZONE) {
  return date < getZonedToday(timeZone)
}

export function isPastSlot(date: string, time: string, timeZone: string = DEFAULT_TIMEZONE) {
  const cleanTime = String(time).slice(0, 5)
  const [year, month, day] = date.split('-').map(Number)
  const [hours, minutes] = cleanTime.split(':').map(Number)

  const slotDate = new Date(year, month - 1, day, hours, minutes, 0)
  const now = getZonedNow(timeZone)

  return slotDate <= now
}