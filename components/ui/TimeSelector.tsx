'use client'

import { formatTime } from '@/lib/utils'

type TimeSelectorProps = {
  value: string
  options: string[]
  onChange: (value: string) => void
  timeFormat?: '12h' | '24h'
}

export function TimeSelector({
  value,
  options,
  onChange,
  timeFormat = '24h',
}: TimeSelectorProps) {
  if (options.length === 0) {
    return (
      <p className="text-sm text-[var(--app-muted)]">
        No hay horarios disponibles.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-4 lg:grid-cols-5">
      {options.map((time) => {
        const active = value === time

        return (
          <button
            key={time}
            type="button"
            onClick={() => onChange(time)}
            className={`px-3 py-4 text-sm font-semibold transition hover:-translate-y-0.5 active:translate-y-0 ${
              active
                ? 'bg-[var(--brand)] text-[var(--app-bg)]'
                : 'bg-[var(--app-surface)] text-[var(--app-text)] hover:bg-white/[0.08]'
            }`}
          >
            {formatTime(time, timeFormat)}
          </button>
        )
      })}
    </div>
  )
}