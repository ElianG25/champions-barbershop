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

export function isPastDate(date: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const selected = new Date(`${date}T00:00:00`)
  return selected < today
}

export function isPastSlot(date: string, time: string) {
  const cleanTime = String(time).slice(0, 5)
  const [year, month, day] = date.split('-').map(Number)
  const [hours, minutes] = cleanTime.split(':').map(Number)

  const slotDate = new Date(year, month - 1, day, hours, minutes, 0)
  const now = new Date()

  return slotDate <= now
}