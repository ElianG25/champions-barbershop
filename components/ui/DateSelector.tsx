'use client'

import { formatDate } from '@/lib/utils'

type DateSelectorProps = {
  value: string
  onChange: (value: string) => void
  days?: number
}

export function DateSelector({ value, onChange, days = 14 }: DateSelectorProps) {
  const dates = Array.from({ length: days }).map((_, index) => {
    const date = new Date()
    date.setDate(date.getDate() + index)

    const iso = date.toISOString().split('T')[0]

    return {
      iso,
      day: date.toLocaleDateString('es-ES', { weekday: 'short' }),
      number: date.getDate(),
      month: date.toLocaleDateString('es-ES', { month: 'short' }),
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
          Fecha seleccionada: {formatDate(value)}
        </p>
      )}
    </div>
  )
}