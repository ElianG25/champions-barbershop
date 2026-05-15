'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'

export default function CancelAppointmentPage() {
  const params = useParams()
  const token = params.token as string

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleCancel() {
    if (loading) return

    setLoading(true)
    setErrorMsg('')

    const res = await fetch(`/api/appointments/cancel/${token}`, {
      method: 'POST',
    })

    const data = await res.json()

    if (!res.ok) {
      setErrorMsg(data.error || 'No se pudo cancelar la cita.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-5 text-white">
      <section className="w-full max-w-md border border-white/10 bg-neutral-900 p-6 text-center">
        {success ? (
          <>
            <h1 className="text-2xl font-semibold">Cita cancelada</h1>
            <p className="mt-3 text-sm text-white/70">
              Tu cita fue cancelada correctamente.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold">Cancelar cita</h1>
            <p className="mt-3 text-sm text-white/70">
              Confirma solamente si realmente no podrás asistir.
            </p>

            {errorMsg && (
              <p className="mt-4 border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">
                {errorMsg}
              </p>
            )}

            <button
              onClick={handleCancel}
              disabled={loading}
              className="mt-6 w-full bg-red-500 px-5 py-3 font-semibold text-white disabled:opacity-60"
            >
              {loading ? 'Cancelando...' : 'Sí, cancelar mi cita'}
            </button>
          </>
        )}
      </section>
    </main>
  )
}