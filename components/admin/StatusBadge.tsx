export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'border-yellow-400/30 text-yellow-300 bg-yellow-400/10',
    confirmed: 'border-emerald-400/30 text-emerald-300 bg-emerald-400/10',
    completed: 'border-neutral-400/30 text-neutral-300 bg-neutral-400/10',
    cancelled: 'border-red-400/30 text-red-300 bg-red-400/10',
  }

  const labels: Record<string, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    completed: 'Completada',
    cancelled: 'Cancelada',
  }

  return (
    <span
      className={`inline-flex border px-2.5 py-1 text-xs font-semibold ${
        styles[status] || 'border-white/10 text-[var(--app-muted)]'
      }`}
    >
      {labels[status] || status}
    </span>
  )
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex border px-2.5 py-1 text-xs font-semibold ${
        active
          ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
          : 'border-white/10 bg-white/[0.04] text-[var(--app-muted)]'
      }`}
    >
      {active ? 'Activo' : 'Inactivo'}
    </span>
  )
}