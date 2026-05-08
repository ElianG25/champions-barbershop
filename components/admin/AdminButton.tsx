export function AdminButton({
  children,
  onClick,
  tone = 'brand',
  primary = false,
  full = false,
  disabled = false,
  icon,
}: {
  children: React.ReactNode
  onClick?: () => void
  tone?: 'brand' | 'success' | 'danger'
  primary?: boolean
  full?: boolean
  disabled?: boolean
  icon?: React.ReactNode
}) {
  const toneClasses = {
    brand: 'border-[var(--brand)] text-[var(--brand)] hover:bg-white/[0.06]',
    success: 'border-emerald-400/30 text-emerald-300 hover:bg-emerald-400/10',
    danger: 'border-red-400/30 text-red-300 hover:bg-red-400/10',
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${full ? 'w-full' : ''} ${
        primary
          ? 'border border-[var(--brand)] bg-[var(--brand)] text-[var(--app-bg)] hover:opacity-90'
          : `border ${toneClasses[tone]}`
      } inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:pointer-events-none disabled:opacity-40 lg:py-2 lg:text-xs`}
    >
      {icon}
      {children}
    </button>
  )
}