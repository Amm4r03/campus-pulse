'use client'

import Link from 'next/link'
import { MapPin, Clock, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { IssueReport, IssueStatus } from '@/types'

const statusConfig: Record<IssueStatus, { label: string; className: string }> = {
  open: { label: 'Pending', className: 'bg-red-500/90 text-white' },
  in_progress: { label: 'In Progress', className: 'bg-amber-500/90 text-white' },
  resolved: { label: 'Resolved', className: 'bg-emerald-500/90 text-white' },
}

// Placeholder images for issue cards
const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=300&fit=crop', // Library
  'https://images.unsplash.com/photo-1584432810601-6c7f27d2362b?w=400&h=300&fit=crop', // Bathroom
  'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&h=300&fit=crop', // Classroom
]

interface ActiveReportsPreviewProps {
  issues: IssueReport[]
  className?: string
}

export function ActiveReportsPreview({ issues, className }: ActiveReportsPreviewProps) {
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return 'Yesterday'
    return `${diffInDays} days ago`
  }

  if (issues.length === 0) {
    return null
  }

  // Only show first 3 issues
  const displayIssues = issues.slice(0, 3)

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">My Active Reports</h2>
        <Link 
          href="/issues" 
          className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
        >
          View All
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayIssues.map((issue, index) => {
          const status = statusConfig[issue.status]
          
          return (
            <Link key={issue.id} href={`/issues/${issue.id}`}>
              <Card className={cn(
                "group cursor-pointer overflow-hidden hover:shadow-md transition-shadow",
                issue.status === 'resolved' && "opacity-70"
              )}>
                {/* Image Header */}
                <div 
                  className="h-32 bg-cover bg-center relative"
                  style={{ 
                    backgroundImage: `url("${PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length]}")` 
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-4">
                    <Badge className={cn("text-xs font-bold", status.className)}>
                      {status.label}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                      {issue.title}
                    </h3>
                    <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(issue.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{issue.location?.name || 'Unknown location'}</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {issue.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
