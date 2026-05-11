'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import {
  addMinutes,
  generateSlots,
  getDayOfWeek,
  isPastDate,
  isPastSlot,
  rangesOverlap,
} from '@/lib/booking'
import { buildThemeStyle } from '@/lib/theme'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils'
import { NeutralLoader } from '@/components/ui/NeutralLoader'
import { PhoneField, isValidPhoneNumber } from '@/components/ui/PhoneField'
import { DateSelector } from '@/components/ui/DateSelector'
import { TimeSelector } from '@/components/ui/TimeSelector'

type Step = 'service' | 'client' | 'date' | 'time'

type Service = {
  id: string
  name: string
  description: string | null
  duration_minutes: number
  price: number
}

export default function ReservarPage() {
  const [activeStep, setActiveStep] = useState<Step>('service')

  const [business, setBusiness] = useState<any>(null)
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)

  const [date, setDate] = useState('')
  const [slots, setSlots] = useState<string[]>([])
  const [selectedSlot, setSelectedSlot] = useState('')

  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')

  const [loading, setLoading] = useState(true)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (!selectedService || !date) return
    loadSlots()
  }, [selectedService, date])

  async function loadInitialData() {
    setLoading(true)

    const { data: businessData } = await supabase
      .from('business_settings')
      .select('*')
      .single()

    const { data: servicesData } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true })

    setBusiness(businessData)
    setServices(servicesData || [])
    setLoading(false)
  }

  function selectService(service: Service) {
    setSelectedService(service)
    setSelectedSlot('')
    setSlots([])
    setMessage('')
    setActiveStep('client')
  }

  function continueToDate() {
    if (!customerName.trim()) {
      setMessage('Completa tu nombre.')
      return
    }

    if (!isValidPhoneNumber(customerPhone)) {
      setMessage('Ingresa un número de teléfono válido.')
      return
    }

    setMessage('')
    setActiveStep('date')
  }

  function selectDate(value: string) {
    setDate(value)
    setSelectedSlot('')
    setMessage('')
    setActiveStep('time')
  }

  async function loadSlots() {
    if (!selectedService || !date) return

    setLoadingSlots(true)
    setMessage('')
    setSlots([])
    setSelectedSlot('')

    if (isPastDate(date)) {
      setMessage('No puedes reservar en una fecha pasada.')
      setLoadingSlots(false)
      return
    }

    const dayOfWeek = getDayOfWeek(date)

    const { data: dayOff } = await supabase
      .from('days_off')
      .select('*')
      .eq('date', date)
      .maybeSingle()

    if (dayOff) {
      setMessage(`Este día no está disponible. Motivo: ${dayOff.reason}`)
      setLoadingSlots(false)
      return
    }

    const { data: rules, error: rulesError } = await supabase
      .from('availability_rules')
      .select('*')
      .eq('day_of_week', dayOfWeek)

    if (rulesError) {
      setMessage('Error cargando horarios.')
      setLoadingSlots(false)
      return
    }

    const activeRules = (rules || []).filter((rule) => rule.is_active !== false)

    if (activeRules.length === 0) {
      setMessage('No trabajamos este día.')
      setLoadingSlots(false)
      return
    }

    const { data: breaks } = await supabase
      .from('breaks')
      .select('*')
      .eq('date', date)

    const activeBreaks = (breaks || []).filter((b) => b.is_active !== false)

    const { data: appointments } = await supabase
      .from('appointments')
      .select('*')
      .eq('date', date)
      .in('status', ['pending', 'confirmed'])

    const duration = Number(selectedService.duration_minutes)

    if (!duration || duration <= 0) {
      setMessage('Este servicio no tiene una duración válida.')
      setLoadingSlots(false)
      return
    }

    let allSlots: string[] = []

    for (const rule of activeRules) {
      const start = String(rule.start_time).slice(0, 5)
      const end = String(rule.end_time).slice(0, 5)
      allSlots = [...allSlots, ...generateSlots(start, end, duration)]
    }

    const available = allSlots.filter((slot) => {
      if (isPastSlot(date, slot)) return false

      const slotEnd = addMinutes(slot, duration)

      const overlapsBreak = activeBreaks.some((b) =>
        rangesOverlap(
          slot,
          slotEnd,
          String(b.start_time).slice(0, 5),
          String(b.end_time).slice(0, 5)
        )
      )

      const overlapsAppointment = (appointments || []).some((a) =>
        rangesOverlap(
          slot,
          slotEnd,
          String(a.start_time).slice(0, 5),
          String(a.end_time).slice(0, 5)
        )
      )

      return !overlapsBreak && !overlapsAppointment
    })

    const uniqueAvailable = [...new Set(available)].sort()

    setSlots(uniqueAvailable)

    if (uniqueAvailable.length === 0) {
      setMessage('No hay horarios disponibles para esta fecha.')
    }

    setLoadingSlots(false)
  }

  function handleSelectSlot(slot: string) {
    setSelectedSlot(slot)
    setConfirmOpen(true)
  }

  async function submitBooking() {
    if (!selectedService || !date || !selectedSlot) {
      setMessage('Selecciona servicio, fecha y hora.')
      return
    }

    if (!customerName.trim()) {
      setMessage('Completa tu nombre.')
      return
    }

    if (!isValidPhoneNumber(customerPhone)) {
      setMessage('Ingresa un número de teléfono válido.')
      return
    }

    setSubmitting(true)
    setMessage('')

    const endTime = addMinutes(selectedSlot, selectedService.duration_minutes)

    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: selectedService.id,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail || null,
        date,
        start_time: selectedSlot,
        end_time: endTime,
      }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setMessage(data?.error || 'No se pudo crear la reserva.')
      setSubmitting(false)
      setConfirmOpen(false)
      return
    }

    window.location.href = `/reserva-confirmada?name=${encodeURIComponent(
      customerName
    )}&service=${encodeURIComponent(selectedService.name)}&date=${date}&time=${selectedSlot}`
  }

  if (loading || !business) {
    return (
      <NeutralLoader
        eyebrow="Reserva online"
        title="Cargando disponibilidad..."
      />
    )
  }

  if (business && !business.booking_enabled) {
    return (
      <main
        style={buildThemeStyle(business)}
        className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] px-5 text-[var(--app-text)]"
      >
        <section className="w-full max-w-lg border border-white/10 bg-[var(--app-surface)] p-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--brand)]">
            Reservas pausadas
          </p>

          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
            Las reservas no están disponibles ahora mismo.
          </h1>

          <p className="mt-4 text-sm leading-7 text-[var(--app-muted)]">
            El negocio ha pausado temporalmente las reservas online. Puedes volver más tarde o contactar directamente.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link href="/" className="btn-secondary">
              Volver al inicio
            </Link>

            {business?.whatsapp && (
              <a
                href={`https://wa.me/${String(business.whatsapp).replace(/\D/g, '')}`}
                className="btn-primary"
              >
                WhatsApp
              </a>
            )}
          </div>
        </section>
      </main>
    )
  }

  return (

    <main
      style={buildThemeStyle(business)}
      className="min-h-screen overflow-x-hidden bg-[var(--app-bg)] text-[var(--app-text)]"
    >
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[var(--app-bg)]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link href="/" className="text-sm font-semibold tracking-wide">
            {business?.name || 'NEGOCIO'}
          </Link>

          <Link
            href="/"
            className="border border-white/15 px-4 py-2 text-sm font-semibold text-[var(--app-muted)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
          >
            Volver
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[0.85fr_1.15fr] lg:px-8 lg:py-12">
        <aside className="lg:sticky lg:top-28 lg:h-fit">
          <div className="border border-white/10 bg-[var(--app-surface)] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--brand)]">
              Reserva online
            </p>

            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
              Agenda tu próxima visita.
            </h1>

            <p className="mt-5 text-sm leading-7 text-[var(--app-muted)]">
              Completa los pasos. Cada sección se abre automáticamente al avanzar.
            </p>

            <div className="mt-6 border-t border-white/10 pt-5">
              <SummaryRow label="Servicio" value={selectedService?.name || 'Pendiente'} />
              <SummaryRow label="Cliente" value={customerName || 'Pendiente'} />
              <SummaryRow
                label="Fecha"
                value={date ? formatDate(date) : 'Pendiente'}
              />
              <SummaryRow
                label="Hora"
                value={
                  selectedSlot
                    ? formatTime(selectedSlot, business?.time_format || '24h')
                    : 'Pendiente'
                }
              />
            </div>
          </div>
        </aside>

        <div className="space-y-3">
          <AccordionPanel
            step="01"
            title="Servicio"
            active={activeStep === 'service'}
            completed={Boolean(selectedService)}
            summary={selectedService?.name}
            onOpen={() => setActiveStep('service')}
          >
            <div className="grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2">
              {services.map((service) => {
                const active = selectedService?.id === service.id

                return (
                  <button
                    key={service.id}
                    onClick={() => selectService(service)}
                    className={`bg-[var(--app-surface)] p-5 text-left transition ${active
                      ? 'outline outline-1 outline-[var(--brand)]'
                      : 'hover:bg-white/[0.08]'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold">{service.name}</h3>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--app-muted)]">
                          {service.description}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="font-semibold text-[var(--brand)]">
                          {formatCurrency(Number(service.price), business?.currency || 'EUR')}
                        </p>
                        <p className="mt-1 text-xs text-[var(--app-muted)]">
                          {service.duration_minutes} min
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </AccordionPanel>

          <AccordionPanel
            step="02"
            title="Datos del cliente"
            active={activeStep === 'client'}
            completed={Boolean(customerName.trim() && isValidPhoneNumber(customerPhone))}
            summary={customerName || undefined}
            disabled={!selectedService}
            onOpen={() => selectedService && setActiveStep('client')}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Input value={customerName} onChange={setCustomerName} placeholder="Nombre completo" />
              <PhoneField value={customerPhone} onChange={setCustomerPhone} />

              <div className="sm:col-span-2">
                <Input value={customerEmail} onChange={setCustomerEmail} placeholder="Email opcional" />
              </div>
            </div>

            <button
              onClick={continueToDate}
              className="mt-5 bg-[var(--brand)] px-6 py-4 text-sm font-semibold text-[var(--app-bg)] transition hover:opacity-90"
            >
              Continuar
            </button>
          </AccordionPanel>

          <AccordionPanel
            step="03"
            title="Fecha"
            active={activeStep === 'date'}
            completed={Boolean(date)}
            summary={date || undefined}
            disabled={!selectedService || !customerName.trim() || !isValidPhoneNumber(customerPhone)}
            onOpen={() => selectedService && customerName && customerPhone && setActiveStep('date')}
          >
            <DateSelector value={date} onChange={selectDate} days={21} />
          </AccordionPanel>

          <AccordionPanel
            step="04"
            title="Horario"
            active={activeStep === 'time'}
            completed={Boolean(selectedSlot)}
            summary={selectedSlot || undefined}
            disabled={!date}
            onOpen={() => date && setActiveStep('time')}
          >
            {loadingSlots && (
              <div className="space-y-4">
                <p className="text-sm text-[var(--app-muted)]">
                  Calculando disponibilidad...
                </p>
                <div className="h-1 overflow-hidden bg-white/10">
                  <div className="h-full w-1/2 animate-loading-bar bg-[var(--brand)]" />
                </div>
              </div>
            )}

            {!loadingSlots && slots.length > 0 && (
              <TimeSelector
                value={selectedSlot}
                options={slots}
                onChange={handleSelectSlot}
                timeFormat={business?.time_format || '24h'}
              />
            )}
          </AccordionPanel>

          {message && (
            <div className="animate-fade-in border border-red-500/30 bg-red-500/10 p-4 text-sm leading-6 text-red-200">
              {message}
            </div>
          )}
        </div>
      </section>

      {confirmOpen && selectedService && (
        <ConfirmModal
          business={business}
          service={selectedService}
          name={customerName}
          phone={customerPhone}
          date={date}
          time={selectedSlot}
          submitting={submitting}
          onClose={() => setConfirmOpen(false)}
          onConfirm={submitBooking}
        />
      )}
    </main>
  )
}

function AccordionPanel({
  step,
  title,
  active,
  completed,
  disabled,
  summary,
  onOpen,
  children,
}: {
  step: string
  title: string
  active: boolean
  completed?: boolean
  disabled?: boolean
  summary?: string
  onOpen: () => void
  children: React.ReactNode
}) {
  return (
    <section
      className={`border border-white/10 bg-[var(--app-surface)] transition ${disabled ? 'opacity-45' : 'opacity-100'
        }`}
    >
      <button
        type="button"
        onClick={onOpen}
        disabled={disabled}
        className="flex w-full items-center justify-between gap-4 p-5 text-left sm:p-6"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--brand)]">
              {step}
            </span>
            {completed && (
              <span className="border border-[var(--brand)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--brand)]">
                Listo
              </span>
            )}
          </div>

          <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em]">
            {title}
          </h2>

          {summary && (
            <p className="mt-1 truncate text-sm text-[var(--app-muted)]">
              {summary}
            </p>
          )}
        </div>

        <span className="text-xl text-[var(--app-muted)]">
          {active ? '−' : '+'}
        </span>
      </button>

      <div
        className={`grid transition-all duration-300 ${active ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-white/10 p-5 sm:p-6">
            {children}
          </div>
        </div>
      </div>
    </section>
  )
}

function ConfirmModal({
  business,
  service,
  name,
  phone,
  date,
  time,
  submitting,
  onClose,
  onConfirm,
}: {
  business: any
  service: Service
  name: string
  phone: string
  date: string
  time: string
  submitting: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end bg-black/70 p-0 sm:items-center sm:p-5">
      <section className="animate-modal-in max-h-[92dvh] w-full overflow-y-auto border border-white/10 bg-[var(--app-bg)] p-5 text-[var(--app-text)] shadow-2xl sm:mx-auto sm:max-w-lg sm:p-6">
        <div className="flex items-start justify-between gap-5 border-b border-white/10 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--brand)]">
              Confirmar cita
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
              Revisa tu reserva
            </h2>
          </div>

          <button
            onClick={onClose}
            className="btn-secondary px-3 py-2"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-5 divide-y divide-white/10 border border-white/10">
          <ModalRow label="Negocio" value={business?.name || 'NEGOCIO'} />
          <ModalRow label="Cliente" value={name} />
          <ModalRow label="Teléfono" value={phone} />
          <ModalRow label="Servicio" value={service.name} />
          <ModalRow label="Fecha" value={date ? formatDate(date) : '—'} />
          <ModalRow
            label="Hora"
            value={formatTime(time, business?.time_format || '24h')}
          />
          <ModalRow
            label="Precio"
            value={formatCurrency(Number(service.price), business?.currency || 'EUR')}
          />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Editar
          </button>

          <button
            onClick={onConfirm}
            disabled={submitting}
            className="btn-primary disabled:opacity-50"
          >
            {submitting ? 'Confirmando...' : 'Confirmar cita'}
          </button>
        </div>
      </section>
    </div>
  )
}

function ModalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-5 bg-[var(--app-surface)] px-4 py-4">
      <span className="text-sm text-[var(--app-muted)]">{label}</span>
      <span className="text-right text-sm font-semibold">{value}</span>
    </div>
  )
}

function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-white/10 bg-white/[0.04] px-4 py-4 text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-muted)] focus:border-[var(--brand)]"
    />
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 py-3 last:border-0">
      <span className="text-sm text-[var(--app-muted)]">{label}</span>
      <span className="max-w-[55%] truncate text-right text-sm font-semibold">
        {value}
      </span>
    </div>
  )
}