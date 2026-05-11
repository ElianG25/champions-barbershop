import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Acceso privado',
  description:
    'Acceso privado al panel administrativo de Champions Barbershop.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}