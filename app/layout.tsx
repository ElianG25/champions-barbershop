import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cache } from "react";
import { supabase } from "@/lib/supabaseClient";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Revalidate hourly so edits to the business name/description/phone in the
// admin panel reach SEO metadata without waiting for a full redeploy.
export const revalidate = 3600

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://champions-barber.com'
const FALLBACK_NAME = 'Champions Barbershop'
const FALLBACK_DESCRIPTION =
  'Reserva cortes, barba y servicios premium en Champions Barbershop Barcelona. Agenda online rápida, moderna y optimizada para móvil.'

// Deduped per request so generateMetadata and RootLayout don't each fetch it.
const getBusinessSettings = cache(async () => {
  const { data } = await supabase.from('business_settings').select('*').single()
  return data
})

export async function generateMetadata(): Promise<Metadata> {
  const business = await getBusinessSettings()
  const name = business?.name || FALLBACK_NAME
  const description = business?.description || FALLBACK_DESCRIPTION
  const title = `${name} | Barbería premium en Barcelona`

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: `%s | ${name}`,
    },
    description,
    keywords: [
      'barbería barcelona',
      'barber shop barcelona',
      'reservar barbería',
      'corte de cabello barcelona',
      'barba barcelona',
      'champions barbershop',
    ],
    openGraph: {
      type: 'website',
      locale: 'es_ES',
      url: SITE_URL,
      title,
      description,
      siteName: name,
      images: [
        {
          url: '/og-cover.jpg',
          width: 1200,
          height: 630,
          alt: name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: name,
      description,
      images: ['/og-cover.jpg'],
    },
    robots: {
      index: true,
      follow: true,
    },
    icons: {
      icon: '/favicon.ico',
      shortcut: '/favicon.ico',
      apple: '/apple-touch-icon.png',
    },
  }
}

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const business = await getBusinessSettings()
  const name = business?.name || FALLBACK_NAME
  const phone = business?.phone || business?.whatsapp || null

  // No openingHoursSpecification here on purpose: hours are now set per
  // barber (multi-worker schedules), so there is no single accurate
  // business-wide schedule left to report as structured data.
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Barbershop',
    name,
    image: `${SITE_URL}/og-cover.jpg`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: business?.city || 'Barcelona',
      addressCountry: 'ES',
    },
    url: SITE_URL,
    priceRange: '€€',
  }

  if (phone) {
    jsonLd.telephone = phone
  }

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}
        <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />
      </body>
    </html>
  );
}
