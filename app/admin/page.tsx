'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils'
import {
    addMinutes,
    generateSlots,
    getDayOfWeek,
    isPastDate,
    isPastSlot,
    rangesOverlap,
} from '@/lib/booking'
import { buildThemeStyle } from '@/lib/theme'
import { NeutralLoader } from '@/components/ui/NeutralLoader'
import {
    CalendarDays,
    CheckCircle2,
    Clock,
    XCircle,
    Scissors,
    Settings,
    CalendarClock,
    Package,
    Plus,
    Pencil,
    Trash2,
    ImageIcon,
} from 'lucide-react'
import {
    clearAdminActivity,
    getAdminInactivityExpired,
    setLogoutReason,
    touchAdminActivity,
} from '@/lib/adminSession'
import { DateSelector } from '@/components/ui/DateSelector'
import { TimeSelector } from '@/components/ui/TimeSelector'
import { AdminModal } from '@/components/admin/AdminModal'
import { ModalFooter } from '@/components/admin/ModalFooter'
import { AppDialog, type AppDialogState } from '@/components/admin/AppDialog'
import { AdminButton } from '@/components/admin/AdminButton'
import { AdminCard } from '@/components/admin/AdminCard'
import { MetricCard } from '@/components/admin/MetricCard'
import { SectionHeader } from '@/components/admin/SectionHeader'
import { AdminPanel } from '@/components/admin/AdminPanel'
import { StatusBadge, ActiveBadge } from '@/components/admin/StatusBadge'

type Section = 'home' | 'appointments' | 'services' | 'products' | 'schedule' | 'settings'
type AppointmentFilter =
    | 'today'
    | 'tomorrow'
    | 'week'
    | 'pending'
    | 'confirmed'
    | 'completed'
    | 'cancelled'
    | 'all'
type AsyncVoid = () => Promise<void>

const NAV_ITEMS: {
    id: Section
    label: string
    mobileLabel: string
    icon: React.ReactNode
}[] = [
        { id: 'home', label: 'Panel', mobileLabel: 'Inicio', icon: <CalendarClock size={16} /> },
        { id: 'appointments', label: 'Citas', mobileLabel: 'Citas', icon: <CalendarDays size={16} /> },
        { id: 'services', label: 'Servicios', mobileLabel: 'Servicios', icon: <Scissors size={16} /> },
        { id: 'products', label: 'Productos', mobileLabel: 'Productos', icon: <Package size={16} />, },
        { id: 'schedule', label: 'Disponibilidad', mobileLabel: 'Horario', icon: <Clock size={16} /> },
        { id: 'settings', label: 'Ajustes', mobileLabel: 'Ajustes', icon: <Settings size={16} /> },
    ]

const SECTION_TITLES: Record<Section, string> = {
    home: 'Panel de control',
    appointments: 'Citas',
    services: 'Servicios',
    products: 'Productos',
    schedule: 'Disponibilidad',
    settings: 'Ajustes',
}

const WEEK_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export default function AdminPage() {
    const [dialog, setDialog] = useState<AppDialogState | null>(null)
    const [section, setSection] = useState<Section>('home')
    const [loading, setLoading] = useState(true)
    const [business, setBusiness] = useState<any>(null)
    const [appointments, setAppointments] = useState<any[]>([])
    const [services, setServices] = useState<any[]>([])
    const [availability, setAvailability] = useState<any[]>([])
    const [rescheduleAppointment, setRescheduleAppointment] = useState<any>(null)
    const [appointmentFilter, setAppointmentFilter] = useState<AppointmentFilter>('today')
    const [calendarOpen, setCalendarOpen] = useState(false)
    const [whatsappAppointment, setWhatsappAppointment] = useState<any>(null)
    const [products, setProducts] = useState<any[]>([])

    useEffect(() => {
        bootstrap()
    }, [])

    useEffect(() => {
        const events = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart']

        function handleActivity() {
            if (getAdminInactivityExpired()) {
                supabase.auth.signOut().then(() => {
                    clearAdminActivity()
                    setLogoutReason('Tu sesión se cerró por inactividad. Vuelve a iniciar sesión.')
                    window.location.href = '/login'
                })

                return
            }

            touchAdminActivity()
        }

        events.forEach((event) => window.addEventListener(event, handleActivity))

        const interval = window.setInterval(() => {
            if (getAdminInactivityExpired()) {
                supabase.auth.signOut().then(() => {
                    clearAdminActivity()
                    setLogoutReason('Tu sesión se cerró por inactividad. Vuelve a iniciar sesión.')
                    window.location.href = '/login'
                })
            }
        }, 60 * 1000)

        return () => {
            events.forEach((event) => window.removeEventListener(event, handleActivity))
            window.clearInterval(interval)
        }
    }, [])

    useEffect(() => {
        if (!business) return

        const theme = buildThemeStyle(business)

        Object.entries(theme).forEach(([key, value]) => {
            document.documentElement.style.setProperty(key, String(value))
        })

        return () => {
            Object.keys(theme).forEach((key) => {
                document.documentElement.style.removeProperty(key)
            })
        }
    }, [business])

    async function bootstrap() {
        const { data } = await supabase.auth.getUser()

        if (!data.user) {
            setLogoutReason('Debes iniciar sesión para acceder al panel de administración.')
            window.location.href = '/login'
            return
        }

        if (getAdminInactivityExpired()) {
            await supabase.auth.signOut()
            clearAdminActivity()
            setLogoutReason('Tu sesión se cerró por inactividad. Vuelve a iniciar sesión.')
            window.location.href = '/login'
            return
        }

        touchAdminActivity()

        await loadData()
        setLoading(false)
    }

    async function loadData() {
        const [
            businessResult,
            appointmentResult,
            serviceResult,
            productResult,
            availabilityResult,
        ] = await Promise.all([
            supabase.from('business_settings').select('*').single(),
            supabase
                .from('appointments')
                .select('*, services(name, price, duration_minutes)')
                .order('date', { ascending: true })
                .order('start_time', { ascending: true }),
            supabase.from('services').select('*').order('price'),
            supabase
                .from('products')
                .select('*')
                .order('sort_order', { ascending: true })
                .order('created_at', { ascending: false }),
            supabase.from('availability_rules').select('*').order('day_of_week'),
        ])

        setBusiness(businessResult.data)
        setAppointments(appointmentResult.data || [])
        setServices(serviceResult.data || [])
        setProducts(productResult.data || [])
        setAvailability(availabilityResult.data || [])

        if (
            businessResult.error ||
            appointmentResult.error ||
            serviceResult.error ||
            productResult.error ||
            availabilityResult.error
        ) {
            notify('No se pudieron cargar todos los datos', 'Revisa tu conexión o intenta nuevamente.', 'danger')
        }
    }

    async function logout() {
        askConfirm({
            title: 'Cerrar sesión',
            message: '¿Seguro que quieres salir del panel?',
            tone: 'danger',
            onConfirm: async () => {
                await supabase.auth.signOut()
                clearAdminActivity()
                setLogoutReason('Sesión cerrada correctamente.')
                window.location.href = '/login'
            },
        })
    }

    function notify(title: string, message?: string, tone: 'success' | 'danger' | 'info' = 'info') {
        setDialog({ type: 'notice', title, message, tone })
    }

    function askConfirm({
        title,
        message,
        tone = 'danger',
        onConfirm,
    }: {
        title: string
        message?: string
        tone?: 'danger' | 'info'
        onConfirm: () => void | Promise<void>
    }) {
        setDialog({ type: 'confirm', title, message, tone, onConfirm })
    }

    async function updateAppointmentStatus(id: string, status: string) {
        const labels: Record<string, string> = {
            confirmed: 'confirmar',
            cancelled: 'cancelar',
            completed: 'marcar como completada',
        }

        askConfirm({
            title: 'Confirmar acción',
            message: `¿Seguro que quieres ${labels[status] || 'actualizar'} esta cita?`,
            tone: status === 'cancelled' ? 'danger' : 'info',
            onConfirm: async () => {
                const { error } = await supabase
                    .from('appointments')
                    .update({ status })
                    .eq('id', id)
                    .neq('status', 'cancelled')

                if (error) {
                    notify('No se pudo actualizar la cita', 'Intenta nuevamente.', 'danger')
                    return
                }

                await loadData()

                setRescheduleAppointment(null)
                setWhatsappAppointment(null)

                notify(
                    'Cita actualizada',
                    'La cita fue actualizada correctamente. Ahora puedes notificar al cliente por WhatsApp.',
                    'success'
                )
            },
        })
    }

    const stats = useMemo(() => {
        const today = new Date()

        const toISODate = (date: Date) => date.toISOString().split('T')[0]

        const todayStr = toISODate(today)

        const yesterday = new Date(today)
        yesterday.setDate(today.getDate() - 1)

        const sevenDaysAgo = new Date(today)
        sevenDaysAgo.setDate(today.getDate() - 6)

        const fifteenDaysAgo = new Date(today)
        fifteenDaysAgo.setDate(today.getDate() - 14)

        const monthAgo = new Date(today)
        monthAgo.setMonth(today.getMonth() - 1)

        const completedAppointments = appointments.filter(
            (appointment) => appointment.status === 'completed'
        )

        function revenueBetween(start: string, end: string) {
            return completedAppointments
                .filter((appointment) => appointment.date >= start && appointment.date <= end)
                .reduce(
                    (sum, appointment) => sum + Number(appointment.services?.price || 0),
                    0
                )
        }

        const todayAppointments = appointments.filter(
            (appointment) => appointment.date === todayStr
        )

        const pending = appointments.filter((appointment) =>
            ['pending', 'confirmed'].includes(appointment.status)
        )

        const revenueToday = revenueBetween(todayStr, todayStr)
        const revenueYesterday = revenueBetween(toISODate(yesterday), toISODate(yesterday))
        const revenue7Days = revenueBetween(toISODate(sevenDaysAgo), todayStr)
        const revenue15Days = revenueBetween(toISODate(fifteenDaysAgo), todayStr)
        const revenueMonth = revenueBetween(toISODate(monthAgo), todayStr)

        return {
            today: todayAppointments.length,
            pending: pending.length,
            services: services.length,
            revenue: revenueToday,
            revenueToday,
            revenueYesterday,
            revenue7Days,
            revenue15Days,
            revenueMonth,
        }
    }, [appointments, services.length])

    function getFilteredAppointments() {
        const today = new Date()
        const todayStr = today.toISOString().split('T')[0]

        const tomorrow = new Date(today)
        tomorrow.setDate(today.getDate() + 1)
        const tomorrowStr = tomorrow.toISOString().split('T')[0]

        const weekEnd = new Date(today)
        weekEnd.setDate(today.getDate() + 7)
        const weekEndStr = weekEnd.toISOString().split('T')[0]

        return appointments.filter((appointment) => {
            if (appointmentFilter === 'today') return appointment.date === todayStr
            if (appointmentFilter === 'tomorrow') return appointment.date === tomorrowStr
            if (appointmentFilter === 'week') {
                return appointment.date >= todayStr && appointment.date <= weekEndStr
            }
            if (appointmentFilter === 'pending') return appointment.status === 'pending'
            if (appointmentFilter === 'confirmed') return appointment.status === 'confirmed'
            if (appointmentFilter === 'completed') return appointment.status === 'completed'
            if (appointmentFilter === 'cancelled') return appointment.status === 'cancelled'

            return true
        })
    }

    if (loading || !business) {
        return (
            <NeutralLoader
                eyebrow="Admin Panel"
                title="Cargando panel..."
            />
        )
    }

    return (
        <main
            style={buildThemeStyle(business)}
            className="min-h-screen overflow-x-hidden bg-[var(--app-bg)] text-[var(--app-text)]"
        >
            <div className="min-h-screen">
                <aside className="hidden border-r border-white/10 bg-[var(--app-surface)]/70 lg:fixed lg:inset-y-0 lg:left-0 lg:block lg:w-[280px]">
                    <div className="flex h-screen flex-col p-6">
                        <div className="border-b border-white/10 pb-6">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--brand)]">
                                Admin
                            </p>
                            <h1 className="mt-3 text-xl font-semibold tracking-[-0.03em]">
                                {business?.name || 'Champions Barbershop'}
                            </h1>
                        </div>

                        <DesktopNav section={section} setSection={setSection} />

                        <div className="mt-auto space-y-3 border-t border-white/10 pt-6">
                            <Link href="/" className="btn-secondary block text-center">
                                Ver web pública
                            </Link>
                            <button onClick={logout} className="btn-danger w-full text-left">
                                Cerrar sesión
                            </button>
                        </div>
                    </div>
                </aside>

                <section className="min-w-0 pb-24 lg:ml-[280px] lg:pb-0">
                    <header className="sticky top-0 z-40 border-b border-white/10 bg-[var(--app-bg)]/85 backdrop-blur-xl">
                        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--brand)] lg:hidden">
                                    Admin
                                </p>
                                <h1 className="text-lg font-semibold tracking-[-0.02em]">
                                    {SECTION_TITLES[section]}
                                </h1>
                            </div>

                            <div className="flex items-center gap-3">
                                <Link href="/" className="btn-secondary hidden sm:block">
                                    Web pública
                                </Link>
                                <button onClick={logout} className="btn-danger lg:hidden">
                                    Salir
                                </button>
                            </div>
                        </div>
                    </header>

                    <div className="mx-auto max-w-7xl px-5 py-6 lg:px-8 lg:py-8">
                        {section === 'home' && (
                            <HomeSection
                                stats={stats}
                                business={business}
                                setSection={setSection}
                            />
                        )}

                        {section === 'appointments' && (
                            <AppointmentsSection
                                appointments={getFilteredAppointments()}
                                allAppointments={appointments}
                                business={business}
                                filter={appointmentFilter}
                                setFilter={setAppointmentFilter}
                                updateAppointmentStatus={updateAppointmentStatus}
                                onReschedule={setRescheduleAppointment}
                                onOpenCalendar={() => setCalendarOpen(true)}
                                onNotify={setWhatsappAppointment}
                            />
                        )}

                        {section === 'services' && (
                            <ServicesSection
                                services={services}
                                reload={loadData}
                                notify={notify}
                                askConfirm={askConfirm}
                                business={business}
                            />
                        )}

                        {section === 'products' && (
                            <ProductsSection
                                products={products}
                                business={business}
                                reload={loadData}
                                notify={notify}
                                askConfirm={askConfirm}
                            />
                        )}

                        {section === 'schedule' && (
                            <ScheduleSection
                                availability={availability}
                                setAvailability={setAvailability}
                                reload={loadData}
                                notify={notify}
                                askConfirm={askConfirm}
                                business={business}
                            />
                        )}

                        {section === 'settings' && (
                            <SettingsSection
                                business={business}
                                setBusiness={setBusiness}
                                notify={notify}
                            />
                        )}
                    </div>
                </section>
            </div>

            <MobileNav section={section} setSection={setSection} />

            {rescheduleAppointment && (
                <RescheduleModal
                    appointment={rescheduleAppointment}
                    business={business}
                    askConfirm={askConfirm}
                    notify={notify}
                    onClose={() => setRescheduleAppointment(null)}
                    onUpdated={async () => {
                        setRescheduleAppointment(null)
                        await loadData()
                    }}
                />
            )}
            {dialog && (
                <AppDialog
                    dialog={dialog}
                    onClose={() => setDialog(null)}
                />
            )}
            {calendarOpen && (
                <CalendarAppointmentsModal
                    appointments={appointments}
                    business={business}
                    onClose={() => setCalendarOpen(false)}
                />
            )}

            {whatsappAppointment && (
                <WhatsAppNotifyModal
                    appointment={whatsappAppointment}
                    business={business}
                    onClose={() => setWhatsappAppointment(null)}
                />
            )}
        </main>
    )
}

function WhatsAppNotifyModal({
    appointment,
    business,
    onClose,
}: {
    appointment: any
    business: any
    onClose: () => void
}) {
    const statusText: Record<string, string> = {
        pending: 'Tu cita está pendiente de confirmación',
        confirmed: 'Tu cita ha sido confirmada',
        completed: 'Tu cita fue completada',
    }

    const message = `✨ *¡Hola ${appointment.customer_name}!* ✨

📅 *${statusText[appointment.status] || 'Actualización de tu cita'}*

🏢 *Negocio:* ${business?.name || 'Champions Barbershop'}
🗓️ *Fecha:* ${formatDate(appointment.date)}
🕒 *Hora:* ${formatTime(appointment.start_time, business?.time_format || '24h')}
💇 *Servicio:* ${appointment.services?.name || 'Servicio'}

✅ Te esperamos.
📲 Si necesitas realizar algún cambio, contáctanos con anticipación.`

    const phone = String(appointment.customer_phone || '').replace(/\D/g, '')
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`

    return (
        <AdminModal
            eyebrow="WhatsApp"
            title="Notificar cliente"
            onClose={onClose}
            footer={
                <ModalFooter
                    onCancel={onClose}
                    onConfirm={() => {
                        window.open(url, '_blank', 'noopener,noreferrer')
                        onClose()
                    }}
                    confirmText="Abrir WhatsApp"
                />
            }
        >
            <p className="text-sm leading-7 text-[var(--app-muted)]">
                Se abrirá WhatsApp con un mensaje listo para enviar al cliente.
            </p>

            <div className="mt-5 border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm leading-7">{message}</p>
            </div>
        </AdminModal>
    )
}

function CalendarAppointmentsModal({
    appointments,
    business,
    onClose,
}: {
    appointments: any[]
    business: any
    onClose: () => void
}) {
    const today = new Date().toISOString().split('T')[0]
    const [selectedDate, setSelectedDate] = useState(today)

    const days = Array.from({ length: 14 }).map((_, index) => {
        const date = new Date()
        date.setDate(date.getDate() + index)
        return date.toISOString().split('T')[0]
    })

    const dayAppointments = appointments.filter((appointment) => appointment.date === selectedDate)

    return (
        <AdminModal
            eyebrow="Calendario"
            title="Vista de citas"
            onClose={onClose}
        >
            <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
                <div className="grid gap-2">
                    {days.map((date) => (
                        <button
                            key={date}
                            onClick={() => setSelectedDate(date)}
                            className={`border px-4 py-3 text-left text-sm font-semibold transition ${selectedDate === date
                                ? 'border-[var(--brand)] bg-[var(--brand)] text-[var(--app-bg)]'
                                : 'border-white/10 text-[var(--app-muted)] hover:border-[var(--brand)]'
                                }`}
                        >
                            {formatDate(date)}
                        </button>
                    ))}
                </div>

                <div className="space-y-3">
                    {dayAppointments.map((appointment) => (
                        <div
                            key={appointment.id}
                            className="border border-white/10 bg-white/[0.04] p-4"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="font-semibold">{appointment.customer_name}</p>
                                    <p className="mt-1 text-sm text-[var(--app-muted)]">
                                        {appointment.services?.name || 'Servicio'} ·{' '}
                                        {formatTime(appointment.start_time, business?.time_format || '24h')}
                                    </p>
                                </div>
                                <StatusBadge status={appointment.status} />
                            </div>
                        </div>
                    ))}

                    {dayAppointments.length === 0 && (
                        <p className="text-sm text-[var(--app-muted)]">
                            No hay citas para este día.
                        </p>
                    )}
                </div>
            </div>
        </AdminModal>
    )
}

function HomeSection({
    stats,
    business,
    setSection,
}: {
    stats: {
        today: number
        pending: number
        services: number
        revenue: number
        revenueToday: number
        revenueYesterday: number
        revenue7Days: number
        revenue15Days: number
        revenueMonth: number
    }
    business: any
    setSection: (section: Section) => void
}) {
    return (
        <section className="animate-fade-in">
            <SectionHeader
                eyebrow="Resumen"
                title="Panel de control"
                description="Gestiona citas, servicios, disponibilidad y configuración visual del negocio."
                action={
                    <Link href="/reservar" className="btn-primary text-center">
                        Crear reserva manual
                    </Link>
                }
            />

            <div className="mt-6 grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Citas hoy" value={stats.today} />
                <MetricCard label="Pendientes / activas" value={stats.pending} />
                <MetricCard label="Servicios" value={stats.services} />
                <MetricCard
                    label="Ingresos hoy"
                    value={formatCurrency(stats.revenueToday, business?.currency || 'EUR')}
                />
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_0.9fr]">
                <RevenueDashboard stats={stats} business={business} />

                <div className="grid gap-4 sm:grid-cols-2">
                    <MetricCard
                        label="Ingresos ayer"
                        value={formatCurrency(stats.revenueYesterday, business?.currency || 'EUR')}
                    />
                    <MetricCard
                        label="Últimos 7 días"
                        value={formatCurrency(stats.revenue7Days, business?.currency || 'EUR')}
                    />
                    <MetricCard
                        label="Últimos 15 días"
                        value={formatCurrency(stats.revenue15Days, business?.currency || 'EUR')}
                    />
                    <MetricCard
                        label="Último mes"
                        value={formatCurrency(stats.revenueMonth, business?.currency || 'EUR')}
                    />
                </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-4">
                <QuickAction
                    title="Citas"
                    text="Revisa, cancela o reagenda reservas."
                    onClick={() => setSection('appointments')}
                />
                <QuickAction
                    title="Servicios"
                    text="Edita precios, duración y disponibilidad."
                    onClick={() => setSection('services')}
                />
                <QuickAction
                    title="Disponibilidad"
                    text="Gestiona horarios, descansos y días libres."
                    onClick={() => setSection('schedule')}
                />
                <QuickAction
                    title="Productos"
                    text="Gestiona productos visibles en la landing."
                    onClick={() => setSection('products')}
                />
            </div>
        </section>
    )
}

function RevenueDashboard({
    stats,
    business,
}: {
    stats: {
        revenueToday: number
        revenueYesterday: number
        revenue7Days: number
        revenue15Days: number
        revenueMonth: number
    }
    business: any
}) {
    const items = [
        { label: 'Hoy', value: stats.revenueToday },
        { label: 'Ayer', value: stats.revenueYesterday },
        { label: '7 días', value: stats.revenue7Days },
        { label: '15 días', value: stats.revenue15Days },
        { label: 'Mes', value: stats.revenueMonth },
    ]

    const maxValue = Math.max(...items.map((item) => item.value), 1)

    return (
        <section className="border border-white/10 bg-[var(--app-surface)] p-5">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--brand)]">
                        Ingresos
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                        Rendimiento reciente
                    </h3>
                </div>
            </div>

            <div className="mt-6 space-y-4">
                {items.map((item) => {
                    const width = `${Math.max((item.value / maxValue) * 100, item.value > 0 ? 8 : 0)}%`

                    return (
                        <div key={item.label}>
                            <div className="mb-2 flex items-center justify-between gap-4">
                                <span className="text-sm font-semibold">{item.label}</span>
                                <span className="text-sm text-[var(--app-muted)]">
                                    {formatCurrency(item.value, business?.currency || 'EUR')}
                                </span>
                            </div>

                            <div className="h-3 overflow-hidden bg-white/[0.06]">
                                <div
                                    style={{ width }}
                                    className="h-full bg-[var(--brand)] transition-all duration-500"
                                />
                            </div>
                        </div>
                    )
                })}
            </div>

            <p className="mt-5 text-xs leading-5 text-[var(--app-muted)]">
                Solo se cuentan citas completadas automáticamente o manualmente.
            </p>
        </section>
    )
}

function DesktopNav({ section, setSection }: { section: Section; setSection: (section: Section) => void }) {
    return (
        <nav className="mt-6 space-y-1">
            {NAV_ITEMS.map((item) => (
                <button
                    key={item.id}
                    onClick={() => setSection(item.id)}
                    className={`w-full border px-4 py-3 text-left text-sm font-semibold transition duration-200 hover:-translate-y-0.5 active:translate-y-0 ${section === item.id
                        ? 'border-[var(--brand)] bg-[var(--brand)] text-[var(--app-bg)]'
                        : 'border-transparent text-[var(--app-muted)] hover:border-white/10 hover:text-[var(--app-text)]'
                        }`}
                >
                    <span className="inline-flex items-center gap-3">
                        {item.icon}
                        {item.label}
                    </span>
                </button>
            ))}
        </nav>
    )
}

function MobileNav({ section, setSection }: { section: Section; setSection: (section: Section) => void }) {
    return (
        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[var(--app-bg)]/95 px-2 py-2 backdrop-blur-xl lg:hidden">
            <div className="mx-auto grid max-w-lg grid-cols-6 gap-1">
                {NAV_ITEMS.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setSection(item.id)}
                        className={`px-2 py-3 text-[11px] font-semibold transition duration-200 active:scale-[0.98] ${section === item.id
                            ? 'bg-[var(--brand)] text-[var(--app-bg)]'
                            : 'text-[var(--app-muted)] hover:bg-white/[0.06]'
                            }`}
                    >
                        <span className="flex flex-col items-center gap-1">
                            {item.icon}
                            {item.mobileLabel}
                        </span>
                    </button>
                ))}
            </div>
        </nav>
    )
}

function AppointmentsSection({
    appointments,
    allAppointments,
    business,
    filter,
    setFilter,
    updateAppointmentStatus,
    onReschedule,
    onOpenCalendar,
    onNotify,
}: {
    appointments: any[]
    allAppointments: any[]
    business: any
    filter: AppointmentFilter
    setFilter: (filter: AppointmentFilter) => void
    updateAppointmentStatus: (id: string, status: string) => void
    onReschedule: (appointment: any) => void
    onOpenCalendar: () => void
    onNotify: (appointment: any) => void
}) {
    const filters: { id: AppointmentFilter; label: string }[] = [
        { id: 'today', label: 'Hoy' },
        { id: 'tomorrow', label: 'Mañana' },
        { id: 'week', label: 'Semana' },
        { id: 'pending', label: 'Pendientes' },
        { id: 'confirmed', label: 'Confirmadas' },
        { id: 'completed', label: 'Completadas' },
        { id: 'cancelled', label: 'Canceladas' },
        { id: 'all', label: 'Todas' },
    ]

    return (
        <section className="animate-fade-in">
            <SectionHeader
                eyebrow="Gestión"
                title="Citas"
                description="Filtra, revisa, confirma, cancela o reagenda reservas usando disponibilidad real."
                action={
                    <button onClick={onOpenCalendar} className="btn-primary gap-2">
                        <CalendarDays size={16} />
                        Vista calendario
                    </button>
                }
            />

            <div className="mt-6 overflow-x-auto border border-white/10 bg-[var(--app-surface)] p-3">
                <div className="flex min-w-max gap-2">
                    {filters.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setFilter(item.id)}
                            className={`border px-4 py-2 text-sm font-semibold transition ${filter === item.id
                                ? 'border-[var(--brand)] bg-[var(--brand)] text-[var(--app-bg)]'
                                : 'border-white/10 text-[var(--app-muted)] hover:border-[var(--brand)] hover:text-[var(--brand)]'
                                }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-4">
                <MetricCard icon={<CalendarClock size={18} />} label="Mostradas" value={appointments.length} />
                <MetricCard icon={<Clock size={18} />} label="Pendientes" value={allAppointments.filter((a) => a.status === 'pending').length} />
                <MetricCard icon={<CheckCircle2 size={18} />} label="Confirmadas" value={allAppointments.filter((a) => a.status === 'confirmed').length} />
                <MetricCard icon={<XCircle size={18} />} label="Canceladas" value={allAppointments.filter((a) => a.status === 'cancelled').length} />
            </div>

            <DataTable
                headers={['Cliente', 'Servicio', 'Fecha', 'Hora', 'Estado', 'Acciones']}
                rows={appointments.map((appointment) => [
                    <div key="customer">
                        <p className="font-semibold">{appointment.customer_name}</p>
                        <p className="mt-1 text-xs text-[var(--app-muted)]">
                            {appointment.customer_phone}
                        </p>
                    </div>,
                    appointment.services?.name || 'Servicio',
                    formatDate(appointment.date),
                    formatTime(appointment.start_time, business?.time_format || '24h'),
                    <StatusBadge key="status" status={appointment.status} />,
                    <RowActions key="actions">
                        {appointment.status === 'pending' && (
                            <AdminButton tone="success" onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}>
                                Confirmar
                            </AdminButton>
                        )}

                        {!['cancelled', 'completed'].includes(appointment.status) && (
                            <>
                                <AdminButton onClick={() => onReschedule(appointment)}>
                                    Reagendar
                                </AdminButton>

                                <AdminButton onClick={() => onNotify(appointment)}>
                                    WhatsApp
                                </AdminButton>
                            </>
                        )}

                        {!['cancelled', 'completed'].includes(appointment.status) && (
                            <AdminButton tone="danger" onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}>
                                Cancelar
                            </AdminButton>
                        )}
                    </RowActions>,
                ])}
            />

            <div className="mt-6 space-y-3 lg:hidden">
                {appointments.map((appointment) => (
                    <AdminCard key={appointment.id}>
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <p className="truncate text-lg font-semibold">
                                    {appointment.customer_name}
                                </p>
                                <p className="mt-1 text-sm text-[var(--app-muted)]">
                                    {appointment.services?.name || 'Servicio'}
                                </p>
                                <p className="mt-2 text-sm text-[var(--app-muted)]">
                                    {formatDate(appointment.date)} ·{' '}
                                    {formatTime(appointment.start_time, business?.time_format || '24h')}
                                </p>
                            </div>

                            <StatusBadge status={appointment.status} />
                        </div>

                        <div className="mt-5 grid gap-2">
                            {appointment.status === 'pending' && (
                                <AdminButton tone="success" full onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}>
                                    Confirmar cita
                                </AdminButton>
                            )}

                            {!['cancelled', 'completed'].includes(appointment.status) && (
                                <>
                                    <AdminButton full primary onClick={() => onReschedule(appointment)}>
                                        Reagendar
                                    </AdminButton>

                                    <AdminButton full onClick={() => onNotify(appointment)}>
                                        Notificar por WhatsApp
                                    </AdminButton>
                                </>
                            )}

                            {!['cancelled', 'completed'].includes(appointment.status) && (
                                <AdminButton tone="danger" full onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}>
                                    Cancelar
                                </AdminButton>
                            )}
                        </div>
                    </AdminCard>
                ))}
            </div>

            <EmptyState show={appointments.length === 0} text="No hay citas para este filtro." />
        </section>
    )
}

function ServicesSection({
    services,
    reload,
    notify,
    askConfirm,
    business,
}: {
    services: any[]
    reload: AsyncVoid
    notify: (title: string, message?: string, tone?: 'success' | 'danger' | 'info') => void
    askConfirm: (options: {
        title: string
        message?: string
        tone?: 'danger' | 'info'
        onConfirm: () => void | Promise<void>
    }) => void
    business: any
}) {
    const [modalOpen, setModalOpen] = useState(false)
    const [editingService, setEditingService] = useState<any>(null)

    function openCreateModal() {
        setEditingService(null)
        setModalOpen(true)
    }

    function openEditModal(service: any) {
        setEditingService(service)
        setModalOpen(true)
    }

    async function deleteService(id: string) {
        askConfirm({
            title: 'Eliminar servicio',
            message: 'Este servicio dejará de aparecer en la web y en el flujo de reservas.',
            tone: 'danger',
            onConfirm: async () => {
                const { error } = await supabase.from('services').delete().eq('id', id)

                if (error) {
                    notify('No se pudo eliminar el servicio', 'Intenta nuevamente.', 'danger')
                    return
                }

                await reload()
                notify('Servicio eliminado', 'El servicio fue eliminado correctamente.', 'success')
            },
        })
    }

    return (
        <section className="animate-fade-in">
            <SectionHeader
                eyebrow="Catálogo"
                title="Servicios"
                description="Crea, edita y activa los servicios que aparecen en la landing y en el flujo de reservas."
                action={
                    <button onClick={openCreateModal} className="btn-primary">
                        + Nuevo servicio
                    </button>
                }
            />

            <DataTable
                headers={['Servicio', 'Duración', 'Precio', 'Estado', 'Acciones']}
                rows={services.map((service) => [
                    <div key="service">
                        <p className="font-semibold">{service.name}</p>
                        <p className="mt-1 max-w-xl text-xs leading-5 text-[var(--app-muted)]">
                            {service.description || 'Sin descripción'}
                        </p>
                    </div>,
                    `${service.duration_minutes} min`,
                    <span key="price" className="font-semibold text-[var(--brand)]">
                        {formatCurrency(Number(service.price), business?.currency || 'EUR')}
                    </span>,
                    <ActiveBadge key="active" active={service.is_active} />,
                    <RowActions key="actions">
                        <AdminButton onClick={() => openEditModal(service)}>Editar</AdminButton>
                        <AdminButton tone="danger" onClick={() => deleteService(service.id)}>
                            Eliminar
                        </AdminButton>
                    </RowActions>,
                ])}
            />

            <div className="mt-6 grid gap-3 lg:hidden">
                {services.map((service) => (
                    <AdminCard key={service.id}>
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <p className="truncate text-lg font-semibold">{service.name}</p>
                                <p className="mt-1 text-sm text-[var(--app-muted)]">
                                    {service.duration_minutes} min · {formatCurrency(Number(service.price), business?.currency || 'EUR')}
                                </p>
                            </div>
                            <ActiveBadge active={service.is_active} />
                        </div>

                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--app-muted)]">
                            {service.description || 'Sin descripción'}
                        </p>

                        <div className="mt-5 grid grid-cols-2 gap-2">
                            <AdminButton primary full onClick={() => openEditModal(service)}>
                                Editar
                            </AdminButton>
                            <AdminButton tone="danger" full onClick={() => deleteService(service.id)}>
                                Eliminar
                            </AdminButton>
                        </div>
                    </AdminCard>
                ))}
            </div>

            <EmptyState show={services.length === 0} text="No hay servicios creados." />

            {modalOpen && (
                <ServiceFormModal
                    service={editingService}
                    onClose={() => setModalOpen(false)}
                    onSaved={async () => {
                        setModalOpen(false)
                        await reload()
                    }}
                />
            )}
        </section>
    )
}

function ProductsSection({
    products,
    business,
    reload,
    notify,
    askConfirm,
}: {
    products: any[]
    business: any
    reload: AsyncVoid
    notify: (title: string, message?: string, tone?: 'success' | 'danger' | 'info') => void
    askConfirm: (options: {
        title: string
        message?: string
        tone?: 'danger' | 'info'
        onConfirm: () => void | Promise<void>
    }) => void
}) {
    const [productModalOpen, setProductModalOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<any | null>(null)

    function openCreateModal() {
        setEditingProduct(null)
        setProductModalOpen(true)
    }

    function openEditModal(product: any) {
        setEditingProduct(product)
        setProductModalOpen(true)
    }

    function deleteProduct(id: string) {
        askConfirm({
            title: 'Eliminar producto',
            message: 'Este producto dejará de aparecer en la web pública.',
            tone: 'danger',
            onConfirm: async () => {
                const { error } = await supabase.from('products').delete().eq('id', id)

                if (error) {
                    notify('No se pudo eliminar el producto', 'Intenta nuevamente.', 'danger')
                    return
                }

                await reload()
                notify('Producto eliminado', 'El producto fue eliminado correctamente.', 'success')
            },
        })
    }

    return (
        <section className="animate-fade-in">
            <SectionHeader
                eyebrow="Catálogo"
                title="Productos"
                description="Gestiona productos informativos que aparecerán en el landing. No se venden online; solo se muestran al cliente."
                action={
                    <button onClick={openCreateModal} className="btn-primary inline-flex items-center gap-2">
                        <Plus size={16} />
                        Nuevo producto
                    </button>
                }
            />

            <div className="mt-6 hidden overflow-hidden border border-white/10 bg-white/10 lg:block">
                <table className="w-full border-collapse text-left text-sm">
                    <thead className="bg-[var(--app-surface)] text-xs uppercase tracking-wide text-[var(--app-muted)]">
                        <tr>
                            <th className="px-5 py-4 font-semibold">Producto</th>
                            <th className="px-5 py-4 font-semibold">Precio</th>
                            <th className="px-5 py-4 font-semibold">Orden</th>
                            <th className="px-5 py-4 font-semibold">Estado</th>
                            <th className="px-5 py-4 text-right font-semibold">Acciones</th>
                        </tr>
                    </thead>

                    <tbody>
                        {products.map((product) => (
                            <tr
                                key={product.id}
                                className="border-t border-white/10 bg-[var(--app-surface)] transition hover:bg-white/[0.04]"
                            >
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden border border-white/10 bg-white/[0.04]">
                                            {product.image_url ? (
                                                <img
                                                    src={product.image_url}
                                                    alt={product.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <ImageIcon size={18} className="text-[var(--app-muted)]" />
                                            )}
                                        </div>

                                        <div>
                                            <p className="font-semibold">{product.name}</p>
                                            <p className="mt-1 max-w-xl overflow-hidden text-ellipsis text-xs leading-5 text-[var(--app-muted)] [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">
                                                {product.description || 'Sin descripción'}
                                            </p>
                                        </div>
                                    </div>
                                </td>

                                <td className="px-5 py-4 font-semibold text-[var(--brand)]">
                                    {formatCurrency(Number(product.price || 0), business?.currency || 'EUR')}
                                </td>

                                <td className="px-5 py-4 text-[var(--app-muted)]">
                                    {product.sort_order ?? 0}
                                </td>

                                <td className="px-5 py-4">
                                    <ActiveBadge active={Boolean(product.is_active)} />
                                </td>

                                <td className="px-5 py-4">
                                    <div className="flex justify-end gap-2">
                                        <AdminButton
                                            icon={<Pencil size={14} />}
                                            onClick={() => openEditModal(product)}
                                        >
                                            Editar
                                        </AdminButton>

                                        <AdminButton
                                            tone="danger"
                                            icon={<Trash2 size={14} />}
                                            onClick={() => deleteProduct(product.id)}
                                        >
                                            Eliminar
                                        </AdminButton>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-6 grid gap-3 lg:hidden">
                {products.map((product) => (
                    <AdminCard key={product.id}>
                        <div className="flex items-start gap-4">
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border border-white/10 bg-white/[0.04]">
                                {product.image_url ? (
                                    <img
                                        src={product.image_url}
                                        alt={product.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <ImageIcon size={20} className="text-[var(--app-muted)]" />
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                    <p className="truncate text-lg font-semibold">{product.name}</p>
                                    <ActiveBadge active={Boolean(product.is_active)} />
                                </div>

                                <p className="mt-1 text-sm font-semibold text-[var(--brand)]">
                                    {formatCurrency(Number(product.price || 0), business?.currency || 'EUR')}
                                </p>

                                <p className="mt-2 overflow-hidden text-ellipsis text-sm leading-6 text-[var(--app-muted)] [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">
                                    {product.description || 'Sin descripción'}
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-2">
                            <AdminButton
                                full
                                primary
                                icon={<Pencil size={14} />}
                                onClick={() => openEditModal(product)}
                            >
                                Editar
                            </AdminButton>

                            <AdminButton
                                full
                                tone="danger"
                                icon={<Trash2 size={14} />}
                                onClick={() => deleteProduct(product.id)}
                            >
                                Eliminar
                            </AdminButton>
                        </div>
                    </AdminCard>
                ))}
            </div>

            {products.length === 0 && (
                <div className="mt-6 border border-white/10 bg-[var(--app-surface)] p-6">
                    <p className="text-sm text-[var(--app-muted)]">
                        No hay productos creados todavía.
                    </p>
                </div>
            )}

            {productModalOpen && (
                <ProductModal
                    product={editingProduct}
                    business={business}
                    onClose={() => setProductModalOpen(false)}
                    onSaved={async () => {
                        setProductModalOpen(false)
                        await reload()
                    }}
                    notify={notify}
                />
            )}
        </section>
    )
}

function ServiceFormModal({
    service,
    onClose,
    onSaved,
}: {
    service: any | null
    onClose: () => void
    onSaved: AsyncVoid
}) {
    const [name, setName] = useState(service?.name || '')
    const [description, setDescription] = useState(service?.description || '')
    const [durationMinutes, setDurationMinutes] = useState(service?.duration_minutes || 30)
    const [price, setPrice] = useState(service?.price || 0)
    const [isActive, setIsActive] = useState(service?.is_active ?? true)
    const [saving, setSaving] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')

    const isEditing = Boolean(service?.id)

    async function saveService() {
        if (!name.trim()) {
            setErrorMsg('El nombre del servicio es obligatorio.')
            return
        }

        if (Number(durationMinutes) <= 0) {
            setErrorMsg('La duración debe ser mayor que 0.')
            return
        }

        setSaving(true)
        setErrorMsg('')

        const payload = {
            name: name.trim(),
            description: description.trim() || null,
            duration_minutes: Number(durationMinutes),
            price: Number(price || 0),
            is_active: Boolean(isActive),
        }

        const { error } = isEditing
            ? await supabase.from('services').update(payload).eq('id', service.id)
            : await supabase.from('services').insert(payload)

        setSaving(false)

        if (error) {
            setErrorMsg(error.message)
            return
        }

        await onSaved()
    }

    return (
        <AdminModal
            eyebrow={isEditing ? 'Editar servicio' : 'Nuevo servicio'}
            title={isEditing ? service.name : 'Crear servicio'}
            onClose={onClose}
            footer={
                <ModalFooter
                    onCancel={onClose}
                    onConfirm={saveService}
                    confirmText={saving ? 'Guardando...' : 'Guardar servicio'}
                    disabled={saving}
                />
            }
        >
            <div className="space-y-4">
                <FieldLabel label="Nombre">
                    <input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        className="admin-input"
                        placeholder="Ej. Corte clásico"
                    />
                </FieldLabel>

                <FieldLabel label="Descripción">
                    <textarea
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        rows={4}
                        className="admin-input"
                        placeholder="Descripción visible para el cliente"
                    />
                </FieldLabel>

                <div className="grid grid-cols-2 gap-3">
                    <FieldLabel label="Duración">
                        <input
                            type="number"
                            min={5}
                            value={durationMinutes}
                            onChange={(event) => setDurationMinutes(Number(event.target.value))}
                            className="admin-input"
                        />
                    </FieldLabel>

                    <FieldLabel label="Precio">
                        <input
                            type="number"
                            min={0}
                            value={price}
                            onChange={(event) => setPrice(Number(event.target.value))}
                            className="admin-input"
                        />
                    </FieldLabel>
                </div>

                <ToggleField
                    label="Servicio activo"
                    description="Si está desactivado, no aparecerá en la reserva pública."
                    checked={Boolean(isActive)}
                    onChange={setIsActive}
                />

                <ErrorMessage message={errorMsg} />
            </div>
        </AdminModal>
    )
}

function ProductModal({
    product,
    business,
    onClose,
    onSaved,
    notify,
}: {
    product: any | null
    business: any
    onClose: () => void
    onSaved: () => Promise<void>
    notify: (title: string, message?: string, tone?: 'success' | 'danger' | 'info') => void
}) {
    const [name, setName] = useState(product?.name || '')
    const [description, setDescription] = useState(product?.description || '')
    const [imageUrl, setImageUrl] = useState(product?.image_url || '')
    const [price, setPrice] = useState(product?.price || 0)
    const [sortOrder, setSortOrder] = useState(product?.sort_order || 0)
    const [isActive, setIsActive] = useState(product?.is_active ?? true)
    const [saving, setSaving] = useState(false)

    const isEditing = Boolean(product?.id)

    async function saveProduct() {
        if (!name.trim()) {
            notify('Nombre obligatorio', 'Debes indicar el nombre del producto.', 'danger')
            return
        }

        setSaving(true)

        const payload = {
            name: name.trim(),
            description: description.trim() || null,
            image_url: imageUrl.trim() || null,
            price: Number(price || 0),
            sort_order: Number(sortOrder || 0),
            is_active: Boolean(isActive),
        }

        const { error } = isEditing
            ? await supabase.from('products').update(payload).eq('id', product.id)
            : await supabase.from('products').insert(payload)

        setSaving(false)

        if (error) {
            notify('No se pudo guardar el producto', 'Intenta nuevamente.', 'danger')
            return
        }

        notify(
            isEditing ? 'Producto actualizado' : 'Producto creado',
            'Los cambios fueron guardados correctamente.',
            'success'
        )

        await onSaved()
    }

    return (
        <AdminModal
            eyebrow={isEditing ? 'Editar producto' : 'Nuevo producto'}
            title={isEditing ? product.name : 'Crear producto'}
            onClose={onClose}
            size="lg"
            footer={
                <ModalFooter
                    onCancel={onClose}
                    onConfirm={saveProduct}
                    confirmText={saving ? 'Guardando...' : 'Guardar producto'}
                    disabled={saving}
                />
            }
        >
            <div className="grid gap-6 lg:grid-cols-[1fr_220px]">
                <div className="space-y-4">
                    <FieldLabel label="Nombre">
                        <input
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="Ej. Pomada premium"
                            className="admin-input"
                        />
                    </FieldLabel>

                    <FieldLabel label="Descripción">
                        <textarea
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            rows={4}
                            placeholder="Descripción visible en el landing"
                            className="admin-input"
                        />
                    </FieldLabel>

                    <FieldLabel label="URL de imagen">
                        <input
                            value={imageUrl}
                            onChange={(event) => setImageUrl(event.target.value)}
                            placeholder="https://..."
                            className="admin-input"
                        />
                    </FieldLabel>

                    <div className="grid grid-cols-2 gap-3">
                        <FieldLabel label="Precio">
                            <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={price}
                                onChange={(event) => setPrice(Number(event.target.value))}
                                className="admin-input"
                            />
                        </FieldLabel>

                        <FieldLabel label="Orden">
                            <input
                                type="number"
                                min={0}
                                value={sortOrder}
                                onChange={(event) => setSortOrder(Number(event.target.value))}
                                className="admin-input"
                            />
                        </FieldLabel>
                    </div>

                    <ToggleField
                        label="Producto activo"
                        description="Si está activo, aparecerá en la sección de productos del landing."
                        checked={Boolean(isActive)}
                        onChange={setIsActive}
                    />
                </div>

                <div className="border border-white/10 bg-white/[0.04] p-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--app-muted)]">
                        Vista previa
                    </p>

                    <div className="aspect-square overflow-hidden border border-white/10 bg-white/[0.04]">
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt={name || 'Producto'}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-[var(--app-muted)]">
                                <ImageIcon size={28} />
                            </div>
                        )}
                    </div>

                    <h3 className="mt-4 font-semibold">
                        {name || 'Nombre del producto'}
                    </h3>

                    <p className="mt-2 overflow-hidden text-ellipsis text-sm leading-6 text-[var(--app-muted)] [display:-webkit-box] [-webkit-line-clamp:3] [-webkit-box-orient:vertical]">
                        {description || 'Descripción del producto'}
                    </p>

                    <p className="mt-4 font-semibold text-[var(--brand)]">
                        {formatCurrency(Number(price || 0), business?.currency || 'EUR')}
                    </p>
                </div>
            </div>
        </AdminModal>
    )
}

function ScheduleSection({
    availability,
    setAvailability,
    reload,
    notify,
    askConfirm,
    business,
}: {
    availability: any[]
    setAvailability: (value: any) => void
    reload: AsyncVoid
    notify: (title: string, message?: string, tone?: 'success' | 'danger' | 'info') => void
    askConfirm: (options: {
        title: string
        message?: string
        tone?: 'danger' | 'info'
        onConfirm: () => void | Promise<void>
    }) => void
    business: any
}) {
    const [daysOff, setDaysOff] = useState<any[]>([])
    const [breaks, setBreaks] = useState<any[]>([])
    const [newDayOff, setNewDayOff] = useState('')
    const [newDayOffReason, setNewDayOffReason] = useState('')
    const [loading, setLoading] = useState(false)
    const [editingBreak, setEditingBreak] = useState<any | null>(null)

    useEffect(() => {
        loadAvailabilityExtras()
    }, [])

    async function loadAvailabilityExtras() {
        const today = new Date().toISOString().split('T')[0]
        const now = new Date().toTimeString().slice(0, 5)

        await supabase
            .from('breaks')
            .delete()
            .or(`date.lt.${today},and(date.eq.${today},end_time.lt.${now})`)

        const [daysOffResult, breaksResult] = await Promise.all([
            supabase.from('days_off').select('*').order('date'),
            supabase.from('breaks').select('*').order('date').order('start_time'),
        ])

        setDaysOff(daysOffResult.data || [])
        setBreaks(breaksResult.data || [])
    }

    function updateAvailabilityLocal(id: string, patch: any) {
        setAvailability((prev: any[]) =>
            prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
        )
    }

    async function createRule(day: number) {
        const { error } = await supabase.from('availability_rules').insert({
            day_of_week: day,
            start_time: '10:00',
            end_time: '20:00',
            is_active: true,
        })

        if (error) {
            notify('No se pudo abrir el día', 'Intenta nuevamente.', 'danger')
            return
        }

        await reload()
        notify('Día abierto', 'El horario semanal fue actualizado.', 'success')
    }

    async function updateRule(rule: any) {
        const { error } = await supabase
            .from('availability_rules')
            .update({
                start_time: String(rule.start_time).slice(0, 5),
                end_time: String(rule.end_time).slice(0, 5),
                is_active: rule.is_active,
            })
            .eq('id', rule.id)

        if (error) {
            notify('No se pudo actualizar el horario', 'Intenta nuevamente.', 'danger')
            return
        }

        notify('Horario actualizado', 'Los cambios fueron guardados.', 'success')
    }

    async function deleteRule(id: string) {
        askConfirm({
            title: 'Cerrar día semanal',
            message: 'Los clientes no podrán reservar en este día de la semana.',
            tone: 'danger',
            onConfirm: async () => {
                const { error } = await supabase.from('availability_rules').delete().eq('id', id)

                if (error) {
                    notify('No se pudo cerrar el día', 'Intenta nuevamente.', 'danger')
                    return
                }

                await reload()
            },
        })
    }

    async function createDayOff() {
        if (!newDayOff || !newDayOffReason.trim()) {
            notify(
                'Motivo obligatorio',
                'Debes indicar una fecha y un motivo para bloquear el día.',
                'danger'
            )
            return
        }

        const { data: appointmentsInDay } = await supabase
            .from('appointments')
            .select('*')
            .eq('date', newDayOff)
            .in('status', ['pending', 'confirmed'])

        async function saveDayOff() {
            setLoading(true)

            const { error } = await supabase.from('days_off').insert({
                date: newDayOff,
                reason: newDayOffReason.trim(),
            })

            if (error) {
                setLoading(false)
                notify('No se pudo bloquear el día', 'Intenta nuevamente.', 'danger')
                return
            }

            if (appointmentsInDay?.length) {
                await supabase
                    .from('appointments')
                    .update({
                        status: 'cancelled',
                        cancelled_at: new Date().toISOString(),
                    })
                    .eq('date', newDayOff)
                    .in('status', ['pending', 'confirmed'])
            }

            setLoading(false)
            setNewDayOff('')
            setNewDayOffReason('')
            await loadAvailabilityExtras()
            await reload()

            notify(
                'Día bloqueado',
                appointmentsInDay?.length
                    ? 'El día fue bloqueado y las citas afectadas fueron canceladas.'
                    : 'El día fue bloqueado correctamente.',
                'success'
            )
        }

        if (appointmentsInDay?.length) {
            askConfirm({
                title: 'Bloquear día con citas',
                message: `Este día tiene ${appointmentsInDay.length} cita(s). Si continúas, serán canceladas.`,
                tone: 'danger',
                onConfirm: saveDayOff,
            })

            return
        }

        await saveDayOff()
    }

    async function deleteDayOff(id: string) {
        askConfirm({
            title: 'Eliminar día libre',
            message: 'Este día volverá a estar disponible según el horario semanal.',
            tone: 'danger',
            onConfirm: async () => {
                const { error } = await supabase.from('days_off').delete().eq('id', id)

                if (error) {
                    notify('No se pudo eliminar el día libre', 'Intenta nuevamente.', 'danger')
                    return
                }

                await loadAvailabilityExtras()
                notify('Día libre eliminado', 'El día fue habilitado nuevamente.', 'success')
            },
        })
    }

    function createBreak() {
        const today = new Date().toISOString().split('T')[0]

        setEditingBreak({
            id: null,
            name: 'Descanso',
            date: today,
            start_time: '14:00',
            end_time: '15:00',
            is_active: true,
        })
    }

    async function deleteBreak(id: string) {
        askConfirm({
            title: 'Eliminar bloqueo',
            message: 'Este horario volverá a estar disponible si no hay otra regla que lo bloquee.',
            tone: 'danger',
            onConfirm: async () => {
                const { error } = await supabase.from('breaks').delete().eq('id', id)

                if (error) {
                    notify('No se pudo eliminar el bloqueo', 'Intenta nuevamente.', 'danger')
                    return
                }

                await loadAvailabilityExtras()
                notify('Bloqueo eliminado', 'El horario fue habilitado nuevamente.', 'success')
            },
        })
    }
    return (
        <section className="animate-fade-in">
            <SectionHeader
                eyebrow="Agenda"
                title="Disponibilidad"
                description="Controla horarios semanales, días libres, feriados, descansos y bloqueos parciales."
            />

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <AdminPanel
                    title="Horario semanal"
                    description="Define qué días están disponibles para reservas."
                >
                    <div className="divide-y divide-white/10">
                        {WEEK_DAYS.map((day, index) => {
                            const rule = availability.find(
                                (item) => item.day_of_week === index + 1
                            )

                            return (
                                <div
                                    key={day}
                                    className="grid gap-4 p-5 lg:grid-cols-[1fr_150px_150px_110px] lg:items-center"
                                >
                                    <div>
                                        <p className="font-semibold">{day}</p>
                                        <p className="mt-1 text-xs text-[var(--app-muted)]">
                                            {rule
                                                ? `${formatTime(rule.start_time, business?.time_format || '24h')} - ${formatTime(rule.end_time, business?.time_format || '24h')}`
                                                : 'Cerrado'}
                                        </p>
                                    </div>

                                    {rule ? (
                                        <>
                                            <FieldLabel compact label="Desde">
                                                <input
                                                    type="time"
                                                    value={String(rule.start_time).slice(0, 5)}
                                                    onChange={(event) =>
                                                        updateAvailabilityLocal(rule.id, {
                                                            start_time: event.target.value,
                                                        })
                                                    }
                                                    onBlur={() => updateRule(rule)}
                                                    className="admin-input py-3"
                                                />
                                            </FieldLabel>

                                            <FieldLabel compact label="Hasta">
                                                <input
                                                    type="time"
                                                    value={String(rule.end_time).slice(0, 5)}
                                                    onChange={(event) =>
                                                        updateAvailabilityLocal(rule.id, {
                                                            end_time: event.target.value,
                                                        })
                                                    }
                                                    onBlur={() => updateRule(rule)}
                                                    className="admin-input py-3"
                                                />
                                            </FieldLabel>

                                            <AdminButton
                                                tone="danger"
                                                full
                                                onClick={() => deleteRule(rule.id)}
                                            >
                                                Cerrar
                                            </AdminButton>
                                        </>
                                    ) : (
                                        <div className="lg:col-span-3 lg:justify-self-end">
                                            <AdminButton
                                                primary
                                                full
                                                onClick={() => createRule(index + 1)}
                                            >
                                                Abrir
                                            </AdminButton>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </AdminPanel>

                <div className="space-y-6">
                    <AdminPanel
                        title="Días libres"
                        description="Vacaciones, feriados o días completos sin reservas."
                    >
                        <div className="space-y-3 p-5">
                            <input
                                type="date"
                                value={newDayOff}
                                onChange={(event) => setNewDayOff(event.target.value)}
                                className="admin-input"
                            />

                            <input
                                value={newDayOffReason}
                                onChange={(event) => setNewDayOffReason(event.target.value)}
                                placeholder="Motivo: feriado, vacaciones..."
                                className="admin-input"
                            />

                            <button
                                onClick={createDayOff}
                                disabled={!newDayOff || !newDayOffReason.trim() || loading}
                                className="btn-primary w-full disabled:opacity-40"
                            >
                                Agregar día libre
                            </button>
                        </div>

                        <div className="divide-y divide-white/10 border-t border-white/10">
                            {daysOff.map((dayOff) => (
                                <div
                                    key={dayOff.id}
                                    className="flex items-center justify-between gap-4 p-5"
                                >
                                    <div>
                                        <p className="font-semibold">{formatDate(dayOff.date)}</p>
                                        <p className="mt-1 text-xs text-[var(--app-muted)]">
                                            {dayOff.reason || 'Día no disponible'}
                                        </p>
                                    </div>

                                    <AdminButton
                                        tone="danger"
                                        onClick={() => deleteDayOff(dayOff.id)}
                                    >
                                        Eliminar
                                    </AdminButton>
                                </div>
                            ))}

                            {daysOff.length === 0 && (
                                <InlineEmpty text="No hay días libres configurados." />
                            )}
                        </div>
                    </AdminPanel>

                    <AdminPanel
                        title="Bloqueos y descansos"
                        description="Almuerzos, pausas o ausencias parciales."
                        action={
                            <button onClick={createBreak} className="btn-primary">
                                + Nuevo bloqueo
                            </button>
                        }
                    >
                        <div className="divide-y divide-white/10">
                            {breaks.map((breakItem) => (
                                <div key={breakItem.id} className="p-5">
                                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                                        <div>
                                            <p className="font-semibold">{breakItem.name}</p>

                                            <p className="mt-1 text-sm text-[var(--app-muted)]">
                                                {formatDate(breakItem.date)} ·{' '}
                                                {formatTime(breakItem.start_time, business?.time_format || '24h')} -{' '}
                                                {formatTime(breakItem.end_time, business?.time_format || '24h')}
                                            </p>

                                            <p className="mt-2 text-xs text-[var(--app-muted)]">
                                                {breakItem.is_active ? 'Activo' : 'Inactivo'}
                                            </p>
                                        </div>

                                        <div className="grid gap-2 sm:grid-cols-2">
                                            <AdminButton onClick={() => setEditingBreak(breakItem)}>
                                                Editar
                                            </AdminButton>

                                            <AdminButton tone="danger" onClick={() => deleteBreak(breakItem.id)}>
                                                Eliminar
                                            </AdminButton>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {breaks.length === 0 && (
                                <InlineEmpty text="No hay bloqueos configurados." />
                            )}
                        </div>

                        {editingBreak && (
                            <BreakFormModal
                                item={editingBreak}
                                business={business}
                                onClose={() => setEditingBreak(null)}
                                onSaved={async () => {
                                    setEditingBreak(null)
                                    await loadAvailabilityExtras()
                                    await reload()
                                }}
                                notify={notify}
                                askConfirm={askConfirm}
                            />
                        )}
                    </AdminPanel>
                </div>
            </div>
        </section>
    )
}

function SettingsSection({
    business,
    setBusiness,
    notify,
}: {
    business: any
    setBusiness: (value: any) => void
    notify: (title: string, message?: string, tone?: 'success' | 'danger' | 'info') => void
}) {
    async function updateBusiness() {
        const { error } = await supabase
            .from('business_settings')
            .update({
                primary_color: business.primary_color,
                background_color: business.background_color,
                surface_color: business.surface_color,
                text_color: business.text_color,
                muted_text_color: business.muted_text_color,
                name: business.name,
                description: business.description,
                phone: business.phone,
                whatsapp: business.whatsapp,
                instagram: business.instagram,
                address: business.address,
                booking_enabled: business.booking_enabled,
                time_format: business.time_format,
                currency: business.currency,
                auto_confirm_appointments: business.auto_confirm_appointments,
                products_enabled: Boolean(business.products_enabled),
                reviews_enabled: Boolean(business.reviews_enabled),
                google_reviews_url: business.google_reviews_url,
                google_review_qr_url: business.google_review_qr_url,
                lgbtq_friendly: Boolean(business.lgbtq_friendly),
            })
            .eq('id', business.id)

        if (error) {
            notify('No se pudo completar la acción', 'Intenta nuevamente.', 'danger')
            return
        }

        notify('Datos actualizados', 'Los cambios fueron guardados correctamente.', 'success')
    }

    function updateBusinessLocal(patch: any) {
        setBusiness((prev: any) => ({ ...prev, ...patch }))
    }

    return (
        <section className="animate-fade-in">
            <SectionHeader
                eyebrow="Configuración"
                title="Ajustes"
                description="Actualiza datos del negocio, reglas de reserva y paleta visual del sitio."
                action={
                    <button onClick={updateBusiness} className="btn-primary">
                        Guardar cambios
                    </button>
                }
            />

            <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.85fr]">
                <AdminPanel title="Información pública" description="Datos visibles en la landing y en el flujo de reserva.">
                    <div className="grid gap-4 p-5 md:grid-cols-2">
                        <TextField label="Nombre" value={business?.name || ''} onChange={(name) => updateBusinessLocal({ name })} />
                        <TextField label="Teléfono" value={business?.phone || ''} onChange={(phone) => updateBusinessLocal({ phone })} />
                        <TextField label="WhatsApp" value={business?.whatsapp || ''} onChange={(whatsapp) => updateBusinessLocal({ whatsapp })} />
                        <TextField label="Instagram" value={business?.instagram || ''} onChange={(instagram) => updateBusinessLocal({ instagram })} />
                        <div className="md:col-span-2">
                            <TextareaField label="Descripción" value={business?.description || ''} onChange={(description) => updateBusinessLocal({ description })} />
                        </div>
                        <div className="md:col-span-2">
                            <TextareaField label="Dirección" value={business?.address || ''} onChange={(address) => updateBusinessLocal({ address })} />
                        </div>
                    </div>
                </AdminPanel>

                <AdminPanel title="Reservas" description="Controla cómo se crean y muestran las citas.">
                    <div className="space-y-3 p-5">
                        <ToggleField
                            label="Reservas activas"
                            checked={Boolean(business?.booking_enabled)}
                            onChange={(booking_enabled) => updateBusinessLocal({ booking_enabled })}
                        />
                        <ToggleField
                            label="Formato 12 horas"
                            description="Actívalo para mostrar horas como 2:30 PM."
                            checked={business?.time_format === '12h'}
                            onChange={(checked) => updateBusinessLocal({ time_format: checked ? '12h' : '24h' })}
                        />
                        <SelectField
                            label="Moneda"
                            value={business?.currency || 'EUR'}
                            onChange={(currency) => updateBusinessLocal({ currency })}
                            options={[
                                { value: 'EUR', label: 'EUR - Euro' },
                                { value: 'USD', label: 'USD - Dólar' },
                                { value: 'DOP', label: 'DOP - Peso dominicano' },
                            ]}
                        />
                        <ToggleField
                            label="Autoconfirmar citas"
                            description="Si está desactivado, las reservas entran como pendientes."
                            checked={Boolean(business?.auto_confirm_appointments)}
                            onChange={(auto_confirm_appointments) => updateBusinessLocal({ auto_confirm_appointments })}
                        />
                    </div>
                </AdminPanel>

                <AdminPanel
                    title="Landing pública"
                    description="Controla secciones visibles y enlaces públicos de la web."
                >
                    <div className="space-y-3 p-5">
                        <ToggleField
                            label="Mostrar productos"
                            description="Activa o desactiva la sección completa de productos en la landing."
                            checked={Boolean(business?.products_enabled)}
                            onChange={(products_enabled) => updateBusinessLocal({ products_enabled })}
                        />

                        <ToggleField
                            label="LGBTQ+ Friendly"
                            description="Muestra mensajes de espacio inclusivo en la landing."
                            checked={Boolean(business?.lgbtq_friendly)}
                            onChange={(lgbtq_friendly) => updateBusinessLocal({ lgbtq_friendly })}
                        />

                        <ToggleField
                            label="Mostrar reseñas"
                            description="Activa o desactiva la sección de reseñas en la landing."
                            checked={Boolean(business?.reviews_enabled)}
                            onChange={(reviews_enabled) => updateBusinessLocal({ reviews_enabled })}
                        />

                        <TextField
                            label="Link de reseñas Google"
                            value={business?.google_reviews_url || ''}
                            onChange={(google_reviews_url) => updateBusinessLocal({ google_reviews_url })}
                        />

                        <TextField
                            label="URL del QR de reseñas"
                            value={business?.google_review_qr_url || ''}
                            onChange={(google_review_qr_url) => updateBusinessLocal({ google_review_qr_url })}
                        />
                    </div>
                </AdminPanel>

                <AdminPanel
                    title="Próximas funciones"
                    description="Opciones preparadas para versiones futuras."
                >
                    <div className="p-5">
                        <label className="flex items-center justify-between gap-4 border border-white/10 bg-white/[0.04] px-4 py-4 opacity-60">
                            <div>
                                <p className="text-sm font-semibold">
                                    Varios trabajadores
                                    <span className="ml-2 border border-[var(--brand)] px-2 py-0.5 text-[10px] uppercase text-[var(--brand)]">
                                        Pronto
                                    </span>
                                </p>
                                <p className="mt-1 text-xs text-[var(--app-muted)]">
                                    Permitirá asignar citas a barberos o profesionales diferentes.
                                </p>
                            </div>

                            <input type="checkbox" disabled />
                        </label>
                    </div>
                </AdminPanel>
            </div>

            <div className="mt-6">
                <AdminPanel title="Paleta visual" description="Cambia los colores de la landing y del panel.">
                    <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
                        <ColorInput label="Color principal" value={business?.primary_color || '#d4af37'} onChange={(primary_color) => updateBusinessLocal({ primary_color })} />
                        <ColorInput label="Fondo" value={business?.background_color || '#0a0a0a'} onChange={(background_color) => updateBusinessLocal({ background_color })} />
                        <ColorInput label="Superficie" value={business?.surface_color || '#171717'} onChange={(surface_color) => updateBusinessLocal({ surface_color })} />
                        <ColorInput label="Texto" value={business?.text_color || '#ffffff'} onChange={(text_color) => updateBusinessLocal({ text_color })} />
                    </div>
                </AdminPanel>
            </div>
        </section>
    )
}

function RescheduleModal({
    appointment,
    business,
    askConfirm,
    notify,
    onClose,
    onUpdated,
}: {
    appointment: any
    business: any
    askConfirm: (options: {
        title: string
        message?: string
        tone?: 'danger' | 'info'
        onConfirm: () => void | Promise<void>
    }) => void
    notify: (title: string, message?: string, tone?: 'success' | 'danger' | 'info') => void
    onClose: () => void
    onUpdated: AsyncVoid
}) {
    const [date, setDate] = useState(appointment.date)
    const [slots, setSlots] = useState<string[]>([])
    const [selectedSlot, setSelectedSlot] = useState('')
    const [message, setMessage] = useState('')
    const [loadingSlots, setLoadingSlots] = useState(false)
    const [saving, setSaving] = useState(false)

    const service = appointment.services
    const duration = Number(service?.duration_minutes || appointment.duration_minutes || 30)

    useEffect(() => {
        loadSlots()
    }, [date])

    async function loadSlots() {
        if (!date) return

        setLoadingSlots(true)
        setMessage('')
        setSlots([])
        setSelectedSlot('')

        if (isPastDate(date)) {
            setMessage('No puedes reagendar a una fecha pasada.')
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

        const [rulesResult, breaksResult, appointmentsResult] = await Promise.all([
            supabase
                .from('availability_rules')
                .select('*')
                .eq('day_of_week', dayOfWeek)
                .eq('is_active', true),
            supabase.from('breaks').select('*').eq('date', date).eq('is_active', true),
            supabase
                .from('appointments')
                .select('*')
                .eq('date', date)
                .in('status', ['pending', 'confirmed']),
        ])

        const rules = rulesResult.data || []

        if (rules.length === 0) {
            setMessage('No trabajamos este día.')
            setLoadingSlots(false)
            return
        }

        const allSlots = rules.flatMap((rule) =>
            generateSlots(String(rule.start_time).slice(0, 5), String(rule.end_time).slice(0, 5), duration)
        )

        const available = allSlots.filter((slot) => {
            if (isPastSlot(date, slot)) return false

            const slotEnd = addMinutes(slot, duration)
            const overlapsBreak = (breaksResult.data || []).some((breakItem) =>
                rangesOverlap(
                    slot,
                    slotEnd,
                    String(breakItem.start_time).slice(0, 5),
                    String(breakItem.end_time).slice(0, 5)
                )
            )
            const overlapsAppointment = (appointmentsResult.data || []).some((reservedAppointment) => {
                if (reservedAppointment.id === appointment.id) return false

                return rangesOverlap(
                    slot,
                    slotEnd,
                    String(reservedAppointment.start_time).slice(0, 5),
                    String(reservedAppointment.end_time).slice(0, 5)
                )
            })

            return !overlapsBreak && !overlapsAppointment
        })

        const uniqueAvailable = [...new Set(available)].sort()
        setSlots(uniqueAvailable)

        if (uniqueAvailable.length === 0) {
            setMessage('No hay horarios disponibles para esta fecha.')
        }

        setLoadingSlots(false)
    }


    async function saveReschedule() {
        if (!selectedSlot) {
            setMessage('Selecciona una nueva hora.')
            return
        }

        if (['cancelled', 'completed'].includes(appointment.status)) {
            notify('Cita no modificable', 'No puedes reagendar una cita cancelada o completada.', 'danger')
            onClose()
            return
        }

        onClose()

        askConfirm({
            title: 'Reagendar cita',
            message: `¿Confirmas mover esta cita al ${formatDate(date)} a las ${formatTime(
                selectedSlot,
                business?.time_format || '24h'
            )}?`,
            tone: 'info',
            onConfirm: async () => {
                setSaving(true)

                const { error } = await supabase
                    .from('appointments')
                    .update({
                        date,
                        start_time: selectedSlot,
                        end_time: addMinutes(selectedSlot, duration),
                    })
                    .eq('id', appointment.id)
                    .neq('status', 'cancelled')

                setSaving(false)

                if (error) {
                    notify('No se pudo reagendar la cita', 'Intenta nuevamente.', 'danger')
                    return
                }

                notify('Cita reagendada', 'La cita fue actualizada correctamente.', 'success')
                await onUpdated()
            },
        })
    }

    return (
        <AdminModal
            eyebrow="Reagendar"
            title={appointment.customer_name}
            onClose={onClose}
            footer={
                <ModalFooter
                    onCancel={onClose}
                    onConfirm={saveReschedule}
                    confirmText={saving ? 'Guardando...' : 'Guardar'}
                    disabled={!selectedSlot || saving}
                />
            }
        >
            <p className="mb-5 text-sm text-[var(--app-muted)]">
                {service?.name || 'Servicio'} · {duration} min
            </p>

            <FieldLabel label="Nueva fecha">
                <DateSelector value={date} onChange={setDate} days={30} />
            </FieldLabel>

            <div className="mt-6">
                <h3 className="font-semibold">Horas disponibles</h3>

                {loadingSlots && <p className="mt-3 text-sm text-[var(--app-muted)]">Buscando horarios...</p>}

                {!loadingSlots && slots.length > 0 && (
                    <div className="mt-4">
                        <TimeSelector
                            value={selectedSlot}
                            options={slots}
                            onChange={setSelectedSlot}
                            timeFormat={business?.time_format || '24h'}
                        />
                    </div>
                )}

                <ErrorMessage message={message} />
            </div>
        </AdminModal>
    )
}

function QuickAction({ title, text, onClick }: { title: string; text: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="border border-white/10 bg-[var(--app-surface)] p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-[var(--brand)] hover:bg-white/[0.04] active:translate-y-0"
        >
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">{text}</p>
        </button>
    )
}

function DataTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
    if (rows.length === 0) return null

    return (
        <div className="mt-6 hidden overflow-hidden border border-white/10 bg-white/10 lg:block">
            <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-[var(--app-surface)] text-xs uppercase tracking-wide text-[var(--app-muted)]">
                    <tr>
                        {headers.map((header, index) => (
                            <th key={header} className={`px-5 py-4 font-semibold ${index === headers.length - 1 ? 'text-right' : ''}`}>
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-t border-white/10 bg-[var(--app-surface)] transition hover:bg-white/[0.04]">
                            {row.map((cell, cellIndex) => (
                                <td
                                    key={cellIndex}
                                    className={`px-5 py-4 ${cellIndex === row.length - 1 ? 'text-right' : 'text-[var(--app-muted)] first:text-[var(--app-text)]'
                                        }`}
                                >
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function RowActions({ children }: { children: React.ReactNode }) {
    return <div className="flex justify-end gap-2">{children}</div>
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
    return (
        <FieldLabel label={label}>
            <input value={value} onChange={(event) => onChange(event.target.value)} className="admin-input" />
        </FieldLabel>
    )
}

function TextareaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
    return (
        <FieldLabel label={label}>
            <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} className="admin-input" />
        </FieldLabel>
    )
}

function SelectField({
    label,
    value,
    onChange,
    options,
}: {
    label: string
    value: string
    onChange: (value: string) => void
    options: { value: string; label: string }[]
}) {
    return (
        <FieldLabel label={label}>
            <select value={value} onChange={(event) => onChange(event.target.value)} className="admin-input">
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </FieldLabel>
    )
}

function FieldLabel({
    label,
    children,
    compact = false,
}: {
    label: string
    children: React.ReactNode
    compact?: boolean
}) {
    return (
        <label className="block">
            <span className={`${compact ? 'mb-1' : 'mb-2'} block text-xs font-semibold uppercase tracking-wide text-[var(--app-muted)]`}>
                {label}
            </span>
            {children}
        </label>
    )
}

function ToggleField({
    label,
    description,
    checked,
    onChange,
}: {
    label: string
    description?: string
    checked: boolean
    onChange: (checked: boolean) => void
}) {
    return (
        <label className="flex items-center justify-between gap-4 border border-white/10 bg-white/[0.04] px-4 py-4">
            <div>
                <p className="text-sm font-semibold">{label}</p>
                {description && <p className="mt-1 text-xs text-[var(--app-muted)]">{description}</p>}
            </div>
            <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
        </label>
    )
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
    return (
        <FieldLabel label={label}>
            <div className="flex items-center gap-2 border border-white/10 bg-white/[0.06] p-2">
                <input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-10 border-0 bg-transparent" />
                <input value={value} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none" />
            </div>
        </FieldLabel>
    )
}

function EmptyState({ show, text }: { show: boolean; text: string }) {
    if (!show) return null

    return (
        <div className="mt-6 border border-white/10 bg-[var(--app-surface)] p-6">
            <p className="text-sm text-[var(--app-muted)]">{text}</p>
        </div>
    )
}

function InlineEmpty({ text }: { text: string }) {
    return (
        <div className="p-5">
            <p className="text-sm text-[var(--app-muted)]">{text}</p>
        </div>
    )
}

function ErrorMessage({ message }: { message: string }) {
    if (!message) return null

    return <div className="mt-4 border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{message}</div>
}

const ADMIN_TIME_OPTIONS = Array.from({ length: 48 }).map((_, index) => {
    const totalMinutes = index * 30
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
})

function BreakFormModal({
    item,
    business,
    onClose,
    onSaved,
    notify,
    askConfirm,
}: {
    item: any
    business: any
    onClose: () => void
    onSaved: () => Promise<void>
    notify: (title: string, message?: string, tone?: 'success' | 'danger' | 'info') => void
    askConfirm: (options: {
        title: string
        message?: string
        tone?: 'danger' | 'info'
        onConfirm: () => void | Promise<void>
    }) => void
}) {
    const [form, setForm] = useState(item)
    const [saving, setSaving] = useState(false)
    const isEditing = Boolean(item.id)

    function patchForm(patch: any) {
        setForm((prev: any) => ({ ...prev, ...patch }))
    }

    async function saveBreak() {
    if (!form.date || !form.name?.trim() || !form.start_time || !form.end_time) {
        notify('Campos incompletos', 'Completa fecha, motivo y horario.', 'danger')
        return
    }

    const startTime = String(form.start_time).slice(0, 5)
    const endTime = String(form.end_time).slice(0, 5)

    if (startTime >= endTime) {
        notify('Horario inválido', 'La hora de inicio debe ser menor que la hora final.', 'danger')
        return
    }

    const { data: affectedAppointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('date', form.date)
        .in('status', ['pending', 'confirmed'])

    if (appointmentsError) {
        notify('No se pudieron validar las citas afectadas', 'Intenta nuevamente.', 'danger')
        return
    }

    const appointmentsToCancel = (affectedAppointments || []).filter((appointment) =>
        rangesOverlap(
            startTime,
            endTime,
            String(appointment.start_time).slice(0, 5),
            String(appointment.end_time).slice(0, 5)
        )
    )

    async function runSave() {
        setSaving(true)

        const payload = {
            name: form.name.trim(),
            date: form.date,
            start_time: startTime,
            end_time: endTime,
            is_active: Boolean(form.is_active),
        }

        const { error } = isEditing
            ? await supabase.from('breaks').update(payload).eq('id', form.id)
            : await supabase.from('breaks').insert(payload)

        if (error) {
            setSaving(false)
            notify('No se pudo guardar el bloqueo', error.message, 'danger')
            return
        }

        if (form.is_active && appointmentsToCancel.length > 0) {
            const { error: cancelError } = await supabase
                .from('appointments')
                .update({
                    status: 'cancelled',
                    cancelled_at: new Date().toISOString(),
                })
                .in('id', appointmentsToCancel.map((appointment) => appointment.id))
                .in('status', ['pending', 'confirmed'])

            if (cancelError) {
                setSaving(false)
                notify(
                    'Bloqueo guardado, pero no se cancelaron las citas',
                    cancelError.message,
                    'danger'
                )
                return
            }
        }

        setSaving(false)

        notify(
            isEditing ? 'Bloqueo actualizado' : 'Bloqueo creado',
            appointmentsToCancel.length > 0
                ? 'Se guardó el bloqueo y se cancelaron las citas afectadas.'
                : 'Los cambios fueron guardados correctamente.',
            'success'
        )

        await onSaved()
    }

    if (form.is_active && appointmentsToCancel.length > 0) {
        onClose()

        askConfirm({
            title: 'Bloqueo con citas existentes',
            message: `Este bloqueo afecta ${appointmentsToCancel.length} cita(s). Si continúas, serán canceladas.`,
            tone: 'danger',
            onConfirm: runSave,
        })

        return
    }

    await runSave()
}

    return (
        <AdminModal
            eyebrow={isEditing ? 'Editar bloqueo' : 'Nuevo bloqueo'}
            title={isEditing ? form.name || 'Bloqueo' : 'Crear bloqueo'}
            onClose={onClose}
            footer={
                <ModalFooter
                    onCancel={onClose}
                    onConfirm={saveBreak}
                    confirmText={saving ? 'Guardando...' : 'Guardar bloqueo'}
                    disabled={saving}
                />
            }
        >
            <div className="space-y-6">
                <FieldLabel label="Fecha">
                    <DateSelector
                        value={form.date}
                        onChange={(date) => patchForm({ date })}
                        days={30}
                    />
                </FieldLabel>

                <FieldLabel label="Motivo">
                    <input
                        value={form.name || ''}
                        onChange={(event) => patchForm({ name: event.target.value })}
                        placeholder="Almuerzo, ausencia, descanso..."
                        className="admin-input"
                    />
                </FieldLabel>

                <div>
                    <FieldLabel label="Desde">
                        <TimeSelector
                            value={String(form.start_time).slice(0, 5)}
                            options={ADMIN_TIME_OPTIONS}
                            onChange={(start_time) => patchForm({ start_time })}
                            timeFormat={business?.time_format || '24h'}
                        />
                    </FieldLabel>
                </div>

                <div>
                    <FieldLabel label="Hasta">
                        <TimeSelector
                            value={String(form.end_time).slice(0, 5)}
                            options={ADMIN_TIME_OPTIONS}
                            onChange={(end_time) => patchForm({ end_time })}
                            timeFormat={business?.time_format || '24h'}
                        />
                    </FieldLabel>
                </div>

                <ToggleField
                    label="Bloqueo activo"
                    description="Si está activo, este horario no aparecerá disponible para reservas."
                    checked={Boolean(form.is_active)}
                    onChange={(is_active) => patchForm({ is_active })}
                />
            </div>
        </AdminModal>
    )
}