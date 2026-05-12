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
    <Suspense
      fallback={
        <NeutralLoader
          eyebrow="Confirmación"
          title="Preparando detalles..."
        />
      }
    >
      <SuccessContent />
    </Suspense>
  )
}

function SuccessContent() {
  const params = useSearchParams()
  const [business, setBusiness] = useState<any>(null)
  const [loadingBusiness, setLoadingBusiness] = useState(true)

  const language = params.get('lang') === 'en' ? 'en' : 'es'
  const langQuery = language === 'en' ? '?lang=en' : ''

  const COPY = {
    es: {
      badge: 'Reserva confirmada',
      title: 'Tu cita quedó agendada.',
      text: 'Hemos recibido tu reserva correctamente. Guarda esta información para el día de tu visita.',
      home: 'Volver al inicio',
      another: 'Crear otra reserva',
      details: 'Detalles de la cita',
      waiting: 'te espera en la fecha y hora seleccionada.',
      customer: 'Cliente',
      service: 'Servicio',
      date: 'Fecha',
      time: 'Hora',
      note: 'Si necesitas cambiar o cancelar tu cita, contacta directamente con el negocio.',
    },
    en: {
      badge: 'Booking confirmed',
      title: 'Your appointment is booked.',
      text: 'We have received your booking successfully. Save this information for your visit.',
      home: 'Back home',
      another: 'Book another appointment',
      details: 'Appointment details',
      waiting: 'is expecting you at the selected date and time.',
      customer: 'Customer',
      service: 'Service',
      date: 'Date',
      time: 'Time',
      note: 'If you need to change or cancel your appointment, please contact the business directly.',
    },
  }

  const t = COPY[language]

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
        eyebrow={language === 'en' ? 'Confirmation' : 'Confirmación'}
        title={language === 'en' ? 'Preparing details...' : 'Preparando detalles...'}
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
            {t.badge}
          </p>

          <h1 className="mt-5 max-w-xl text-5xl font-semibold leading-[0.95] tracking-[-0.06em] sm:text-6xl">
            {t.title}
          </h1>

          <p className="mt-6 max-w-lg text-base leading-8 text-[var(--app-muted)]">
            {t.text}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href={`/${langQuery}`}
              className="bg-[var(--brand)] px-6 py-4 text-center text-sm font-semibold text-[var(--app-bg)] transition hover:opacity-90"
            >
              {t.home}
            </Link>

            <Link
              href={`/reservar${langQuery}`}
              className="border border-white/15 px-6 py-4 text-center text-sm font-semibold text-[var(--app-text)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
            >
              {t.another}
            </Link>
          </div>
        </div>

        <div className="animate-modal-in border border-white/10 bg-[var(--app-surface)] p-5 shadow-2xl sm:p-6 lg:p-8">
          <div className="border-b border-white/10 pb-6">
            <div className="flex h-14 w-14 items-center justify-center border border-[var(--brand)] text-2xl text-[var(--brand)]">
              <Check size={24} />
            </div>

            <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em]">
              {t.details}
            </h2>

            <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">
              {business?.name || 'Champions Barbershop'} {t.waiting}
            </p>
          </div>

          <div className="mt-6 divide-y divide-white/10 border border-white/10">
            <InfoRow label={t.customer} value={name || '—'} />
            <InfoRow label={t.service} value={service || '—'} />
            <InfoRow label={t.date} value={date ? formatDate(date) : '—'} />
            <InfoRow
              label={t.time}
              value={time ? formatTime(time, business?.time_format || '24h') : '—'}
            />
          </div>

          <div className="mt-6 border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm leading-6 text-[var(--app-muted)]">
              {t.note}
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