export function AdminCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-white/10 bg-[var(--app-surface)] p-5">
      {children}
    </div>
  )
}