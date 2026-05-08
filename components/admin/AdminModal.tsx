'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export function AdminModal({
  eyebrow,
  title,
  onClose,
  children,
  footer,
  size = 'md',
}: {
  eyebrow: string
  title: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])

  if (!mounted) return null

  const sizeClass = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-xl',
    lg: 'sm:max-w-3xl',
    xl: 'sm:max-w-5xl',
  }[size]

  return createPortal(
    <div className="admin-modal-backdrop">
      <section className={`admin-modal ${sizeClass}`}>
        <div className="sticky top-0 z-10 border-b border-white/10 bg-[var(--app-bg)] pb-5">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--brand)]">
                {eyebrow}
              </p>

              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                {title}
              </h2>
            </div>

            <button
              onClick={onClose}
              className="btn-secondary px-3 py-2"
              aria-label="Cerrar modal"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="mt-6">{children}</div>

        {footer && (
          <div className="sticky bottom-0 mt-6 border-t border-white/10 bg-[var(--app-bg)] pt-4">
            {footer}
          </div>
        )}
      </section>
    </div>,
    document.body
  )
}