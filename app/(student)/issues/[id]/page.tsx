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
  FileText,
  MessageSquare,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useIssueStore } from '@/stores'
import { cn } from '@/lib/utils'
import type { IssueStatus } from '@/types'

const statusConfig: Record<IssueStatus, { 
  label: string
  icon: typeof Clock
  className: string
  description: string
  step: number
}> = {
  open: { 
    label: 'Pending Review', 
    icon: AlertCircle, 
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    description: 'Your issue has been received and is awaiting review.',
    step: 1
  },
  in_progress: { 
    label: 'In Progress', 
    icon: Clock, 
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    description: 'Your issue is being actively addressed by the relevant department.',
    step: 2
  },
  resolved: { 
    label: 'Resolved', 
    icon: CheckCircle2, 
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    description: 'This issue has been resolved. Thank you for your report!',
    step: 3
  },
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

function StatusTimeline({ currentStatus }: { currentStatus: IssueStatus }) {
  const steps = [
    { status: 'open' as const, label: 'Submitted', description: 'Issue received' },
    { status: 'in_progress' as const, label: 'In Progress', description: 'Being addressed' },
    { status: 'resolved' as const, label: 'Resolved', description: 'Issue closed' },
  ]

  const currentStep = statusConfig[currentStatus].step

  return (
    <div className="relative">
      {steps.map((step, index) => {
        const isActive = statusConfig[step.status].step <= currentStep
        const isCurrent = step.status === currentStatus
        const StepIcon = statusConfig[step.status].icon

        return (
          <div key={step.status} className="flex gap-4">
            {/* Timeline line and dot */}
            <div className="flex flex-col items-center">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                isActive 
                  ? isCurrent 
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-primary bg-primary/10 text-primary"
                  : "border-muted bg-muted text-muted-foreground"
              )}>
                <StepIcon className="h-5 w-5" />
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  "w-0.5 h-12 my-1 transition-colors",
                  statusConfig[steps[index + 1].status].step <= currentStep
                    ? "bg-primary"
                    : "bg-muted"
                )} />
              )}
            </div>

            {/* Content */}
            <div className="pb-8">
              <p className={cn(
                "font-medium",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}>
                {step.label}
              </p>
              <p className="text-sm text-muted-foreground">
                {step.description}
              </p>
              {isCurrent && (
                <Badge className={cn("mt-2", statusConfig[currentStatus].className)}>
                  Current Status
                </Badge>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function IssueDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { currentIssue, isLoading, fetchIssueById } = useIssueStore()

  const issueId = params.id as string

  useEffect(() => {
    fetchIssueById(issueId)
  }, [issueId, fetchIssueById])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'long',
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
              The issue you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
            </p>
            <Button asChild>
              <Link href="/issues">Back to My Issues</Link>
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
        Back to My Issues
      </Button>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Issue Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Issue Card */}
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{currentIssue.title}</CardTitle>
                  <CardDescription>
                    <span className="font-mono text-xs">ID: {currentIssue.id}</span>
                  </CardDescription>
                </div>
                <Badge className={cn('flex-shrink-0 shadow-sm', status.className)}>
                  <StatusIcon className="mr-1 h-3 w-3" />
                  {status.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Banner */}
              <div className={cn(
                "rounded-lg p-4 border",
                currentIssue.status === 'resolved' 
                  ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20"
                  : currentIssue.status === 'in_progress'
                  ? "bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20"
                  : "bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20"
              )}>
                <p className="text-sm font-medium flex items-center gap-2">
                  <StatusIcon className="h-4 w-4" />
                  {status.description}
                </p>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  Description
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {currentIssue.description}
                </p>
              </div>

              <Separator />

              {/* Metadata Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">
                      {currentIssue.location?.name || 'Unknown Location'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Tag className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Category</p>
                    <p className="text-sm text-muted-foreground">
                      {currentIssue.category?.name || 'Unknown Category'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
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
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Aggregation Status</p>
                      <p className="text-sm text-primary">
                        Merged with similar reports for faster resolution
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Timeline */}
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Progress Timeline</CardTitle>
              <CardDescription>
                Track the status of your issue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StatusTimeline currentStatus={currentIssue.status} />
            </CardContent>
          </Card>

          {/* Help Card */}
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">Need Help?</h3>
              <p className="text-sm text-muted-foreground mb-3">
                If your issue hasn&apos;t been addressed within 48 hours, you can submit a follow-up.
              </p>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/submit">
                  Submit Follow-up
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
