import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cancelar cita',
  description: 'Gestión de cancelación de cita.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function CancelarCitaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}