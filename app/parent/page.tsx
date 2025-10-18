/**
 * Parent Dashboard Home
 * Shows all children as cards, quick stats, recent sessions
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import type { Child } from '@/types/database'
import ChildCard from '@/components/dashboard/ChildCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Users, TrendingUp, Calendar, Loader2 } from 'lucide-react'

export default function ParentDashboardPage() {
  const supabase = useSupabase()
  const router = useRouter()
  const [children, setChildren] = useState<Child[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [parentId, setParentId] = useState<string | null>(null)

  // Check authentication first
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          router.push('/auth/login?redirect=/parent')
          return
        }

        setParentId(user.id)
      } catch (err) {
        console.error('Error checking authentication:', err)
        router.push('/auth/login')
      }
    }

    checkAuth()
  }, [supabase, router])

  // Load children once we have parentId
  useEffect(() => {
    if (!parentId) return

    async function loadChildren() {
      try {
        const { data, error } = await supabase
          .from('children')
          .select('*')
          .eq('parent_id', parentId!)
          .order('created_at', { ascending: false })

        if (error) throw error
        setChildren(data || [])
      } catch (err) {
        console.error('Error loading children:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadChildren()
  }, [supabase, parentId])

  if (isLoading || !parentId) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">My Children</h2>
          <p className="text-muted-foreground mt-1">
            Manage profiles and track emotion learning progress
          </p>
        </div>

        <Button asChild>
          <Link href="/parent/children/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Child
          </Link>
        </Button>
      </div>

      {/* Quick Stats */}
      {children.length > 0 && (
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Children
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{children.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Sessions This Week
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Coming soon
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Average Accuracy
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">
                Complete sessions to see stats
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Children Grid */}
      {children.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader className="text-center py-12">
            <div className="flex justify-center mb-4">
              <Users className="h-16 w-16 text-muted-foreground" />
            </div>
            <CardTitle>No Children Added Yet</CardTitle>
            <CardDescription>
              Get started by adding your first child profile
            </CardDescription>
            <div className="mt-6">
              <Button asChild>
                <Link href="/parent/children/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Child
                </Link>
              </Button>
            </div>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children.map((child) => (
            <ChildCard key={child.id} child={child} />
          ))}
        </div>
      )}

      {/* Help Section */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-lg">Getting Started</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">
            1. Add a child profile with their nickname and age
          </p>
          <p className="text-sm">
            2. Click on their profile to start an emotion practice session
          </p>
          <p className="text-sm">
            3. They&apos;ll read stories, identify emotions, and practice regulation skills
          </p>
          <p className="text-sm">
            4. Review their progress and insights in the dashboard
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
