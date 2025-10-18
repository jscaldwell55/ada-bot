/**
 * Landing Page
 * Welcome screen with login/signup for parents and quick child access
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart, Brain, Sparkles } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16 space-y-6">
          <div className="flex justify-center">
            <div className="text-8xl mb-4">🤖</div>
          </div>
          <h1 className="text-6xl font-bold text-primary mb-4">
            Hi, I&apos;m Ada!
          </h1>
          <p className="text-2xl text-muted-foreground max-w-2xl mx-auto">
            Your friendly emotion learning companion
          </p>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            I help kids ages 6-12 recognize and manage their emotions through fun stories and activities.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-16 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex justify-center mb-2">
                <Heart className="h-12 w-12 text-pink-500" />
              </div>
              <CardTitle className="text-center">Learn Emotions</CardTitle>
              <CardDescription className="text-center">
                Practice identifying 7 different emotions through engaging stories
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-center mb-2">
                <Brain className="h-12 w-12 text-purple-500" />
              </div>
              <CardTitle className="text-center">Regulation Skills</CardTitle>
              <CardDescription className="text-center">
                Try calming activities like breathing, grounding, and movement
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-center mb-2">
                <Sparkles className="h-12 w-12 text-yellow-500" />
              </div>
              <CardTitle className="text-center">Positive Feedback</CardTitle>
              <CardDescription className="text-center">
                Get personalized praise and celebrate your progress!
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="border-4 border-primary">
            <CardHeader>
              <CardTitle className="text-center text-2xl">For Parents</CardTitle>
              <CardDescription className="text-center">
                Create an account to track your child&apos;s progress
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/parent">Parent Dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-center text-2xl">Quick Start</CardTitle>
              <CardDescription className="text-center">
                If you already have a child profile, start a session below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-sm text-muted-foreground">
                Parents: Navigate to your dashboard to view child profiles and start sessions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-sm text-muted-foreground">
          <p>
            Ada is designed for neurodivergent children ages 6-12 with parent supervision
          </p>
          <p className="mt-2">
            Safe, private, and COPPA-compliant
          </p>
        </div>
      </div>
    </div>
  )
}
