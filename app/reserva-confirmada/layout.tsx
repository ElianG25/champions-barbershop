import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reserva confirmada',
  description:
    'Confirmación de cita en Champions Barbershop.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function ReservaConfirmadaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}