'use client'

import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'
import { buildThemeStyle } from '@/lib/theme'
import {
  consumeLogoutReason,
  touchAdminActivity,
} from '@/lib/adminSession'

const DEVELOPER_WHATSAPP = '18296055347'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [noticeMsg, setNoticeMsg] = useState('')
  const [business, setBusiness] = useState<any>(null)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    async function initLoginPage() {
      const reason = consumeLogoutReason()
      if (reason) setNoticeMsg(reason)

      const { data } = await supabase.auth.getUser()

      if (data.user) {
        touchAdminActivity()
        window.location.href = '/admin'
        return
      }

      const { data: businessData } = await supabase
        .from('business_settings')
        .select('*')
        .single()

      setBusiness(businessData)
      setCheckingSession(false)
    }

    initLoginPage()
  }, [])

  async function handleLogin(event?: React.FormEvent) {
    event?.preventDefault()

    if (!email.trim() || !password || loading) return

    setLoading(true)
    setErrorMsg('')
    setNoticeMsg('')

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      setErrorMsg(translateAuthError(error.message))
      setLoading(false)
      return
    }

    touchAdminActivity()
    window.location.href = '/admin'
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-white">
        <section className="w-full max-w-md animate-fade-in border border-white/10 bg-neutral-900 p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
            Acceso privado
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
            Verificando sesión...
          </h1>

          <div className="mt-8 overflow-hidden border border-white/10 bg-white/[0.04]">
            <div className="h-1 animate-loading-bar bg-white" />
          </div>
        </section>
      </main>
    )
  }

  return (
    <main
      style={buildThemeStyle(business)}
      className="min-h-screen overflow-hidden bg-[var(--app-bg)] text-[var(--app-text)]"
    >
      <div className="grid min-h-screen lg:grid-cols-[1fr_520px]">
        <section className="hidden border-r border-white/10 bg-[var(--app-surface)]/70 p-10 lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--brand)]">
              Admin
            </p>

            <h1 className="mt-5 max-w-xl text-6xl font-semibold tracking-[-0.07em]">
              {business?.name || 'Champions Barbershop'}
            </h1>

            <p className="mt-5 max-w-md text-sm leading-7 text-[var(--app-muted)]">
              Gestiona reservas, servicios, horarios y configuración visual desde un panel rápido y centralizado.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-px overflow-hidden border border-white/10 bg-white/10">
            <LoginStat label="Reservas" value="24/7" />
            <LoginStat label="Panel" value="Admin" />
            <LoginStat label="Estado" value="Privado" />
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-10">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--brand)]">
                Admin
              </p>

              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">
                {business?.name || 'Champions Barbershop'}
              </h1>
            </div>

            <form
              onSubmit={handleLogin}
              className="border border-white/10 bg-[var(--app-surface)] p-5 shadow-2xl sm:p-6"
            >
              <div className="border-b border-white/10 pb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--brand)]">
                  Acceso privado
                </p>

                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                  Entrar al panel
                </h2>

                <p className="mt-3 text-sm leading-6 text-[var(--app-muted)]">
                  Usa tus credenciales para administrar citas, servicios y disponibilidad.
                </p>
              </div>

              <div className="mt-6 space-y-4">
                {noticeMsg && <NoticeMessage message={noticeMsg} />}
                {errorMsg && <ErrorMessage message={errorMsg} />}

                <Field label="Email">
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="admin@email.com"
                    className="admin-input"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </Field>

                <Field label="Contraseña">
                  <input
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="admin-input"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </Field>

                <button
                  type="submit"
                  disabled={loading || !email.trim() || !password}
                  className="btn-primary w-full disabled:opacity-40"
                >
                  {loading ? 'Entrando...' : 'Entrar al panel'}
                </button>

                <a
                  href={`https://wa.me/${DEVELOPER_WHATSAPP}?text=${encodeURIComponent(
                    'Hola Elian, necesito solicitar un nuevo usuario administrador para el sistema de reservas.'
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary w-full text-center"
                >
                  Solicitar usuario administrador
                </a>

                <p className="text-center text-xs leading-5 text-[var(--app-muted)]">
                  Los usuarios administradores no se registran desde la web. Deben ser creados directamente en la base de datos.
                </p>
              </div>
            </form>

            <Link href="/" className="btn-secondary mt-5 block text-center">
              Volver a la web
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--app-muted)]">
        {label}
      </span>
      {children}
    </label>
  )
}

function LoginStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--app-surface)] p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--app-muted)]">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
        {value}
      </p>
    </div>
  )
}

function NoticeMessage({ message }: { message: string }) {
  return (
    <div className="animate-fade-in border border-[var(--brand)]/40 bg-white/[0.04] p-4 text-sm leading-6 text-[var(--app-text)]">
      {message}
    </div>
  )
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="animate-fade-in border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
      {message}
    </div>
  )
}

function translateAuthError(message: string) {
  const normalized = message.toLowerCase()

  if (normalized.includes('invalid login credentials')) {
    return 'Email o contraseña incorrectos.'
  }

  if (normalized.includes('email not confirmed')) {
    return 'Debes confirmar tu email antes de entrar.'
  }

  if (normalized.includes('too many requests')) {
    return 'Demasiados intentos. Intenta nuevamente en unos minutos.'
  }

  if (normalized.includes('network')) {
    return 'Error de conexión. Revisa tu internet e intenta otra vez.'
  }

  return 'No se pudo iniciar sesión. Revisa tus datos e intenta nuevamente.'
}