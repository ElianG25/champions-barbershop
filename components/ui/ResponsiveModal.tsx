'use client'

import { ReactNode, useEffect } from 'react'

type ResponsiveModalProps = {
  open: boolean
  title?: string
  eyebrow?: string
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
}

export function ResponsiveModal({
  open,
  title,
  eyebrow,
  children,
  footer,
  onClose,
}: ResponsiveModalProps) {
  useEffect(() => {
    if (!open) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <button
        aria-label="Cerrar modal"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />

      <section className="relative flex max-h-[calc(100dvh-1rem)] w-full animate-modal-up flex-col overflow-hidden rounded-t-[2rem] border border-white/10 bg-[var(--app-bg)] text-[var(--app-text)] shadow-2xl sm:max-h-[min(760px,calc(100dvh-3rem))] sm:max-w-lg sm:animate-modal-in sm:rounded-[2rem]">
        <header className="shrink-0 border-b border-white/10 bg-white/[0.03] px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              {eyebrow && (
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--brand)]">
                  {eyebrow}
                </p>
              )}
              {title && <h2 className="mt-1 text-2xl font-black">{title}</h2>}
            </div>

            <button
              onClick={onClose}
              className="rounded-full border border-white/10 px-3 py-2 text-sm font-black transition hover:bg-white/10"
            >
              ✕
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {children}
        </div>

        {footer && (
          <footer className="shrink-0 border-t border-white/10 bg-[var(--app-bg)] px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-6">
            {footer}
          </footer>
        )}
      </section>
    </div>
  )
}
