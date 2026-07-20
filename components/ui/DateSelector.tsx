'use client'

import { formatDate } from '@/lib/utils'
import { DEFAULT_TIMEZONE, getZonedToday } from '@/lib/booking'

type DateSelectorProps = {
  value: string
  onChange: (value: string) => void
  days?: number
  timeZone?: string
  language?: 'es' | 'en'
}

export function DateSelector({
  value,
  onChange,
  days = 14,
  timeZone = DEFAULT_TIMEZONE,
  language = 'es',
}: DateSelectorProps) {
  const locale = language === 'en' ? 'en-US' : 'es-ES'
  const todayStr = getZonedToday(timeZone)

  const dates = Array.from({ length: days }).map((_, index) => {
    const date = new Date(`${todayStr}T00:00:00`)
    date.setDate(date.getDate() + index)

    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

    return {
      iso,
      day: date.toLocaleDateString(locale, { weekday: 'short' }),
      number: date.getDate(),
      month: date.toLocaleDateString(locale, { month: 'short' }),
    }
  })

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max gap-2">
        {dates.map((date) => {
          const active = value === date.iso

          return (
            <button
              key={date.iso}
              type="button"
              onClick={() => onChange(date.iso)}
              className={`min-w-[92px] border px-4 py-4 text-left transition hover:-translate-y-0.5 active:translate-y-0 ${
                active
                  ? 'border-[var(--brand)] bg-[var(--brand)] text-[var(--app-bg)]'
                  : 'border-white/10 bg-white/[0.04] text-[var(--app-text)] hover:border-[var(--brand)]'
              }`}
            >
              <span className="block text-xs font-semibold uppercase opacity-70">
                {date.day}
              </span>
              <span className="mt-1 block text-2xl font-semibold">
                {date.number}
              </span>
              <span className="mt-1 block text-xs font-semibold uppercase opacity-70">
                {date.month}
              </span>
            </button>
          )
        })}
      </div>

      {value && (
        <p className="mt-3 text-sm text-[var(--app-muted)]">
          {language === 'en' ? 'Selected date:' : 'Fecha seleccionada:'} {formatDate(value, language)}
        </p>
      )}
    </div>
  )
}