'use client'

import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

export interface SubmissionProgressBarProps {
  progress: number
  className?: string
}

export function SubmissionProgressBar({ progress, className }: SubmissionProgressBarProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Progress value={progress} className="h-2" />
      <div className="flex justify-end">
        <span className="text-xs tabular-nums text-muted-foreground">{progress}%</span>
      </div>
    </div>
  )
}
