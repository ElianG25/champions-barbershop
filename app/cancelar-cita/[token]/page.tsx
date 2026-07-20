'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'
import { buildThemeStyle } from '@/lib/theme'
import { supabase } from '@/lib/supabaseClient'
import { NeutralLoader } from '@/components/ui/NeutralLoader'

type Appointment = {
  customer_name: string
  customer_phone: string
  date: string
  start_time: string
  status: string
  services?: {
    name?: string
  } | null
  staff?: {
    full_name?: string
  } | null
}

const COPY = {
  es: {
    title: 'Cancelar cita',
    cancelledTitle: 'Cita cancelada',
    eyebrow: 'Gestión de reserva',
    cancelledEyebrow: 'Cancelación confirmada',
    description: 'Revisa los detalles de tu cita antes de confirmar la cancelación.',
    cancelledDescription: 'Tu cita fue cancelada correctamente. El negocio ya fue notificado.',
    loadError: 'No pudimos encontrar esta cita.',
    fetchError: 'No pudimos cargar la información de la cita.',
    invalidToken: 'Token inválido.',
    cancelError: 'No se pudo cancelar la cita.',
    unexpectedCancelError: 'Ocurrió un error cancelando la cita.',
    details: 'Detalles de la cita',
    customer: 'Cliente',
    date: 'Fecha',
    time: 'Hora',
    service: 'Servicio',
    barber: 'Barbero',
    fallbackCustomer: 'Cliente',
    fallbackService: 'No especificado',
    cancelling: 'Cancelando...',
    cancelButton: 'Sí, cancelar mi cita',
    slotReleased: 'Esta acción liberará el horario para otros clientes.',
    alreadyCancelled: 'Esta cita ya figura como cancelada.',
    home: 'Volver al inicio',
  },
  en: {
    title: 'Cancel appointment',
    cancelledTitle: 'Appointment cancelled',
    eyebrow: 'Booking management',
    cancelledEyebrow: 'Cancellation confirmed',
    description: 'Review your appointment details before confirming cancellation.',
    cancelledDescription: 'Your appointment has been cancelled successfully. The business has already been notified.',
    loadError: 'We could not find this appointment.',
    fetchError: 'We could not load the appointment information.',
    invalidToken: 'Invalid token.',
    cancelError: 'We could not cancel this appointment.',
    unexpectedCancelError: 'An error occurred while cancelling the appointment.',
    details: 'Appointment details',
    customer: 'Customer',
    date: 'Date',
    time: 'Time',
    service: 'Service',
    barber: 'Barber',
    fallbackCustomer: 'Customer',
    fallbackService: 'Not specified',
    cancelling: 'Cancelling...',
    cancelButton: 'Yes, cancel my appointment',
    slotReleased: 'This action will free the time slot for other customers.',
    alreadyCancelled: 'This appointment is already marked as cancelled.',
    home: 'Back home',
  },
} as const

export default function CancelAppointmentPage() {
  const params = useParams()
  const token = String(params.token || '')
  const searchParams = useSearchParams()
  const language = searchParams.get('lang') === 'en' ? 'en' : 'es'
  const t = COPY[language]
  const langQuery = language === 'en' ? '?lang=en' : ''

  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
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

  useEffect(() => {
    async function loadAppointment() {
      try {
        const res = await fetch(
          `/api/appointments/cancel/${encodeURIComponent(token)}${langQuery}`,
          {
            method: 'GET',
            cache: 'no-store',
          }
        )

        const data = await res.json()

        if (!res.ok) {
          setErrorMsg(data.error || t.loadError)
          return
        }

        setAppointment(data.appointment)

        if (data.appointment?.status === 'cancelled') {
          setSuccess(true)
        }
      } catch {
        setErrorMsg(t.fetchError)
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      loadAppointment()
    } else {
      setErrorMsg(t.invalidToken)
      setLoading(false)
    }
  }, [token, langQuery, t.fetchError, t.invalidToken, t.loadError])

  async function handleCancel() {
    if (cancelling) return

    setCancelling(true)
    setErrorMsg('')

    try {
      const res = await fetch(
        `/api/appointments/cancel/${encodeURIComponent(token)}${langQuery}`,
        {
          method: 'POST',
        }
      )

      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error || t.cancelError)
        return
      }

      setSuccess(true)
      setAppointment(data.appointment)
    } catch {
      setErrorMsg(t.unexpectedCancelError)
    } finally {
      setCancelling(false)
    }
  }

  if (loadingBusiness || !business) {
    return (
      <NeutralLoader
        eyebrow={language === 'en' ? 'Booking management' : 'Gestión de reserva'}
        title={language === 'en' ? 'Loading appointment...' : 'Cargando cita...'}
      />
    )
  }

  const title = success ? t.cancelledTitle : t.title
  const eyebrow = success ? t.cancelledEyebrow : t.eyebrow
  const description = success ? t.cancelledDescription : t.description
  const isCancelled = success || appointment?.status === 'cancelled'
  const StatusIcon = isCancelled ? CheckCircle2 : errorMsg && !appointment ? XCircle : AlertTriangle

  return (
    <main
      style={buildThemeStyle(business)}
      className="min-h-screen overflow-x-hidden bg-[var(--app-bg)] text-[var(--app-text)]"
    >
      <header className="border-b border-white/10">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link href="/" className="text-sm font-semibold tracking-wide">
            {business?.name || 'Champions Barbershop'}
          </Link>

          <Link
            href={`/${langQuery}`}
            className="border border-white/15 px-4 py-2 text-sm font-semibold text-[var(--app-muted)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
          >
            {t.home}
          </Link>
        </div>
      </header>

      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-2xl items-center justify-center px-5 py-10">
        <div className="w-full animate-fade-in border border-white/10 bg-[var(--app-surface)] shadow-2xl">
          <div className="border-b border-white/10 px-6 py-10 text-center sm:px-10">
            <div
              className={`mx-auto flex h-14 w-14 items-center justify-center border ${isCancelled
                ? 'border-[var(--brand)] text-[var(--brand)]'
                : 'border-red-400/30 text-red-300'
                }`}
            >
              <StatusIcon size={24} />
            </div>

            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--brand)]">
              {eyebrow}
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              {title}
            </h1>

            <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[var(--app-muted)]">
              {description}
            </p>
          </div>

          <div className="p-6 sm:p-8">
            {loading && (
              <div className="space-y-4">
                <div className="h-5 w-2/3 animate-pulse bg-white/10" />
                <div className="h-28 animate-pulse bg-white/10" />
                <div className="h-12 animate-pulse bg-white/10" />
              </div>
            )}

            {!loading && errorMsg && !appointment && (
              <div className="border border-red-500/30 bg-red-500/10 p-5 text-center">
                <p className="text-sm font-semibold text-red-200">
                  {errorMsg}
                </p>
              </div>
            )}

            {!loading && appointment && (
              <>
                <div className="border border-white/10 bg-[var(--app-bg)]/40 p-5 sm:p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--app-muted)]">
                    {t.details}
                  </p>

                  <div className="mt-5 grid gap-4 text-sm">
                    <div className="border-b border-white/10 pb-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-muted)]">
                        {t.customer}
                      </p>
                      <p className="mt-1 text-lg font-semibold">
                        {appointment.customer_name || t.fallbackCustomer}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-muted)]">
                          {t.date}
                        </p>
                        <p className="mt-1 font-semibold">
                          {formatDate(appointment.date, language)}
                        </p>
                      </div>

                      <div className="border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-muted)]">
                          {t.time}
                        </p>
                        <p className="mt-1 font-semibold">
                          {formatTime(appointment.start_time, business?.time_format || '24h')}
                        </p>
                      </div>
                    </div>

                    <div className="border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-muted)]">
                        {t.service}
                      </p>
                      <p className="mt-1 font-semibold">
                        {appointment.services?.name || t.fallbackService}
                      </p>
                    </div>

                    {appointment.staff?.full_name && (
                      <div className="border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-muted)]">
                          {t.barber}
                        </p>
                        <p className="mt-1 font-semibold">
                          {appointment.staff.full_name}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {errorMsg && (
                  <div className="mt-5 border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                    {errorMsg}
                  </div>
                )}

                {!success && appointment.status !== 'cancelled' && (
                  <div className="mt-6 space-y-3">
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="btn-danger w-full disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {cancelling ? t.cancelling : t.cancelButton}
                    </button>

                    <p className="text-center text-xs leading-5 text-[var(--app-muted)]">
                      {t.slotReleased}
                    </p>
                  </div>
                )}

                {(success || appointment.status === 'cancelled') && (
                  <div className="mt-6 space-y-3">
                    <div className="border border-emerald-400/25 bg-emerald-400/10 p-5 text-center">
                      <p className="text-sm font-semibold text-emerald-300">
                        {t.alreadyCancelled}
                      </p>
                    </div>

                    <Link href={`/${langQuery}`} className="btn-secondary block w-full text-center">
                      {t.home}
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}