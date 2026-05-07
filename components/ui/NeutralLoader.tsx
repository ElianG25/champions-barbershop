export function NeutralLoader({
  eyebrow = 'Cargando',
  title = 'Preparando contenido...',
}: {
  eyebrow?: string
  title?: string
}) {
  return (
    <main className="flex min-h-screen items-center justify-center overflow-hidden bg-neutral-950 px-6 text-white">
      <section className="w-full max-w-md animate-fade-in border border-white/10 bg-neutral-900 p-8 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
          {eyebrow}
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
          {title}
        </h1>

        <div className="mt-8 overflow-hidden border border-white/10 bg-white/[0.04]">
          <div className="h-1 animate-loading-bar bg-white" />
        </div>

        <div className="mt-8 space-y-4">
          <SkeletonLine width="70%" />
          <SkeletonLine width="100%" />
          <SkeletonLine width="85%" />
        </div>
      </section>
    </main>
  )
}

function SkeletonLine({ width }: { width: string }) {
  return <div style={{ width }} className="h-3 animate-pulse bg-white/10" />
}