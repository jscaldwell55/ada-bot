/**
 * Root Layout
 * Wraps the entire app with providers and metadata
 */

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { SupabaseProvider } from '@/components/providers/SupabaseProvider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ada - Emotion Recognition & Regulation',
  description: 'A supportive companion for neurodivergent children learning about emotions',
  keywords: ['emotion', 'regulation', 'children', 'neurodivergent', 'learning'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SupabaseProvider>
          {children}
        </SupabaseProvider>
      </body>
    </html>
  )
}
