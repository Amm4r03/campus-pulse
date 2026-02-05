'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  FileText,
  MapPin,
  Calendar,
  Users,
  TrendingUp,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useIssueStore, useAuthStore } from '@/stores'
import { cn } from '@/lib/utils'
import type { IssueStatus, IssueReport } from '@/types'

const statusConfig: Record<IssueStatus, { 
  label: string
  icon: typeof Clock
  className: string
  bgClassName: string
  description: string
}> = {
  open: { 
    label: 'Pending Review', 
    icon: AlertCircle, 
    className: 'text-red-600 dark:text-red-400',
    bgClassName: 'bg-red-100 dark:bg-red-900/20',
    description: 'Your issue is waiting to be reviewed by administration'
  },
  in_progress: { 
    label: 'Being Addressed', 
    icon: Clock, 
    className: 'text-amber-600 dark:text-amber-400',
    bgClassName: 'bg-amber-100 dark:bg-amber-900/20',
    description: 'Administration is actively working on this issue'
  },
  resolved: { 
    label: 'Resolved', 
    icon: CheckCircle2, 
    className: 'text-emerald-600 dark:text-emerald-400',
    bgClassName: 'bg-emerald-100 dark:bg-emerald-900/20',
    description: 'This issue has been resolved'
  },
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  description,
  className 
}: { 
  title: string
  value: number
  icon: typeof Clock
  description: string
  className?: string
}) {
  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <Icon className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function IssueTrackingCard({ issue }: { issue: IssueReport }) {
  const status = statusConfig[issue.status]
  const StatusIcon = status.icon

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getDaysAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    return `${diffInDays} days ago`
  }

  // Calculate progress based on status
  const progressValue = issue.status === 'resolved' ? 100 : issue.status === 'in_progress' ? 60 : 20

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Status Indicator */}
          <div className={cn(
            "w-full sm:w-2 sm:min-h-full",
            issue.status === 'open' && "bg-red-500",
            issue.status === 'in_progress' && "bg-amber-500",
            issue.status === 'resolved' && "bg-emerald-500",
          )}>
            <div className="h-1 sm:h-full" />
          </div>

          {/* Content */}
          <div className="flex-1 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className={cn("text-xs", status.className, status.bgClassName)}>
                    <StatusIcon className="mr-1 h-3 w-3" />
                    {status.label}
                  </Badge>
                  {issue.aggregation_status === 'aggregated' && (
                    <Badge variant="secondary" className="text-xs">
                      <Users className="mr-1 h-3 w-3" />
                      Grouped
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold text-base mb-1 line-clamp-1">
                  {issue.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {issue.description}
                </p>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {issue.location?.name || 'Unknown'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(issue.created_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {getDaysAgo(issue.created_at)}
                  </span>
                </div>
              </div>

              {/* Action */}
              <Button variant="outline" size="sm" asChild className="shrink-0">
                <Link href={`/issues/${issue.id}`}>
                  View Details
                  <ArrowRight className="ml-2 h-3 w-3" />
                </Link>
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{progressValue}%</span>
              </div>
              <Progress value={progressValue} className="h-1.5" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-40" />
      <Skeleton className="h-40" />
    </div>
  )
}

export default function TrackIssuePage() {
  const { user } = useAuthStore()
  const { myIssues, isLoading, fetchMyIssues } = useIssueStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    const userId = user?.id || 'student-1'
    fetchMyIssues(userId)
  }, [user?.id, fetchMyIssues])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    const userId = user?.id || 'student-1'
    await fetchMyIssues(userId)
    setIsRefreshing(false)
  }

  // Filter issues by search query
  const filteredIssues = myIssues.filter(issue => 
    issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    issue.location?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Calculate stats
  const stats = {
    total: myIssues.length,
    pending: myIssues.filter(i => i.status === 'open').length,
    inProgress: myIssues.filter(i => i.status === 'in_progress').length,
    resolved: myIssues.filter(i => i.status === 'resolved').length,
  }

  // Calculate resolution rate
  const resolutionRate = stats.total > 0 
    ? Math.round((stats.resolved / stats.total) * 100) 
    : 0

  if (isLoading && myIssues.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Track My Issues</h1>
          <p className="text-muted-foreground">Monitor the status of your reported issues</p>
        </div>
        <LoadingSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Track My Issues</h1>
          <p className="text-muted-foreground">
            Monitor the status of your reported issues
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Issues"
          value={stats.total}
          icon={FileText}
          description="All submitted issues"
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          icon={AlertCircle}
          description="Awaiting review"
          className="border-l-4 border-l-red-500"
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          icon={Clock}
          description="Being addressed"
          className="border-l-4 border-l-amber-500"
        />
        <StatCard
          title="Resolved"
          value={stats.resolved}
          icon={CheckCircle2}
          description="Successfully closed"
          className="border-l-4 border-l-emerald-500"
        />
      </div>

      {/* Resolution Rate Card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Overall Resolution Rate</CardTitle>
              <CardDescription>Percentage of issues that have been resolved</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-2xl font-bold">{resolutionRate}%</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={resolutionRate} className="h-2" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{stats.resolved} resolved</span>
            <span>{stats.total - stats.resolved} remaining</span>
          </div>
        </CardContent>
      </Card>

      {/* Search and Issue List */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search issues by title, description, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Issues List */}
        {filteredIssues.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">
                {searchQuery ? 'No Matching Issues' : 'No Issues Yet'}
              </h3>
              <p className="mb-4 text-center text-sm text-muted-foreground">
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : "You haven't submitted any issues yet. Submit one to start tracking."
                }
              </p>
              {!searchQuery && (
                <Button asChild>
                  <Link href="/submit">Submit an Issue</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredIssues.length} issue{filteredIssues.length !== 1 ? 's' : ''}
              </p>
              <Link href="/issues" className="text-sm text-primary hover:underline">
                View All Issues
              </Link>
            </div>
            {filteredIssues.map(issue => (
              <IssueTrackingCard key={issue.id} issue={issue} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
