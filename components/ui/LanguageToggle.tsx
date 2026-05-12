'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'

export function LanguageToggle({ current }: { current: 'es' | 'en' }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [clicked, setClicked] = useState(false)

  useEffect(() => {
    setClicked(false)
  }, [current])

  function changeLanguage(nextLanguage: 'es' | 'en') {
    if (nextLanguage === current || isPending) return

    setClicked(true)

    const params = new URLSearchParams(searchParams.toString())

    if (nextLanguage === 'es') {
      params.delete('lang')
    } else {
      params.set('lang', 'en')
    }

    const nextUrl = params.toString() ? `/?${params.toString()}` : '/'

    setTimeout(() => {
      startTransition(() => {
        router.push(nextUrl)
        router.refresh()
      })
    }, 300)
  }

  return (
    <div className="inline-flex shrink-0 border border-white/10 bg-white/[0.04] p-1">
      <button
        type="button"
        onClick={() => changeLanguage('es')}
        disabled={isPending}
        aria-label="Ver en español"
        className={`px-2.5 py-2 text-base transition ${
          current === 'es'
            ? 'bg-[var(--brand)] text-[var(--app-bg)]'
            : 'text-[var(--app-text)] hover:bg-white/[0.06]'
        }`}
      >
        🇪🇸
      </button>

      <button
        type="button"
        onClick={() => changeLanguage('en')}
        disabled={isPending}
        aria-label="View in English"
        className={`px-2.5 py-2 text-base transition ${
          current === 'en'
            ? 'bg-[var(--brand)] text-[var(--app-bg)]'
            : 'text-[var(--app-text)] hover:bg-white/[0.06]'
        }`}
      >
        🇺🇸
      </button>

      {(clicked || isPending) && (
        <span className="flex items-center px-2 text-xs text-[var(--app-muted)]">
          ...
        </span>
      )}
    </div>
  )
}