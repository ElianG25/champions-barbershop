import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reservar cita',
  description:
    'Reserva tu cita online en Champions Barbershop Barcelona. Elige servicio, fecha y horario disponible.',
  robots: {
    index: true,
    follow: true,
  },
}

export default function ReservarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}