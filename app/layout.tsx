import type { Metadata, Viewport } from 'next'
import './globals.css'
import { SWRegister } from './sw-register'

export const metadata: Metadata = {
  title: 'Surf Judge',
  description: 'WSL-style blind surf judging system',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Surf Judge' }
}

export const viewport: Viewport = {
  themeColor: '#0ea5e9',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-screen bg-slate-950 text-white antialiased">
        <SWRegister />
        {children}
        <footer className="fixed bottom-0 left-0 right-0 text-center text-xs text-slate-600 py-1 pointer-events-none">
          Hecho por duendes.app 2026
        </footer>
      </body>
    </html>
  )
}
