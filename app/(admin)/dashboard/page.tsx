'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  TrendingUp,
  Filter,
  ChevronRight,
  Users,
  Zap
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { useAdminStore } from '@/stores'
import { cn } from '@/lib/utils'
import { ISSUE_CATEGORIES } from '@/lib/data/categories'
import { CAMPUS_LOCATIONS } from '@/lib/data/locations'
import type { IssueStatus } from '@/types'

const statusConfig: Record<IssueStatus, { label: string; icon: typeof Clock; className: string }> = {
  open: { label: 'Open', icon: AlertCircle, className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  in_progress: { label: 'In Progress', icon: Clock, className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  resolved: { label: 'Resolved', icon: CheckCircle2, className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
}

function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend 
}: { 
  title: string
  value: number | string
  description: string
  icon: typeof TrendingUp
  trend?: { value: number; positive: boolean }
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <p className={cn(
            "text-xs mt-1",
            trend.positive ? "text-emerald-600" : "text-red-600"
          )}>
            {trend.positive ? '+' : ''}{trend.value}% from last week
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function IssueCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex justify-between">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function getPriorityLabel(score: number): string {
  if (score >= 80) return 'Critical'
  if (score >= 60) return 'High'
  if (score >= 40) return 'Medium'
  return 'Low'
}

export default function AdminDashboardPage() {
  const { 
    aggregatedIssues, 
    stats, 
    filters, 
    isLoading, 
    fetchAggregatedIssues,
    setFilters
  } = useAdminStore()

  useEffect(() => {
    fetchAggregatedIssues()
  }, [fetchAggregatedIssues])

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of campus issues and their status
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Issues"
          value={stats.total}
          description="All aggregated issues"
          icon={TrendingUp}
        />
        <StatCard
          title="Open Issues"
          value={stats.open}
          description="Awaiting review"
          icon={AlertCircle}
          trend={{ value: 12, positive: false }}
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          description="Being worked on"
          icon={Clock}
        />
        <StatCard
          title="High Priority"
          value={stats.highPriority}
          description="Score >= 75"
          icon={Zap}
        />
      </div>

      {/* Filters and Issues List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Aggregated Issues</CardTitle>
              <CardDescription>
                Issues sorted by priority score
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ status: value as IssueStatus | 'all' })}
            >
              <SelectTrigger className="w-[150px]">
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
              value={filters.category_id}
              onValueChange={(value) => setFilters({ category_id: value })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {ISSUE_CATEGORIES.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.sort_by}
              onValueChange={(value) => setFilters({ sort_by: value as 'priority' | 'date' | 'frequency' })}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="frequency">Frequency</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Issues List */}
          <div className="space-y-3">
            {isLoading ? (
              <>
                <IssueCardSkeleton />
                <IssueCardSkeleton />
                <IssueCardSkeleton />
              </>
            ) : aggregatedIssues.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-semibold">No Issues Found</h3>
                <p className="text-sm text-muted-foreground">
                  No issues match your current filters.
                </p>
              </div>
            ) : (
              aggregatedIssues.map((issue) => {
                const status = statusConfig[issue.status]
                const StatusIcon = status.icon
                const category = ISSUE_CATEGORIES.find(c => c.id === issue.canonical_category_id)
                const location = CAMPUS_LOCATIONS.find(l => l.id === issue.location_id)

                return (
                  <Link key={issue.id} href={`/dashboard/issues/${issue.id}`}>
                    <Card className="transition-all hover:border-primary/50 hover:shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold truncate">
                                {category?.name || 'Unknown Category'}
                              </h3>
                              {category?.is_environmental && (
                                <Badge variant="outline" className="text-xs">
                                  Environmental
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {location?.name || 'Unknown Location'}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className={status.className}>
                                <StatusIcon className="mr-1 h-3 w-3" />
                                {status.label}
                              </Badge>
                              <Badge variant="secondary" className="gap-1">
                                <Users className="h-3 w-3" />
                                {issue.total_reports} reports
                              </Badge>
                              {issue.frequency_30min > 0 && (
                                <Badge variant="secondary" className="gap-1 text-amber-600">
                                  <Zap className="h-3 w-3" />
                                  {issue.frequency_30min} in 30min
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {formatTimeAgo(issue.latest_report_time)}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="text-right">
                              <div className="text-2xl font-bold">{issue.priority_score}</div>
                              <div className={cn(
                                "text-xs font-medium",
                                issue.priority_score >= 80 ? "text-red-600" :
                                issue.priority_score >= 60 ? "text-orange-600" :
                                issue.priority_score >= 40 ? "text-yellow-600" :
                                "text-emerald-600"
                              )}>
                                {getPriorityLabel(issue.priority_score)}
                              </div>
                            </div>
                            <Progress 
                              value={issue.priority_score} 
                              className="w-20 h-2"
                            />
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
