import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { formatCurrency } from '@/lib/utils'
import { buildThemeStyle } from '@/lib/theme'
import {
  ArrowUp,
  CalendarCheck,
  Clock,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Smartphone,
} from 'lucide-react'

export default async function Home() {
  const { data: business } = await supabase
    .from('business_settings')
    .select('*')
    .single()

  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true })

  const { data: gallery } = await supabase
    .from('gallery_images')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(6)

  const DEVELOPER_WHATSAPP = '18296055347'

  const coverImage =
    business?.cover_url ||
    'https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=1600&auto=format&fit=crop'

  const secondaryImage =
    gallery?.[0]?.image_url ||
    'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=1200&auto=format&fit=crop'

  return (
    <main
      id="top"
      style={buildThemeStyle(business)}
      className="min-h-screen overflow-x-hidden bg-[var(--app-bg)] text-[var(--app-text)]"
    >
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[var(--app-bg)]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            {business?.logo_url ? (
              <img
                src={business.logo_url}
                alt={business?.name || 'Logo'}
                className="h-10 w-10 object-cover"
              />
            ) : (
              <div className="h-10 w-10 border border-[var(--brand)]" />
            )}

            <div>
              <p className="text-sm font-semibold tracking-wide">
                {business?.name || 'NEGOCIO'}
              </p>
              <p className="hidden text-xs text-[var(--app-muted)] sm:block">
                Barcelona, España
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-[var(--app-muted)] md:flex">
            <a href="#services" className="hover:text-[var(--brand)]">
              Servicios
            </a>
            <a href="#gallery" className="hover:text-[var(--brand)]">
              Galería
            </a>
            <a href="#location" className="hover:text-[var(--brand)]">
              Ubicación
            </a>
          </nav>

          <Link
            href="/reservar"
            className="border border-[var(--brand)] bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-[var(--app-bg)] transition hover:opacity-90"
          >
            Reservar
          </Link>
        </div>
      </header>

      <section className="relative pt-20">
        <div className="grid min-h-[calc(100vh-80px)] lg:grid-cols-2">
          <div className="flex items-center px-5 py-16 lg:px-8">
            <div className="mx-auto w-full max-w-xl animate-fade-in">
              <p className="mb-6 inline-flex border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--brand)]">
                Barbería premium en Barcelona
              </p>

              <h1 className="text-5xl font-semibold leading-[0.95] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
                Corte, barba y estilo con reserva inmediata.
              </h1>

              <p className="mt-6 max-w-lg text-base leading-8 text-[var(--app-muted)] sm:text-lg">
                {business?.description ||
                  'NEGOCIO combina técnica, precisión y una experiencia cuidada para que reserves tu cita sin llamadas ni esperas.'}
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/reservar"
                  className="inline-flex items-center justify-center gap-2 bg-[var(--brand)] px-7 py-4 text-center text-sm font-semibold text-[var(--app-bg)] transition hover:opacity-90"
                >
                  <CalendarCheck size={16} />
                  Reservar cita
                </Link>

                {business?.whatsapp && (
                  <a
                    href={`https://wa.me/${String(business.whatsapp).replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 border border-white/15 px-7 py-4 text-center text-sm font-semibold text-[var(--app-text)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
                  >
                    <MessageCircle size={16} />
                    WhatsApp
                  </a>
                )}
              </div>

              <div className="mt-12 grid grid-cols-3 border-y border-white/10 py-6">
                <Metric icon={<Clock size={18} />} value="24/7" label="Reservas" />
                <Metric icon={<CalendarCheck size={18} />} value="+15" label="Slots diarios" />
                <Metric icon={<Smartphone size={18} />} value="100%" label="Mobile ready" />
              </div>
            </div>
          </div>

          <div className="relative min-h-[520px] overflow-hidden lg:min-h-full">
            <img
              src={coverImage}
              alt={business?.name || 'NEGOCIO'}
              className="h-full w-full object-cover transition duration-700 hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--app-bg)] via-transparent to-transparent lg:bg-gradient-to-r lg:from-[var(--app-bg)]/20 lg:to-transparent" />

            <div className="absolute bottom-5 left-5 right-5 border border-white/10 bg-black/45 p-5 backdrop-blur-xl lg:bottom-8 lg:left-8 lg:right-8">
              <p className="text-xs uppercase tracking-[0.25em] text-[var(--brand)]">
                Hoy disponible
              </p>
              <p className="mt-2 text-2xl font-semibold">
                Reserva en menos de un minuto
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--brand)]">
              Servicios
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Elige el servicio y reserva tu horario.
            </h2>
            <p className="mt-5 text-base leading-7 text-[var(--app-muted)]">
              Los horarios se calculan según disponibilidad real, descansos, días libres y citas ya reservadas.
            </p>

            <Link
              href="/reservar"
              className="mt-8 inline-flex border border-[var(--brand)] bg-[var(--brand)] px-6 py-4 text-sm font-semibold text-[var(--app-bg)]"
            >
              Ver disponibilidad
            </Link>
          </div>

          <div className="grid gap-px overflow-hidden border border-white/10 bg-white/10">
            {(services || []).map((service) => (
              <Link
                href="/reservar"
                key={service.id}
                className="group bg-[var(--app-surface)] p-5 transition hover:bg-white/[0.08] sm:p-6"
              >
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {service.name}
                    </h3>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--app-muted)]">
                      {service.description}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-lg font-semibold text-[var(--brand)]">
                      {formatCurrency(Number(service.price), business?.currency || 'EUR')}
                    </p>
                    <p className="mt-1 text-xs text-[var(--app-muted)]">
                      {service.duration_minutes} min
                    </p>
                  </div>
                </div>

                <div className="mt-5 h-px w-full bg-white/10" />

                <p className="mt-4 text-sm font-semibold text-[var(--brand)] opacity-80 transition group-hover:translate-x-1">
                  Reservar este servicio →
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="gallery" className="mx-auto max-w-7xl px-5 pb-20 lg:px-8 lg:pb-28">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="border border-white/10 bg-[var(--app-surface)] p-6 lg:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--brand)]">
              Experiencia
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
              Una imagen profesional para un servicio profesional.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[var(--app-muted)]">
              Personaliza estas imágenes desde el panel para mostrar el local, trabajos realizados o el ambiente del negocio.
            </p>
          </div>

          <div className="relative min-h-[360px] overflow-hidden border border-white/10 lg:col-span-2">
            <img
              src={secondaryImage}
              alt="Interior del negocio"
              className="h-full w-full object-cover transition duration-700 hover:scale-[1.03]"
            />
          </div>
        </div>

        {gallery && gallery.length > 1 && (
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            {gallery.slice(1, 5).map((image) => (
              <div key={image.id} className="aspect-[4/5] overflow-hidden border border-white/10">
                <img
                  src={image.image_url}
                  alt={image.alt_text || 'Galería'}
                  className="h-full w-full object-cover transition duration-700 hover:scale-[1.04]"
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="border-y border-white/10 bg-[var(--app-surface)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--brand)]">
              Reserva online
            </p>

            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Sin llamadas. Sin esperas. Sin doble booking.
            </h2>
          </div>

          <div className="space-y-6">
            <Feature
              icon={<ShieldCheck size={18} />}
              title="Disponibilidad real"
              text="Solo se muestran horarios libres según servicios, duración, descansos y citas existentes."
            />
            <Feature
              icon={<Smartphone size={18} />}
              title="Diseño mobile-first"
              text="La reserva está optimizada para hacerse desde el móvil en pocos pasos."
            />
            <Feature
              icon={<CalendarCheck size={18} />}
              title="Confirmación inmediata"
              text="El cliente recibe una experiencia clara desde la selección hasta la confirmación."
            />

            <Link
              href="/reservar"
              className="inline-flex bg-[var(--brand)] px-7 py-4 text-sm font-semibold text-[var(--app-bg)] transition hover:opacity-90"
            >
              Reservar ahora
            </Link>
          </div>
        </div>
      </section>

      <section id="location" className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="grid gap-8 border border-white/10 p-6 lg:grid-cols-2 lg:p-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--brand)]">
              Ubicación
            </p>

            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
              Encuéntranos fácilmente en Google Maps y obtén instrucciones en tiempo real.
            </h2>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/reservar"
                className="bg-[var(--brand)] px-6 py-4 text-center text-sm font-semibold text-[var(--app-bg)] transition hover:opacity-90"
              >
                Reservar cita
              </Link>

              {business?.instagram && (
                <a
                  href={business.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-white/15 px-6 py-4 text-center text-sm font-semibold text-[var(--app-text)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
                >
                  Instagram
                </a>
              )}
            </div>
          </div>

          <div className="min-h-[260px] border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-4 text-[var(--brand)]">
              <MapPin size={20} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--brand)]">
              Cómo llegar
            </p>

            <p className="mt-4 text-sm leading-7 text-[var(--app-muted)]">
              {business?.address || 'Barcelona, España'}
            </p>

            <div className="mt-6 overflow-hidden border border-white/10 bg-[var(--app-surface)]">


              <div className="aspect-[16/10] w-full border-b border-white/10">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2993.397889445219!2d2.17514877508893!3d41.38716467129989!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12a4a386b497c2f5%3A0x9adbda8c85bd18e3!2sChampions%20barber%20shop!5e0!3m2!1ses-419!2sdo!4v1778528201329!5m2!1ses-419!2sdo"
                  width="100%"
                  height="100%"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-full w-full"
                />
              </div>

              <div className="p-5">
                <a
                  href="https://maps.app.goo.gl/ZZGyzcJYFrPQ4zaUA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  Abrir en Google Maps
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-5 pb-28 pt-8 text-center text-sm text-[var(--app-muted)] md:pb-8 lg:px-8">
        <p>
          {new Date().getFullYear()} © |{' '}
          {business?.name || 'Champions Barbershop'} by.{' '}
          <a
            href={`https://wa.me/${DEVELOPER_WHATSAPP}?text=${encodeURIComponent(
              `Hola Elian, he visto tu trabajo en ${business?.name || "Champions Barbershop"}, y me gustaría cotizar una web.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--brand)] transition hover:underline"
          >
            Elian Gomez
          </a>{' '}
          ❤️
        </p>
      </footer>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[var(--app-bg)]/90 p-3 backdrop-blur-xl md:hidden">
        <Link
          href="/reservar"
          className="mx-auto block max-w-md bg-[var(--brand)] px-5 py-4 text-center text-sm font-semibold text-[var(--app-bg)] transition hover:opacity-90"
        >
          Reservar cita
        </Link>
      </div>

      <a
        href="#top"
        aria-label="Volver al inicio"
        className="fixed bottom-24 right-5 z-50 hidden border border-white/10 bg-[var(--app-bg)]/90 p-4 text-[var(--app-text)] backdrop-blur transition hover:-translate-y-0.5 hover:border-[var(--brand)] hover:text-[var(--brand)] md:inline-flex"
      >
        <ArrowUp size={16} />
      </a>
    </main>
  )
}

function Metric({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: string
  label: string
}) {
  return (
    <div>
      <div className="mb-3 text-[var(--brand)]">{icon}</div>
      <p className="text-2xl font-semibold text-[var(--brand)]">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-[var(--app-muted)]">
        {label}
      </p>
    </div>
  )
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode
  title: string
  text: string
}) {
  return (
    <div className="border-t border-white/10 pt-5">
      <div className="text-[var(--brand)]">{icon}</div>
      <h3 className="mt-3 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[var(--app-muted)]">{text}</p>
    </div>
  )
}