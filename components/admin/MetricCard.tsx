export function MetricCard({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode
  label: string
  value: string | number
}) {
  return (
    <div className="bg-[var(--app-surface)] p-5">
      {icon && <div className="mb-4 text-[var(--brand)]">{icon}</div>}

      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--app-muted)]">
        {label}
      </p>

      <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
        {value}
      </p>
    </div>
  )
}