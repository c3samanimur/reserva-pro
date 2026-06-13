import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ReservaPro — Reserva en peluquerías y barberías',
  description: 'Encuentra y reserva cita en las mejores peluquerías, barberías y centros de estética cerca de ti.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-white min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  )
}
