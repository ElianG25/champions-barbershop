'use client'

import { Suspense, useEffect, useState } from 'react'
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
import { useSearchParams } from 'next/navigation'
import { translateService } from '@/lib/landingTranslations'

type Step = 'service' | 'client' | 'date' | 'time'

type Service = {
  id: string
  name: string
  description: string | null
  duration_minutes: number
  price: number
}
export default function ReservarPage() {
  return (
    <Suspense fallback={<NeutralLoader eyebrow="Reserva online" title="Cargando disponibilidad..." />}>
      <ReservarContent />
    </Suspense>
  )
}

function ReservarContent() {
    const [activeStep, setActiveStep] = useState<Step>('service')

    const [business, setBusiness] = useState<any>(null)
    const [services, setServices] = useState<Service[]>([])
    const [selectedService, setSelectedService] = useState<Service | null>(null)

    const searchParams = useSearchParams()
    const language = searchParams.get('lang') === 'en' ? 'en' : 'es'
    const langQuery = language === 'en' ? '?lang=en' : ''

    const COPY = {
      es: {
        loadingEyebrow: 'Reserva online',
        loadingTitle: 'Cargando disponibilidad...',
        pausedEyebrow: 'Reservas pausadas',
        pausedTitle: 'Las reservas no están disponibles ahora mismo.',
        pausedText:
          'El negocio ha pausado temporalmente las reservas online. Puedes volver más tarde o contactar directamente.',
        back: 'Volver',
        home: 'Volver al inicio',
        bookingEyebrow: 'Reserva online',
        bookingTitle: 'Agenda tu próxima visita.',
        bookingText:
          'Completa los pasos. Cada sección se abre automáticamente al avanzar.',
        service: 'Servicio',
        customer: 'Cliente',
        date: 'Fecha',
        time: 'Hora',
        pending: 'Pendiente',
        stepService: 'Servicio',
        stepCustomer: 'Datos del cliente',
        stepDate: 'Fecha',
        stepTime: 'Horario',
        fullName: 'Nombre completo',
        optionalEmail: 'Email opcional',
        continue: 'Continuar',
        calculating: 'Calculando disponibilidad...',
        selected: 'Listo',
        confirmAppointment: 'Confirmar cita',
        reviewBooking: 'Revisa tu reserva',
        business: 'Negocio',
        phone: 'Teléfono',
        price: 'Precio',
        edit: 'Editar',
        confirming: 'Confirmando...',
        completeName: 'Completa tu nombre.',
        invalidPhone: 'Ingresa un número de teléfono válido.',
        selectAll: 'Selecciona servicio, fecha y hora.',
        createError: 'No se pudo crear la reserva.',
        pastDate: 'No puedes reservar en una fecha pasada.',
        dayUnavailable: 'Este día no está disponible. Motivo:',
        loadingScheduleError: 'Error cargando horarios.',
        closedDay: 'No trabajamos este día.',
        invalidDuration: 'Este servicio no tiene una duración válida.',
        noSlots: 'No hay horarios disponibles para esta fecha.',
      },
      en: {
        loadingEyebrow: 'Online booking',
        loadingTitle: 'Loading availability...',
        pausedEyebrow: 'Bookings paused',
        pausedTitle: 'Online bookings are not available right now.',
        pausedText:
          'The business has temporarily paused online bookings. Please come back later or contact us directly.',
        back: 'Back',
        home: 'Back home',
        bookingEyebrow: 'Online booking',
        bookingTitle: 'Book your next visit.',
        bookingText:
          'Complete the steps. Each section opens automatically as you move forward.',
        service: 'Service',
        customer: 'Customer',
        date: 'Date',
        time: 'Time',
        pending: 'Pending',
        stepService: 'Service',
        stepCustomer: 'Customer details',
        stepDate: 'Date',
        stepTime: 'Time',
        fullName: 'Full name',
        optionalEmail: 'Optional email',
        continue: 'Continue',
        calculating: 'Calculating availability...',
        selected: 'Done',
        confirmAppointment: 'Confirm booking',
        reviewBooking: 'Review your booking',
        business: 'Business',
        phone: 'Phone',
        price: 'Price',
        edit: 'Edit',
        confirming: 'Confirming...',
        completeName: 'Enter your name.',
        invalidPhone: 'Enter a valid phone number.',
        selectAll: 'Select service, date and time.',
        createError: 'Could not create the booking.',
        pastDate: 'You cannot book a past date.',
        dayUnavailable: 'This day is not available. Reason:',
        loadingScheduleError: 'Error loading schedule.',
        closedDay: 'We are closed on this day.',
        invalidDuration: 'This service does not have a valid duration.',
        noSlots: 'No available times for this date.',
      },
    }

    const t = COPY[language]

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

    function serviceName(service: Service) {
      return language === 'en' ? translateService(service).name : service.name
    }

    function serviceDescription(service: Service) {
      return language === 'en'
        ? translateService(service).description
        : service.description
    }

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
        setMessage(t.completeName)
        return
      }

      if (!isValidPhoneNumber(customerPhone)) {
        setMessage(t.invalidPhone)
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
        setMessage(t.pastDate)
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
        setMessage(t.dayUnavailable + ` ${dayOff.reason}`)
        setLoadingSlots(false)
        return
      }

      const { data: rules, error: rulesError } = await supabase
        .from('availability_rules')
        .select('*')
        .eq('day_of_week', dayOfWeek)

      if (rulesError) {
        setMessage(t.loadingScheduleError)
        setLoadingSlots(false)
        return
      }

      const activeRules = (rules || []).filter((rule) => rule.is_active !== false)

      if (activeRules.length === 0) {
        setMessage(t.closedDay)
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
        setMessage(t.invalidDuration)
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
        setMessage(t.noSlots)
      }

      setLoadingSlots(false)
    }

    function handleSelectSlot(slot: string) {
      setSelectedSlot(slot)
      setConfirmOpen(true)
    }

    async function submitBooking() {
      if (!selectedService || !date || !selectedSlot) {
        setMessage(t.selectAll)
        return
      }

      if (!customerName.trim()) {
        setMessage(t.completeName)
        return
      }

      if (!isValidPhoneNumber(customerPhone)) {
        setMessage(t.invalidPhone)
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
        setMessage(data?.error || t.createError)
        setSubmitting(false)
        setConfirmOpen(false)
        return
      }

      const params = new URLSearchParams({
        name: customerName,
        service: serviceName(selectedService),
        date,
        time: selectedSlot,
      })

      if (language === 'en') params.set('lang', 'en')

      window.location.href = `/reserva-confirmada?${params.toString()}`
    }

    if (loading || !business) {
      return (
        <NeutralLoader eyebrow={t.loadingEyebrow} title={t.loadingTitle} />
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
              {t.pausedEyebrow}
            </p>

            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
              {t.pausedTitle}
            </h1>

            <p className="mt-4 text-sm leading-7 text-[var(--app-muted)]">
              {t.pausedText}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link href={`/${langQuery}`} className="btn-secondary">
                {t.home}
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
              {business?.name || 'Champions Barbershop'}
            </Link>

            <Link
              href={`/${langQuery}`}
              className="border border-white/15 px-4 py-2 text-sm font-semibold text-[var(--app-muted)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
            >
              {t.back}
            </Link>
          </div>
        </header>

        <section className="mx-auto grid max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[0.85fr_1.15fr] lg:px-8 lg:py-12">
          <aside className="lg:sticky lg:top-28 lg:h-fit">
            <div className="border border-white/10 bg-[var(--app-surface)] p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--brand)]">
                {t.bookingEyebrow}
              </p>

              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
                {t.bookingTitle}
              </h1>

              <p className="mt-5 text-sm leading-7 text-[var(--app-muted)]">
                {t.bookingText}
              </p>

              <div className="mt-6 border-t border-white/10 pt-5">
                <SummaryRow label={t.service} value={selectedService ? serviceName(selectedService) : t.pending} />
                <SummaryRow label={t.customer} value={customerName || t.pending} />
                <SummaryRow
                  label={t.date}
                  value={date ? formatDate(date) : t.pending}
                />
                <SummaryRow
                  label={t.time}
                  value={
                    selectedSlot
                      ? formatTime(selectedSlot, business?.time_format || '24h')
                      : t.pending
                  }
                />
              </div>
            </div>
          </aside>

          <div className="space-y-3">
            <AccordionPanel
              step="01"
              title={t.service}
              active={activeStep === 'service'}
              completed={Boolean(selectedService)}
              summary={selectedService?.name}
              onOpen={() => setActiveStep('service')}
              completedText={t.selected}
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
                          <h3 className="text-lg font-semibold">{serviceName(service)}</h3>
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--app-muted)]">
                            {serviceDescription(service)}
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
              title={t.stepCustomer}
              active={activeStep === 'client'}
              completed={Boolean(customerName.trim() && isValidPhoneNumber(customerPhone))}
              summary={customerName || undefined}
              disabled={!selectedService}
              onOpen={() => selectedService && setActiveStep('client')}
              completedText={t.selected}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <Input value={customerName} onChange={setCustomerName} placeholder={t.fullName} />
                <PhoneField value={customerPhone} onChange={setCustomerPhone} />

                <div className="sm:col-span-2">
                  <Input value={customerEmail} onChange={setCustomerEmail} placeholder={t.optionalEmail} />
                </div>
              </div>

              <button
                onClick={continueToDate}
                className="mt-5 bg-[var(--brand)] px-6 py-4 text-sm font-semibold text-[var(--app-bg)] transition hover:opacity-90"
              >
                {t.continue}
              </button>
            </AccordionPanel>

            <AccordionPanel
              step="03"
              title={t.stepDate}
              active={activeStep === 'date'}
              completed={Boolean(date)}
              summary={date || undefined}
              disabled={!selectedService || !customerName.trim() || !isValidPhoneNumber(customerPhone)}
              onOpen={() => selectedService && customerName && customerPhone && setActiveStep('date')}
              completedText={t.selected}
            >
              <DateSelector value={date} onChange={selectDate} days={21} />
            </AccordionPanel>

            <AccordionPanel
              step="04"
              title={t.stepTime}
              active={activeStep === 'time'}
              completed={Boolean(selectedSlot)}
              summary={selectedSlot || undefined}
              disabled={!date}
              onOpen={() => date && setActiveStep('time')}
              completedText={t.selected}
            >
              {loadingSlots && (
                <div className="space-y-4">
                  <p className="text-sm text-[var(--app-muted)]">
                    {t.calculating}
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
            serviceName={serviceName(selectedService)}
            language={language}
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
    completedText,
    disabled,
    summary,
    onOpen,
    children,
  }: {
    step: string
    title: string
    active: boolean
    completed?: boolean
    completedText: string
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
                  {completedText}
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
    serviceName,
    language,
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
    serviceName: string
    language: 'es' | 'en'
    name: string
    phone: string
    date: string
    time: string
    submitting: boolean
    onClose: () => void
    onConfirm: () => void
  }) {
    const t = {
      es: {
        eyebrow: 'Confirmar cita',
        title: 'Revisa tu reserva',
        close: 'Cerrar',
        business: 'Negocio',
        customer: 'Cliente',
        phone: 'Teléfono',
        service: 'Servicio',
        date: 'Fecha',
        time: 'Hora',
        price: 'Precio',
        edit: 'Editar',
        confirming: 'Confirmando...',
        confirm: 'Confirmar cita',
      },
      en: {
        eyebrow: 'Confirm booking',
        title: 'Review your booking',
        close: 'Close',
        business: 'Business',
        customer: 'Customer',
        phone: 'Phone',
        service: 'Service',
        date: 'Date',
        time: 'Time',
        price: 'Price',
        edit: 'Edit',
        confirming: 'Confirming...',
        confirm: 'Confirm booking',
      },
    }[language]
    return (
      <div className="fixed inset-0 z-[100] flex items-end bg-black/70 p-0 sm:items-center sm:p-5">
        <section className="animate-modal-in max-h-[92dvh] w-full overflow-y-auto border border-white/10 bg-[var(--app-bg)] p-5 text-[var(--app-text)] shadow-2xl sm:mx-auto sm:max-w-lg sm:p-6">
          <div className="flex items-start justify-between gap-5 border-b border-white/10 pb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--brand)]">
                {t.eyebrow}
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                {t.title}
              </h2>
            </div>

            <button
              onClick={onClose}
              className="btn-secondary px-3 py-2"
            >
              {t.close}
            </button>
          </div>

          <div className="mt-5 divide-y divide-white/10 border border-white/10">
            <ModalRow label={t.business} value={business?.name || 'Champions Barbershop'} />
            <ModalRow label={t.customer} value={name} />
            <ModalRow label={t.phone} value={phone} />
            <ModalRow label={t.service} value={serviceName} />
            <ModalRow label={t.date} value={date ? formatDate(date) : '—'} />
            <ModalRow
              label={t.time}
              value={formatTime(time, business?.time_format || '24h')}
            />
            <ModalRow
              label={t.price}
              value={formatCurrency(Number(service.price), business?.currency || 'EUR')}
            />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              {t.edit}
            </button>

            <button
              onClick={onConfirm}
              disabled={submitting}
              className="btn-primary disabled:opacity-50"
            >
              {submitting ? t.confirming : t.confirm}
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