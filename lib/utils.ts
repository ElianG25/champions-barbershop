export function formatCurrency(value: number, currency = 'EUR') {
  const localeByCurrency: Record<string, string> = {
    EUR: 'es-ES',
    USD: 'en-US',
    DOP: 'en-US',
  }

  return new Intl.NumberFormat(localeByCurrency[currency] || 'en-US', {
    style: 'currency',
    currency,
  }).format(value)
}

export function formatTime(time: string, format: '12h' | '24h' = '24h') {
  const clean = String(time).slice(0, 5)

  if (format === '24h') return clean

  const [hours, minutes] = clean.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12

  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${date}T12:00:00`))
}