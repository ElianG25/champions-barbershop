'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { formatDate, formatTime } from '@/lib/utils'
import { buildThemeStyle } from '@/lib/theme'
import { supabase } from '@/lib/supabaseClient'
import { NeutralLoader } from '@/components/ui/NeutralLoader'
import { Check } from 'lucide-react'

export default function ReservaConfirmadaPage() {
  return (
    <Suspense fallback={<NeutralLoader eyebrow="Confirmación" title="Preparando detalles..." />}>
      <SuccessContent />
    </Suspense>
  )
}

function SuccessContent() {
  const params = useSearchParams()
  const [business, setBusiness] = useState<any>(null)
  const [loadingBusiness, setLoadingBusiness] = useState(true)

  useEffect(() => {
    async function loadBusiness() {
      const { data } = await supabase
        .from('business_settings')
        .select('*')
        .single()

      setBusiness(data)
      setLoadingBusiness(false)
    }

    loadBusiness()
  }, [])

  if (loadingBusiness || !business) {
    return (
      <NeutralLoader
        eyebrow="Confirmación"
        title="Preparando detalles..."
      />
    )
  }

  const name = params.get('name')
  const service = params.get('service')
  const date = params.get('date')
  const time = params.get('time')

  return (
    <main
      style={buildThemeStyle(business)}
      className="min-h-screen overflow-x-hidden bg-[var(--app-bg)] text-[var(--app-text)]"
    >
      <section className="mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-5 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="animate-fade-in">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--brand)]">
            Reserva confirmada
          </p>

          <h1 className="mt-5 max-w-xl text-5xl font-semibold leading-[0.95] tracking-[-0.06em] sm:text-6xl">
            Tu cita quedó agendada.
          </h1>

          <p className="mt-6 max-w-lg text-base leading-8 text-[var(--app-muted)]">
            Hemos recibido tu reserva correctamente. Guarda esta información para el día de tu visita.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="bg-[var(--brand)] px-6 py-4 text-center text-sm font-semibold text-[var(--app-bg)] transition hover:opacity-90"
            >
              Volver al inicio
            </Link>

            <Link
              href="/reservar"
              className="border border-white/15 px-6 py-4 text-center text-sm font-semibold text-[var(--app-text)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
            >
              Crear otra reserva
            </Link>
          </div>
        </div>

        <div className="animate-modal-in border border-white/10 bg-[var(--app-surface)] p-5 shadow-2xl sm:p-6 lg:p-8">
          <div className="border-b border-white/10 pb-6">
            <div className="flex h-14 w-14 items-center justify-center border border-[var(--brand)] text-2xl text-[var(--brand)]">
              <Check size={24} />
            </div>

            <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em]">
              Detalles de la cita
            </h2>

            <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">
              {business?.name || 'El negocio'} te espera en la fecha y hora seleccionada.
            </p>
          </div>

          <div className="mt-6 divide-y divide-white/10 border border-white/10">
            <InfoRow label="Cliente" value={name || '—'} />
            <InfoRow label="Servicio" value={service || '—'} />
            <InfoRow label="Fecha" value={date ? formatDate(date) : '—'} />
            <InfoRow
              label="Hora"
              value={time ? formatTime(time, business?.time_format || '24h') : '—'}
            />
          </div>

          <div className="mt-6 border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm leading-6 text-[var(--app-muted)]">
              Si necesitas cambiar o cancelar tu cita, contacta directamente con el negocio.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-5 bg-[var(--app-bg)]/60 px-4 py-4">
      <span className="text-sm text-[var(--app-muted)]">{label}</span>
      <span className="text-right text-sm font-semibold text-[var(--app-text)]">
        {value}
      </span>
    </div>
  )
}