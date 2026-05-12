import Link from 'next/link'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { supabase } from '@/lib/supabaseClient'
import { formatCurrency } from '@/lib/utils'
import { buildThemeStyle } from '@/lib/theme'
import {
  ArrowUp,
  CalendarCheck,
  Clock,
  HeartHandshake,
  MapPin,
  MessageCircle,
  Package,
  ShieldCheck,
  Star,
} from 'lucide-react'
import {
  translateBusinessDescription,
  translateProduct,
  translateReview,
  translateService,
} from '@/lib/landingTranslations'

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: string }>
}) {
  const params = await searchParams

  const COPY = {
    es: {
      city: 'Barcelona',
      reserve: 'Reservar',
      heroBadge: 'Barbería premium en Barcelona',
      heroTitle: 'Corte, barba y estilo con reserva inmediata.',
      heroText:
        'Champions Barbershop combina técnica, precisión y una experiencia cuidada para que reserves tu cita sin llamadas ni esperas.',
      lgbtq: 'LGBTQ+ Friendly',
      services: 'Servicios',
      products: 'Productos a la venta',
      productsText: 'Productos disponibles en el local. Consulta disponibilidad al visitarnos.',
      reviews: 'Reseñas',
      reviewsText: 'Lo que opinan nuestros clientes en Google.',
      leaveReview: 'Dejar una reseña',
      bookNow: 'Reservar ahora',
      viewAllServices: 'Ver todos los servicios',
      gallery: 'Galería',
      location: 'Ubicación',
      experience: 'Experiencia',
      experienceTitle: 'Una imagen profesional para un servicio profesional.',
      experienceText:
        'Conoce el ambiente, el estilo y la experiencia que ofrecemos en el local.',
      serviceTitle: 'Elige el servicio y reserva tu horario.',
      serviceText:
        'Los horarios se calculan según disponibilidad real, descansos, días libres y citas ya reservadas.',
      availability: 'Ver disponibilidad',
      bookService: 'Reservar este servicio',
      onlineBooking: 'Reserva online',
      bookingTitle: 'Sin llamadas. Sin esperas. Sin doble booking.',
      realAvailability: 'Disponibilidad real',
      realAvailabilityText:
        'Solo se muestran horarios libres según servicios, duración, descansos y citas existentes.',
      mobileFirst: 'Diseño mobile-first',
      mobileFirstText:
        'La reserva está optimizada para hacerse desde el móvil en pocos pasos.',
      instantConfirmation: 'Confirmación inmediata',
      instantConfirmationText:
        'El cliente recibe una experiencia clara desde la selección hasta la confirmación.',
      findUs: 'Cómo llegar',
      mapsText:
        'Encuéntranos fácilmente en Google Maps y obtén instrucciones en tiempo real.',
      openMaps: 'Abrir en Google Maps',
      lgbtqShort: 'LGBTQ+ Friendly',
      lgbtqText: 'Un espacio seguro, respetuoso e inclusivo para todas las personas.',
      availableToday: 'Hoy disponible',
      quickBooking: 'Reserva en menos de un minuto',
      googleReview: 'Reseña de Google',
      slotsDaily: 'Slots diarios',
    },
    en: {
      city: 'Barcelona',
      reserve: 'Book',
      heroBadge: 'Premium barbershop in Barcelona',
      heroTitle: 'Haircuts, beard grooming and style with instant booking.',
      heroText:
        'Champions Barbershop combines technique, precision and a polished experience so you can book without calls or waiting.',
      lgbtq: 'LGBTQ+ Friendly',
      services: 'Services',
      products: 'Products for sale',
      productsText: 'Products available in-store. Ask us about availability during your visit.',
      reviews: 'Reviews',
      reviewsText: 'What our customers say on Google.',
      leaveReview: 'Leave a review',
      bookNow: 'Book now',
      viewAllServices: 'View all services',
      gallery: 'Gallery',
      location: 'Location',
      experience: 'Experience',
      experienceTitle: 'A professional image for a professional service.',
      experienceText:
        'Discover the atmosphere, style and experience we offer in-store.',
      serviceTitle: 'Choose your service and book your time.',
      serviceText:
        'Availability is calculated using real schedules, breaks, days off and existing appointments.',
      availability: 'View availability',
      bookService: 'Book this service',
      onlineBooking: 'Online booking',
      bookingTitle: 'No calls. No waiting. No double booking.',
      realAvailability: 'Real availability',
      realAvailabilityText:
        'Only free time slots are shown based on services, duration, breaks and existing appointments.',
      mobileFirst: 'Mobile-first design',
      mobileFirstText:
        'Booking is optimized to be completed from your phone in just a few steps.',
      instantConfirmation: 'Instant confirmation',
      instantConfirmationText:
        'Customers get a clear experience from selection to confirmation.',
      findUs: 'How to get here',
      mapsText:
        'Find us easily on Google Maps and get real-time directions.',
      openMaps: 'Open in Google Maps',
      lgbtqShort: 'LGBTQ+ Friendly',
      lgbtqText: 'A safe, respectful and inclusive space for everyone.',
      availableToday: 'Available today',
      quickBooking: 'Book in under one minute',
      googleReview: 'Google Review',
      slotsDaily: 'Daily slots',
    },
  }

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

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(4)

  const { data: reviews } = await supabase
    .from('google_reviews')
    .select('*')
    .eq('is_active', true)
    .gte('rating', 4)
    .order('rating', { ascending: false })
    .order('sort_order', { ascending: true })
    .limit(25)

  const DEVELOPER_WHATSAPP = '18296055347'
  const GOOGLE_REVIEW_URL =
    'https://www.google.com/maps/place/Champions+barber+shop/@41.3871687,2.1751488,17z/data=!4m8!3m7!1s0x12a4a386b497c2f5:0x9adbda8c85bd18e3!8m2!3d41.3871647!4d2.1777237!9m1!1b1!16s%2Fg%2F11shg7mjjp?entry=ttu&g_ep=EgoyMDI2MDUwNi4wIKXMDSoASAFQAw%3D%3D'

  const coverImage =
    business?.cover_url ||
    'https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=1600&auto=format&fit=crop'

  const secondaryImage =
    gallery?.[0]?.image_url ||
    'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=1200&auto=format&fit=crop'

  const language = params?.lang === 'en' ? 'en' : 'es'
  const t = COPY[language]

  const langQuery = language === 'en' ? '?lang=en' : ''
  const reservarHref = `/reservar${langQuery}`

  function serviceName(service: any) {
    return language === 'en' ? translateService(service).name : service.name
  }

  function serviceDescription(service: any) {
    return language === 'en'
      ? translateService(service).description
      : service.description
  }

  function productName(product: any) {
    return language === 'en' ? translateProduct(product).name : product.name
  }

  function productDescription(product: any) {
    return language === 'en'
      ? translateProduct(product).description
      : product.description
  }

  function reviewComment(review: any) {
    return language === 'en' ? translateReview(review.comment) : review.comment
  }

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
                {business?.name || 'Champions Barbershop'}
              </p>
              <p className="hidden text-xs text-[var(--app-muted)] sm:block">
                {language === 'en' ? 'Barcelona, Spain' : 'Barcelona, España'}
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-[var(--app-muted)] md:flex">
            <a href="#services" className="hover:text-[var(--brand)]">
              {t.services}
            </a>
            <a href="#gallery" className="hover:text-[var(--brand)]">
              {t.gallery}
            </a>
            <a href="#reviews" className="hover:text-[var(--brand)]">
              {t.reviews}
            </a>
            <a href="#location" className="hover:text-[var(--brand)]">
              {t.location}
            </a>

            <LanguageToggle current={language} />

            <Link
              href={reservarHref}
              className="border border-[var(--brand)] bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-[var(--app-bg)] transition hover:opacity-90"
            >
              {t.reserve}
            </Link>
          </nav>

          <div className="flex items-center gap-2 md:hidden">
            <LanguageToggle current={language} />

            <Link
              href={reservarHref}
              className="border border-[var(--brand)] bg-[var(--brand)] px-4 py-3 text-xs font-semibold text-[var(--app-bg)] transition hover:opacity-90"
            >
              {t.reserve}
            </Link>
          </div>
        </div>
      </header>

      <section className="relative pt-20">
        <div className="grid min-h-[calc(100vh-80px)] lg:grid-cols-2">
          <div className="flex items-center px-5 py-16 lg:px-8">
            <div className="mx-auto w-full max-w-xl animate-fade-in">
              <p className="mb-6 inline-flex border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--brand)]">
                {t.heroBadge}
              </p>

              {business?.lgbtq_friendly && (
                <p className="mt-4 inline-flex items-center gap-2 border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
                  <HeartHandshake size={15} />
                  {t.lgbtq}
                </p>
              )}

              <h1 className="text-5xl font-semibold leading-[0.95] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
                {t.heroTitle}
              </h1>

              <p className="mt-6 max-w-lg text-base leading-8 text-[var(--app-muted)] sm:text-lg">
                {language === 'en'
                  ? translateBusinessDescription(business?.description)
                  : business?.description || t.heroText}
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={reservarHref}
                  className="inline-flex items-center justify-center gap-2 bg-[var(--brand)] px-7 py-4 text-center text-sm font-semibold text-[var(--app-bg)] transition hover:opacity-90"
                >
                  <CalendarCheck size={16} />
                  {t.bookNow}
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
                <Metric icon={<CalendarCheck size={18} />} value="+15" label={t.slotsDaily} />
                {business?.lgbtq_friendly && (
                  <Metric icon={<span className="text-lg">🏳️‍🌈</span>} value="100%" label={t.lgbtqShort} />
                )}
              </div>
            </div>
          </div>

          <div className="relative min-h-[520px] overflow-hidden lg:min-h-full">
            <img
              src={coverImage}
              alt={business?.name || 'Champions Barbershop'}
              className="h-full w-full object-cover transition duration-700 hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--app-bg)] via-transparent to-transparent lg:bg-gradient-to-r lg:from-[var(--app-bg)]/20 lg:to-transparent" />

            <div className="absolute bottom-5 left-5 right-5 border border-white/10 bg-black/45 p-5 backdrop-blur-xl lg:bottom-8 lg:left-8 lg:right-8">
              <p className="text-xs uppercase tracking-[0.25em] text-[var(--brand)]">
                {t.availableToday}
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {t.quickBooking}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--brand)]">
              {t.services}
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              {t.serviceTitle}
            </h2>
            <p className="mt-5 text-base leading-7 text-[var(--app-muted)]">
              {t.serviceText}
            </p>

            <Link
              href={reservarHref}
              className="mt-8 inline-flex border border-[var(--brand)] bg-[var(--brand)] px-6 py-4 text-sm font-semibold text-[var(--app-bg)]"
            >
              {t.availability}
            </Link>
          </div>

          <div className="grid gap-px overflow-hidden border border-white/10 bg-white/10">
            {(services || [])
              .slice(0, 4)
              .map((service) => (
                <Link
                  href={reservarHref}
                  key={service.id}
                  className="group bg-[var(--app-surface)] p-5 transition hover:bg-white/[0.08] sm:p-6"
                >
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <h3 className="text-xl font-semibold">
                        {serviceName(service)}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-7 text-[var(--app-muted)]">
                        {serviceDescription(service)}
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
                    {t.bookService} →
                  </p>
                </Link>
              ))}
          </div>
        </div>
        <div className="mt-10 flex justify-center">
          <Link
            href={reservarHref}
            className="btn-secondary inline-flex items-center gap-2"
          >
            {t.viewAllServices}
          </Link>
        </div>
      </section>

      {business?.products_enabled && products && products.length > 0 && (
        <section id="products" className="mx-auto max-w-7xl px-5 pb-20 lg:px-8 lg:pb-28">
          <div className="mb-8 border-b border-white/10 pb-6">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--brand)]">
              <Package size={16} />
              {t.products}
            </p>

            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">
              {t.products}
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--app-muted)]">
              {t.productsText}
            </p>
          </div>

          <div className="grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <article key={product.id} className="bg-[var(--app-surface)] p-5">
                {product.image_url && (
                  <div className="mb-5 aspect-square overflow-hidden border border-white/10 bg-white/[0.03]">
                    <img
                      src={product.image_url}
                      alt={productName(product)}
                      className="h-full w-full object-cover transition duration-500 hover:scale-105"
                    />
                  </div>
                )}

                <h3 className="text-lg font-semibold">{productName(product)}</h3>

                <p className="mt-2 overflow-hidden text-ellipsis text-sm leading-6 text-[var(--app-muted)] [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">
                  {productDescription(product) || ''}
                </p>

                <p className="mt-4 font-semibold text-[var(--brand)]">
                  {formatCurrency(Number(product.price || 0), business?.currency || 'EUR')}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section id="gallery" className="mx-auto max-w-7xl px-5 pb-20 lg:px-8 lg:pb-28">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="border border-white/10 bg-[var(--app-surface)] p-6 lg:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--brand)]">
              {t.experience}
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
              {t.experienceTitle}
            </h2>
            <p className="mt-4 text-sm leading-7 text-[var(--app-muted)]">
              {t.experienceText}
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

      {business?.reviews_enabled && (
        <section id="reviews" className="border-y border-white/10 bg-[var(--app-surface)]">
          <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
            <div className="mb-8 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--brand)]">
                  <Star size={16} />
                  {t.reviews}
                </p>

                <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">
                  {t.reviews}
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--app-muted)]">
                  {t.reviewsText}
                </p>
              </div>

              {business?.google_reviews_url && (
                <a
                  href={business.google_reviews_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  {t.leaveReview}
                </a>
              )}
            </div>

            {reviews && reviews.length > 0 && (
              <div className="relative overflow-hidden border border-white/10 bg-white/10">
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[var(--app-bg)] to-transparent" />

                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[var(--app-bg)] to-transparent" />
                <div className="reviews-marquee flex w-max gap-px">
                  {[...reviews, ...reviews].map((review, index) => (
                    <article
                      key={`${review.id}-${index}`}
                      className="w-[320px] shrink-0 bg-[var(--app-surface)] p-5 sm:w-[380px]"
                    >
                      <p className="text-sm font-semibold text-[var(--brand)]">
                        {'★'.repeat(Number(review.rating || 5))}
                      </p>

                      <p className="mt-4 overflow-hidden text-ellipsis text-sm leading-7 text-[var(--app-muted)] [display:-webkit-box] [-webkit-line-clamp:5] [-webkit-box-orient:vertical]">
                        “{reviewComment(review)}”
                      </p>

                      <div className="mt-5 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center border border-white/10 bg-white/[0.04] text-sm font-semibold">
                          {String(review.author_name || 'U').charAt(0)}
                        </div>

                        <div>
                          <p className="font-semibold">{review.author_name}</p>

                          <p className="text-xs text-[var(--app-muted)]">
                            {t.googleReview}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-col items-start gap-4 border border-white/10 bg-white/[0.04] p-5 sm:flex-row sm:items-center">
              <a
                href={business?.google_reviews_url || GOOGLE_REVIEW_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block transition hover:-translate-y-1"
                aria-label={t.leaveReview}
              >
                <img
                  src={business?.google_review_qr_url || '/google-review-qr.png'}
                  alt="QR Google Reviews"
                  className="h-28 w-28 border border-white/10 object-cover"
                />
              </a>

              <div>
                <h3 className="text-lg font-semibold">{t.leaveReview}</h3>

                <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">
                  {language === 'en'
                    ? 'Scan or tap the QR to see all reviews and share your experience on Google.'
                    : 'Escanea o toca el QR para ver todas las reseñas y dejar tu propia reseña en Google.'}
                </p>

                <a
                  href={business?.google_reviews_url || GOOGLE_REVIEW_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex text-sm font-semibold text-[var(--brand)] hover:underline"
                >
                  {language === 'en' ? 'Open Google Reviews' : 'Abrir reseñas de Google'}
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="border-y border-white/10 bg-[var(--app-surface)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--brand)]">
              {t.onlineBooking}
            </p>

            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              {t.bookingTitle}
            </h2>
          </div>

          <div className="space-y-6">
            <Feature
              icon={<ShieldCheck size={18} />}
              title={t.realAvailability}
              text={t.realAvailabilityText}
            />
            {business?.lgbtq_friendly && (
              <Feature
                icon={<span className="text-xl">🏳️‍🌈</span>}
                title={t.lgbtqShort}
                text={t.lgbtqText}
              />
            )}
            <Feature
              icon={<CalendarCheck size={18} />}
              title={t.instantConfirmation}
              text={t.instantConfirmationText}
            />

            <Link
              href={reservarHref}
              className="inline-flex bg-[var(--brand)] px-7 py-4 text-sm font-semibold text-[var(--app-bg)] transition hover:opacity-90"
            >
              {t.bookNow}
            </Link>
          </div>
        </div>
      </section>

      <section id="location" className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="grid gap-8 border border-white/10 p-6 lg:grid-cols-2 lg:p-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--brand)]">
              {t.location}
            </p>

            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
              {t.mapsText}
            </h2>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={reservarHref}
                className="bg-[var(--brand)] px-6 py-4 text-center text-sm font-semibold text-[var(--app-bg)] transition hover:opacity-90"
              >
                {t.reserve}
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
              {t.findUs}
            </p>

            <p className="mt-4 text-sm leading-7 text-[var(--app-muted)]">
              {business?.address || (language === 'en' ? 'Barcelona, Spain' : 'Barcelona, España')}
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
                  {t.openMaps}
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
          href={reservarHref}
          className="mx-auto block max-w-md bg-[var(--brand)] px-5 py-4 text-center text-sm font-semibold text-[var(--app-bg)] transition hover:opacity-90"
        >
          {t.reserve}
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