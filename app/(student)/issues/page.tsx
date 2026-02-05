'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { FileText, Clock, CheckCircle2, AlertCircle, Filter, Plus, MapPin, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useIssueStore, useAuthStore } from '@/stores'
import { cn } from '@/lib/utils'
import type { IssueStatus } from '@/types'

const statusConfig: Record<IssueStatus, { label: string; icon: typeof Clock; className: string; bgClass: string }> = {
  open: { 
    label: 'Pending', 
    icon: AlertCircle, 
    className: 'bg-red-500/90 text-white',
    bgClass: 'from-red-500/20 to-transparent'
  },
  in_progress: { 
    label: 'In Progress', 
    icon: Clock, 
    className: 'bg-amber-500/90 text-white',
    bgClass: 'from-amber-500/20 to-transparent'
  },
  resolved: { 
    label: 'Resolved', 
    icon: CheckCircle2, 
    className: 'bg-emerald-500/90 text-white',
    bgClass: 'from-emerald-500/20 to-transparent'
  },
}

// Placeholder images
const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1584432810601-6c7f27d2362b?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1562774053-701939374585?w=400&h=200&fit=crop',
]

function IssueCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-32 w-full" />
      <CardContent className="p-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-full" />
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">No Issues Found</h3>
        <p className="mb-4 text-center text-sm text-muted-foreground">
          You haven&apos;t submitted any issues yet, or no issues match your current filters.
        </p>
        <Button asChild>
          <Link href="/submit">
            <Plus className="mr-2 h-4 w-4" />
            Submit Your First Issue
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export default function MyIssuesPage() {
  const { user } = useAuthStore()
  const { myIssues, isLoading, filters, setFilters, fetchMyIssues } = useIssueStore()

  useEffect(() => {
    if (user?.id) {
      fetchMyIssues(user.id)
    } else {
      // Use mock student ID for demo
      fetchMyIssues('student-1')
    }
  }, [user?.id, fetchMyIssues, filters])

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Issues</h1>
          <p className="text-muted-foreground">
            Track the status of your submitted issues
          </p>
        </div>
        <Button asChild className="shadow-lg shadow-primary/20">
          <Link href="/submit">
            <Plus className="mr-2 h-4 w-4" />
            New Issue
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          <Select
            value={filters.status}
            onValueChange={(value) => setFilters({ status: value as IssueStatus | 'all' })}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.sort_order}
            onValueChange={(value) => setFilters({ sort_order: value as 'asc' | 'desc' })}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Newest First</SelectItem>
              <SelectItem value="asc">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Issues Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <IssueCardSkeleton />
          <IssueCardSkeleton />
          <IssueCardSkeleton />
        </div>
      ) : myIssues.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myIssues.map((issue, index) => {
            const status = statusConfig[issue.status]
            const StatusIcon = status.icon

            return (
              <Link key={issue.id} href={`/issues/${issue.id}`}>
                <Card className={cn(
                  "group cursor-pointer overflow-hidden hover:shadow-lg transition-all duration-200",
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
                      <Badge className={cn("text-xs font-bold shadow-sm", status.className)}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {status.label}
                      </Badge>
                    </div>
                    <div className="absolute bottom-3 right-4">
                      <span className="text-xs text-white/90 font-medium">
                        {formatTimeAgo(issue.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                      {issue.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{issue.location?.name || 'Unknown Location'}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {issue.description}
                    </p>
                    {issue.aggregation_status === 'aggregated' && (
                      <p className="text-xs text-primary font-medium">
                        Merged with similar reports
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs text-muted-foreground">
                        {issue.category?.name}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
