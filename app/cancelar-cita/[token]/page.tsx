'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

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
        const res = await fetch(`/api/appointments/cancel/${encodeURIComponent(token)}`, {
          method: 'GET',
          cache: 'no-store',
        })

        const data = await res.json()

        if (!res.ok) {
          setErrorMsg(data.error || 'No pudimos encontrar esta cita.')
          return
        }

        setAppointment(data.appointment)
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
      const res = await fetch(`/api/appointments/cancel/${encodeURIComponent(token)}`, {
        method: 'POST',
      })

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

  return (
    <main className="min-h-screen bg-neutral-950 px-5 py-10 text-white">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-xl items-center justify-center">
        <div className="w-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/40">
          <div className="border-b border-white/10 bg-gradient-to-br from-red-500/20 via-white/[0.03] to-transparent p-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-red-400/30 bg-red-500/15 text-3xl">
              {success ? '✅' : '⚠️'}
            </div>

            <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-200">
              Gestión de cita
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight">
              {success ? 'Cita cancelada' : 'Cancelar cita'}
            </h1>

            <p className="mt-3 text-sm leading-6 text-white/65">
              {success
                ? 'Tu cita fue cancelada correctamente. El negocio ya fue notificado.'
                : 'Confirma esta acción solamente si realmente no podrás asistir.'}
            </p>
          </div>

          <div className="p-6">
            {loading && (
              <div className="space-y-4">
                <div className="h-5 w-2/3 animate-pulse rounded-full bg-white/10" />
                <div className="h-20 animate-pulse rounded-2xl bg-white/10" />
                <div className="h-12 animate-pulse rounded-xl bg-white/10" />
              </div>
            )}

            {!loading && errorMsg && !appointment && (
              <div className="rounded-2xl border border-red-400/25 bg-red-500/10 p-5 text-center">
                <p className="text-sm font-semibold text-red-100">
                  {errorMsg}
                </p>
              </div>
            )}

            {!loading && appointment && (
              <>
                <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
                  <div className="grid gap-4 text-sm">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                        Cliente
                      </p>
                      <p className="mt-1 font-semibold">
                        {appointment.customer_name || 'Cliente'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                          Fecha
                        </p>
                        <p className="mt-1 font-semibold">
                          {appointment.date}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                          Hora
                        </p>
                        <p className="mt-1 font-semibold">
                          {String(appointment.start_time || '').slice(0, 5)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                        Servicio
                      </p>
                      <p className="mt-1 font-semibold">
                        {appointment.services?.name || 'No especificado'}
                      </p>
                    </div>
                  </div>
                </div>

                {errorMsg && (
                  <div className="mt-5 rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-100">
                    {errorMsg}
                  </div>
                )}

                {!success && appointment.status !== 'cancelled' && (
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="mt-6 w-full rounded-2xl border border-red-400/40 bg-red-500 px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {cancelling ? 'Cancelando...' : 'Sí, cancelar mi cita'}
                  </button>
                )}

                {(success || appointment.status === 'cancelled') && (
                  <div className="mt-6 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4 text-center text-sm text-emerald-100">
                    Esta cita ya figura como cancelada.
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