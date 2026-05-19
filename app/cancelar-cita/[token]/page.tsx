'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
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

export default function CancelAppointmentPage() {
  const params = useParams()
  const token = String(params.token || '')

  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    async function loadAppointment() {
      try {
        const res = await fetch(
          `/api/appointments/cancel/${encodeURIComponent(token)}`,
          {
            method: 'GET',
            cache: 'no-store',
          }
        )

        const data = await res.json()

        if (!res.ok) {
          setErrorMsg(data.error || 'No pudimos encontrar esta cita.')
          return
        }

        setAppointment(data.appointment)

        if (data.appointment?.status === 'cancelled') {
          setSuccess(true)
        }
      } catch {
        setErrorMsg('No pudimos cargar la información de la cita.')
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      loadAppointment()
    } else {
      setErrorMsg('Token inválido.')
      setLoading(false)
    }
  }, [token])

  async function handleCancel() {
    if (cancelling) return

    setCancelling(true)
    setErrorMsg('')

    try {
      const res = await fetch(
        `/api/appointments/cancel/${encodeURIComponent(token)}`,
        {
          method: 'POST',
        }
      )

      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error || 'No se pudo cancelar la cita.')
        return
      }

      setSuccess(true)
      setAppointment(data.appointment)
    } catch {
      setErrorMsg('Ocurrió un error cancelando la cita.')
    } finally {
      setCancelling(false)
    }
  }

  const title = success ? 'Cita cancelada' : 'Cancelar cita'
  const eyebrow = success ? 'Cancelación confirmada' : 'Gestión de reserva'
  const icon = success ? '✓' : '!'
  const description = success
    ? 'Tu cita fue cancelada correctamente. El negocio ya fue notificado.'
    : 'Revisa los detalles de tu cita antes de confirmar la cancelación.'

  return (
    <main className="min-h-screen bg-[var(--app-bg)] px-5 py-10 text-[var(--app-text)]">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-2xl items-center justify-center">
        <div className="w-full overflow-hidden border border-white/10 bg-[var(--app-surface)] shadow-2xl shadow-black/40">
          <div className="relative overflow-hidden border-b border-white/10 px-6 py-10 text-center sm:px-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,var(--brand)_0%,transparent_35%)] opacity-20" />

            <div className="relative">
              <div
                className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full border text-4xl font-black ${
                  success
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
                    Detalles de la cita
                  </p>

                  <div className="mt-5 grid gap-4 text-sm">
                    <div className="border-b border-white/10 pb-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-muted)]">
                        Cliente
                      </p>
                      <p className="mt-1 text-lg font-bold">
                        {appointment.customer_name || 'Cliente'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-muted)]">
                          Fecha
                        </p>
                        <p className="mt-1 font-bold">
                          {formatDate(appointment.date)}
                        </p>
                      </div>

                      <div className="border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-muted)]">
                          Hora
                        </p>
                        <p className="mt-1 font-bold">
                          {formatTime(appointment.start_time)}
                        </p>
                      </div>
                    </div>

                    <div className="border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-muted)]">
                        Servicio
                      </p>
                      <p className="mt-1 font-bold">
                        {appointment.services?.name || 'No especificado'}
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
                      {cancelling ? 'Cancelando...' : 'Sí, cancelar mi cita'}
                    </button>

                    <p className="text-center text-xs leading-5 text-[var(--app-muted)]">
                      Esta acción liberará el horario para otros clientes.
                    </p>
                  </div>
                )}

                {(success || appointment.status === 'cancelled') && (
                  <div className="mt-6 border border-emerald-400/25 bg-emerald-500/10 p-5 text-center">
                    <p className="text-sm font-semibold text-emerald-100">
                      Esta cita ya figura como cancelada.
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