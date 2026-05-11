import type { Metadata } from "next";
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

export const metadata = {
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
    'barbería premium',
    'champions barbershop',
  ],

  authors: [
    {
      name: 'Elian Gomez',
      url: 'https://api.whatsapp.com/send/?phone=18296055347&text=Hola+Elian%2C+he+visto+tu+trabajo+en+Champions+Barbershop%2C+y+me+gustar%C3%ADa+cotizar+una+web.&type=phone_number&app_absent=0',
    },
  ],

  creator: 'Elian Gomez',
  publisher: 'Champions Barbershop',

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
