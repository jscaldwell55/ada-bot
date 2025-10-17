'use client'

/**
 * Script Selector Component
 * Display 2-3 recommended regulation script cards
 */

import { useState } from 'react'
import type { RegulationScript } from '@/types/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import { Clock } from 'lucide-react'

interface ScriptSelectorProps {
  scripts: RegulationScript[]
  onScriptSelect: (script: RegulationScript) => void
  disabled?: boolean
}

export default function ScriptSelector({
  scripts,
  onScriptSelect,
  disabled = false,
}: ScriptSelectorProps) {
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null)
  const [hoveredScriptId, setHoveredScriptId] = useState<string | null>(null)

  if (scripts.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">
          No regulation activities available right now.
        </p>
      </div>
    )
  }

  const handleSelect = (script: RegulationScript) => {
    if (!disabled) {
      setSelectedScriptId(script.id)
      onScriptSelect(script)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scripts.map((script) => {
          const isSelected = selectedScriptId === script.id
          const isHovered = hoveredScriptId === script.id

          return (
            <Card
              key={script.id}
              className={cn(
                'cursor-pointer transition-all duration-200 hover:shadow-lg',
                isSelected && 'ring-4 ring-primary ring-offset-2',
                isHovered && !isSelected && 'scale-105',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              onClick={() => handleSelect(script)}
              onMouseEnter={() => setHoveredScriptId(script.id)}
              onMouseLeave={() => setHoveredScriptId(null)}
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-label={`Select ${script.name}`}
              aria-pressed={isSelected}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
                  e.preventDefault()
                  handleSelect(script)
                }
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="text-4xl mb-2" aria-hidden="true">
                    {script.icon_emoji}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{script.duration_seconds}s</span>
                  </div>
                </div>
                <CardTitle className="text-lg">{script.name}</CardTitle>
                <CardDescription>{script.description}</CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-2">
                  {/* Step count */}
                  <div className="text-sm text-muted-foreground">
                    {script.steps.length} steps
                  </div>

                  {/* Preview first step */}
                  {script.steps.length > 0 && (
                    <div className="text-sm bg-muted p-2 rounded">
                      <span className="font-medium">First step:</span>{' '}
                      {script.steps[0].emoji} {script.steps[0].text}
                    </div>
                  )}

                  {/* Select button for mobile/touch */}
                  <Button
                    variant={isSelected ? 'default' : 'outline'}
                    className="w-full mt-3"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelect(script)
                    }}
                    disabled={disabled}
                  >
                    {isSelected ? 'Selected' : 'Choose This Activity'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
