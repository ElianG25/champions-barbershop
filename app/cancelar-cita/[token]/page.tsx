'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { formatDate, formatTime } from '@/lib/utils'

type Appointment = {
  customer_name: string
  customer_phone: string
  date: string
  start_time: string
  status: string
  services?: {
    name?: string
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
    fallbackCustomer: 'Cliente',
    fallbackService: 'No especificado',
    cancelling: 'Cancelando...',
    cancelButton: 'Sí, cancelar mi cita',
    slotReleased: 'Esta acción liberará el horario para otros clientes.',
    alreadyCancelled: 'Esta cita ya figura como cancelada.',
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
    fallbackCustomer: 'Customer',
    fallbackService: 'Not specified',
    cancelling: 'Cancelling...',
    cancelButton: 'Yes, cancel my appointment',
    slotReleased: 'This action will free the time slot for other customers.',
    alreadyCancelled: 'This appointment is already marked as cancelled.',
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

  const title = success ? t.cancelledTitle : t.title
  const eyebrow = success ? t.cancelledEyebrow : t.eyebrow
  const description = success ? t.cancelledDescription : t.description
  const icon = success ? '✓' : '!'

  return (
    <main className="min-h-screen bg-[var(--app-bg)] px-5 py-10 text-[var(--app-text)]">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-2xl items-center justify-center">
        <div className="w-full overflow-hidden border border-white/10 bg-[var(--app-surface)] shadow-2xl shadow-black/40">
          <div className="relative overflow-hidden border-b border-white/10 px-6 py-10 text-center sm:px-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,var(--brand)_0%,transparent_35%)] opacity-20" />

            <div className="relative">
              <div
                className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full border text-4xl font-black ${success
                  ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-red-400/30 bg-red-500/10 text-red-300'
                  }`}
              >
                {icon}
              </div>

              <p className="mt-6 text-xs font-black uppercase tracking-[0.28em] text-[var(--brand)]">
                {eyebrow}
              </p>

              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                {title}
              </h1>

              <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[var(--app-muted)]">
                {description}
              </p>
            </div>
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
              <div className="border border-red-400/25 bg-red-500/10 p-5 text-center">
                <p className="text-sm font-semibold text-red-100">
                  {errorMsg}
                </p>
              </div>
            )}

            {!loading && appointment && (
              <>
                <div className="border border-white/10 bg-black/20 p-5 sm:p-6">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--app-muted)]">
                    {t.details}
                  </p>

                  <div className="mt-5 grid gap-4 text-sm">
                    <div className="border-b border-white/10 pb-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-muted)]">
                        {t.customer}
                      </p>
                      <p className="mt-1 text-lg font-bold">
                        {appointment.customer_name || t.fallbackCustomer}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-muted)]">
                          {t.date}
                        </p>
                        <p className="mt-1 font-bold">
                          {formatDate(appointment.date)}
                        </p>
                      </div>

                      <div className="border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-muted)]">
                          {t.time}
                        </p>
                        <p className="mt-1 font-bold">
                          {formatTime(appointment.start_time)}
                        </p>
                      </div>
                    </div>

                    <div className="border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-muted)]">
                        {t.service}
                      </p>
                      <p className="mt-1 font-bold">
                        {appointment.services?.name || t.fallbackService}
                      </p>
                    </div>
                  </div>
                </div>

                {errorMsg && (
                  <div className="mt-5 border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-100">
                    {errorMsg}
                  </div>
                )}

                {!success && appointment.status !== 'cancelled' && (
                  <div className="mt-6 space-y-3">
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="w-full border border-red-400/40 bg-red-500 px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {cancelling ? t.cancelling : t.cancelButton}
                    </button>

                    <p className="text-center text-xs leading-5 text-[var(--app-muted)]">
                      {t.slotReleased}
                    </p>
                  </div>
                )}

                {(success || appointment.status === 'cancelled') && (
                  <div className="mt-6 border border-emerald-400/25 bg-emerald-500/10 p-5 text-center">
                    <p className="text-sm font-semibold text-emerald-100">
                      {t.alreadyCancelled}
                    </p>
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