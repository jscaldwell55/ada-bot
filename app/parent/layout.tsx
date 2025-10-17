/**
 * Parent Dashboard Layout
 * Protected route layout with navigation sidebar
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/parent" className="flex items-center gap-2">
              <div className="text-3xl">🤖</div>
              <h1 className="text-2xl font-bold">Ada Parent Dashboard</h1>
            </Link>

            <nav className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Ada - Emotion Recognition & Regulation for Children</p>
          <p className="mt-2">Safe, Private, COPPA-Compliant</p>
        </div>
      </footer>
    </div>
  )
}
