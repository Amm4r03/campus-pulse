'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  Tag, 
  Calendar,
  Users,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useIssueStore } from '@/stores'
import { cn } from '@/lib/utils'
import type { IssueStatus } from '@/types'

const statusConfig: Record<IssueStatus, { label: string; icon: typeof Clock; className: string; description: string }> = {
  open: { 
    label: 'Open', 
    icon: AlertCircle, 
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    description: 'Your issue has been received and is awaiting review.'
  },
  in_progress: { 
    label: 'In Progress', 
    icon: Clock, 
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    description: 'Your issue is being worked on by the relevant authority.'
  },
  resolved: { 
    label: 'Resolved', 
    icon: CheckCircle2, 
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    description: 'This issue has been resolved.'
  },
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardContent className="p-4 space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function IssueDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { currentIssue, isLoading, fetchIssueById, clearCurrentIssue } = useIssueStore()

  const issueId = params.id as string

  useEffect(() => {
    if (issueId) {
      fetchIssueById(issueId)
    }
    return () => clearCurrentIssue()
  }, [issueId, fetchIssueById, clearCurrentIssue])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return <PageSkeleton />
  }

  if (!currentIssue) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Issue Not Found</h3>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              The issue you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
            </p>
            <Button asChild>
              <Link href="/issues">View All Issues</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const status = statusConfig[currentIssue.status]
  const StatusIcon = status.icon

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Issues
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Issue Details */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">{currentIssue.title}</CardTitle>
                  <CardDescription className="mt-1">
                    Issue ID: <span className="font-mono">{currentIssue.id}</span>
                  </CardDescription>
                </div>
                <Badge className={cn('flex-shrink-0', status.className)}>
                  <StatusIcon className="mr-1 h-3 w-3" />
                  {status.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Description */}
              <div>
                <h4 className="mb-2 text-sm font-medium text-muted-foreground">Description</h4>
                <p className="whitespace-pre-wrap text-sm">{currentIssue.description}</p>
              </div>

              <Separator />

              {/* Metadata */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Category</p>
                    <p className="text-sm text-muted-foreground">
                      {currentIssue.category?.name || 'Unknown'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">
                      {currentIssue.location?.name || 'Unknown'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Submitted</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(currentIssue.created_at)}
                    </p>
                  </div>
                </div>
                {currentIssue.aggregation_status === 'aggregated' && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Aggregation</p>
                      <p className="text-sm text-muted-foreground">
                        Merged with similar reports
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Current Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={cn('flex items-center gap-3 rounded-lg p-3', status.className)}>
                <StatusIcon className="h-5 w-5" />
                <div>
                  <p className="font-medium">{status.label}</p>
                  <p className="text-xs opacity-80">{status.description}</p>
                </div>
              </div>

              {/* Status Timeline (simplified) */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Progress</h4>
                <div className="relative pl-6">
                  <div className="absolute left-2 top-0 h-full w-px bg-border" />
                  
                  {/* Submitted */}
                  <div className="relative pb-4">
                    <div className="absolute -left-4 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                      <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                    </div>
                    <p className="text-sm font-medium">Submitted</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(currentIssue.created_at)}
                    </p>
                  </div>

                  {/* Under Review */}
                  <div className="relative pb-4">
                    <div className={cn(
                      "absolute -left-4 flex h-4 w-4 items-center justify-center rounded-full",
                      currentIssue.status !== 'open' ? 'bg-primary' : 'bg-muted'
                    )}>
                      {currentIssue.status !== 'open' ? (
                        <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                      ) : (
                        <Clock className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                    <p className={cn(
                      "text-sm font-medium",
                      currentIssue.status === 'open' && 'text-muted-foreground'
                    )}>
                      Under Review
                    </p>
                  </div>

                  {/* In Progress */}
                  <div className="relative pb-4">
                    <div className={cn(
                      "absolute -left-4 flex h-4 w-4 items-center justify-center rounded-full",
                      currentIssue.status === 'in_progress' || currentIssue.status === 'resolved' 
                        ? 'bg-primary' 
                        : 'bg-muted'
                    )}>
                      {currentIssue.status === 'in_progress' || currentIssue.status === 'resolved' ? (
                        <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                      ) : (
                        <Clock className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                    <p className={cn(
                      "text-sm font-medium",
                      currentIssue.status === 'open' && 'text-muted-foreground'
                    )}>
                      In Progress
                    </p>
                  </div>

                  {/* Resolved */}
                  <div className="relative">
                    <div className={cn(
                      "absolute -left-4 flex h-4 w-4 items-center justify-center rounded-full",
                      currentIssue.status === 'resolved' ? 'bg-primary' : 'bg-muted'
                    )}>
                      {currentIssue.status === 'resolved' ? (
                        <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                      ) : (
                        <Clock className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                    <p className={cn(
                      "text-sm font-medium",
                      currentIssue.status !== 'resolved' && 'text-muted-foreground'
                    )}>
                      Resolved
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Help Card */}
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                Have questions about your issue? Contact the administration office for more information.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
