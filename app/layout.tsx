import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ISO Shield - ISO 27001 Security Audit Platform',
  description: 'Comprehensive ISO 27001 Security Audit & Risk Management Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
