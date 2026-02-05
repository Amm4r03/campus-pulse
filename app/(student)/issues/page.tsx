'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { FileText, Clock, CheckCircle2, AlertCircle, Filter, Plus } from 'lucide-react'
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

const statusConfig: Record<IssueStatus, { label: string; icon: typeof Clock; className: string }> = {
  open: { label: 'Open', icon: AlertCircle, className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  in_progress: { label: 'In Progress', icon: Clock, className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  resolved: { label: 'Resolved', icon: CheckCircle2, className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
}

function IssueCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-6 w-20" />
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
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
        <Button asChild>
          <Link href="/submit">
            <Plus className="mr-2 h-4 w-4" />
            New Issue
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
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
              <SelectItem value="open">Open</SelectItem>
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

      {/* Issues List */}
      <div className="space-y-4">
        {isLoading ? (
          <>
            <IssueCardSkeleton />
            <IssueCardSkeleton />
            <IssueCardSkeleton />
          </>
        ) : myIssues.length === 0 ? (
          <EmptyState />
        ) : (
          myIssues.map((issue) => {
            const status = statusConfig[issue.status]
            const StatusIcon = status.icon

            return (
              <Link key={issue.id} href={`/issues/${issue.id}`}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{issue.title}</h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <span>{issue.category?.name || 'Unknown Category'}</span>
                          <span>•</span>
                          <span>{issue.location?.name || 'Unknown Location'}</span>
                          <span>•</span>
                          <span>{formatDate(issue.created_at)}</span>
                        </div>
                        {issue.aggregation_status === 'aggregated' && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Merged with similar reports
                          </p>
                        )}
                      </div>
                      <Badge className={cn('flex-shrink-0', status.className)}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {status.label}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
