export function AdminPanel({
  title,
  description,
  action,
  children,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="overflow-hidden border border-white/10 bg-white/10">
      <div className="flex items-start justify-between gap-4 border-b border-white/10 bg-[var(--app-surface)] px-5 py-4">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>

          {description && (
            <p className="mt-1 text-sm text-[var(--app-muted)]">
              {description}
            </p>
          )}
        </div>

        {action}
      </div>

      <div className="bg-[var(--app-surface)]">{children}</div>
    </section>
  )
}