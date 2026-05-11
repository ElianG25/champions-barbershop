import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://champions-barber.com'),
  title: {
    default: 'Champions Barbershop | Barbería premium en Barcelona',
    template: '%s | Champions Barbershop',
  },
  description:
    'Reserva cortes, barba y servicios premium en Champions Barbershop Barcelona. Agenda online rápida, moderna y optimizada para móvil.',
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
    url: 'https://champions-barber.com',
    title: 'Champions Barbershop | Barbería premium en Barcelona',
    description:
      'Reserva online cortes premium, barba y servicios masculinos en Barcelona.',
    siteName: 'Champions Barbershop',
    images: [
      {
        url: '/og-cover.jpg',
        width: 1200,
        height: 630,
        alt: 'Champions Barbershop',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Champions Barbershop',
    description:
      'Reserva online cortes premium y barbería moderna en Barcelona.',
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

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}
        <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Barbershop',

            name: 'Champions Barbershop',

            image: 'https://champions-barber.com/og-cover.jpg',

            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Barcelona',
              addressCountry: 'ES',
            },

            url: 'https://champions-barber.com',

            telephone: '+34617319143',

            priceRange: '€€',

            openingHoursSpecification: [
              {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: [
                  'Monday',
                  'Tuesday',
                  'Wednesday',
                  'Thursday',
                  'Friday',
                ],
                opens: '10:00',
                closes: '20:00',
              },
            ],
          }),
        }}
      />
      </body>
    </html>
  );
}
