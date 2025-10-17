/**
 * Add New Child Page
 * Form to create a child profile with nickname, age_band, avatar
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2 } from 'lucide-react'
import type { AgeBand } from '@/types/database'

const AVATAR_EMOJIS = [
  '😊', '🐶', '🦁', '🐼', '🐨',
  '🐸', '🦊', '🐙', '🦄', '🐰',
  '🐯', '🐱', '🐵', '🐷', '🐮',
]

const AGE_BANDS: { value: AgeBand; label: string }[] = [
  { value: '6-7', label: '6-7 years' },
  { value: '8-9', label: '8-9 years' },
  { value: '10-12', label: '10-12 years' },
]

export default function NewChildPage() {
  const router = useRouter()
  // Temporary workaround for Supabase type inference issue
  const supabase = useSupabase() as any

  const [nickname, setNickname] = useState('')
  const [ageBand, setAgeBand] = useState<AgeBand>('6-7')
  const [avatarEmoji, setAvatarEmoji] = useState('😊')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!nickname.trim()) {
      setError('Please enter a nickname')
      return
    }

    try {
      setIsSubmitting(true)

      // In a real app, get parent_id from authenticated user
      const parentId = '00000000-0000-0000-0000-000000000000' // Placeholder

      const { error: insertError } = await supabase
        .from('children')
        .insert({
          parent_id: parentId,
          nickname: nickname.trim(),
          age_band: ageBand,
          avatar_emoji: avatarEmoji,
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Redirect to parent dashboard or child page
      router.push('/parent')
    } catch (err) {
      console.error('Error creating child:', err)
      setError(err instanceof Error ? err.message : 'Failed to create child profile')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Button
        variant="ghost"
        onClick={() => router.push('/parent')}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Add a New Child</CardTitle>
          <CardDescription>
            Create a profile to track your child's emotion learning journey
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nickname */}
            <div className="space-y-2">
              <label htmlFor="nickname" className="text-sm font-medium">
                Nickname *
              </label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter your child's nickname"
                className="w-full px-4 py-2 rounded-md border border-input bg-background"
                maxLength={50}
                required
              />
              <p className="text-xs text-muted-foreground">
                This is how Ada will address your child (e.g., "Sam", "Alex")
              </p>
            </div>

            {/* Age Band */}
            <div className="space-y-2">
              <label htmlFor="age-band" className="text-sm font-medium">
                Age Range *
              </label>
              <select
                id="age-band"
                value={ageBand}
                onChange={(e) => setAgeBand(e.target.value as AgeBand)}
                className="w-full px-4 py-2 rounded-md border border-input bg-background"
                required
              >
                {AGE_BANDS.map((band) => (
                  <option key={band.value} value={band.value}>
                    {band.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                This helps Ada choose age-appropriate stories
              </p>
            </div>

            {/* Avatar Emoji */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Avatar *
              </label>
              <div className="grid grid-cols-5 gap-3">
                {AVATAR_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setAvatarEmoji(emoji)}
                    className={`
                      text-4xl p-4 rounded-lg border-2 transition-all
                      ${
                        avatarEmoji === emoji
                          ? 'border-primary bg-primary/10 scale-110'
                          : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                      }
                    `}
                    aria-label={`Select ${emoji} avatar`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Pick a fun avatar for your child
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">
                  {error}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Profile...
                  </>
                ) : (
                  'Create Profile'
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/parent')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Privacy Notice */}
      <Card className="mt-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Privacy Notice:</strong> We only collect your child's nickname and age range.
            No personally identifiable information is stored. All data is encrypted and
            COPPA-compliant.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
