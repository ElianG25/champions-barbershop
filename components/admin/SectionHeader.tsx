export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col justify-between gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-end">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--brand)]">
          {eyebrow}
        </p>

        <h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">
          {title}
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--app-muted)]">
          {description}
        </p>
      </div>

      {action}
    </div>
  )
}