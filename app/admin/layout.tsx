import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Panel de administración',
  description:
    'Panel privado para gestionar citas, servicios, horarios y ajustes.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}