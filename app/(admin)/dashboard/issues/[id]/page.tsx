'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  Tag, 
  Calendar,
  Users,
  Zap,
  TrendingUp,
  FileText,
  Building2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useAdminStore } from '@/stores'
import { ISSUE_CATEGORIES, AUTHORITIES } from '@/lib/data/categories'
import { CAMPUS_LOCATIONS } from '@/lib/data/locations'
import { cn } from '@/lib/utils'
import type { IssueStatus } from '@/types'

const statusConfig: Record<IssueStatus, { label: string; icon: typeof Clock; className: string }> = {
  open: { label: 'Open', icon: AlertCircle, className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  in_progress: { label: 'In Progress', icon: Clock, className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  resolved: { label: 'Resolved', icon: CheckCircle2, className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
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
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardContent className="p-4 space-y-4">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function getPriorityLabel(score: number): string {
  if (score >= 80) return 'Critical'
  if (score >= 60) return 'High'
  if (score >= 40) return 'Medium'
  return 'Low'
}

function getPriorityColor(score: number): string {
  if (score >= 80) return 'text-red-600'
  if (score >= 60) return 'text-orange-600'
  if (score >= 40) return 'text-yellow-600'
  return 'text-emerald-600'
}

export default function AdminIssueDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { 
    selectedIssue, 
    issueActions, 
    isLoading, 
    isActionLoading,
    fetchIssueById, 
    updateIssueStatus,
    selectIssue 
  } = useAdminStore()

  const [notes, setNotes] = useState('')
  const [newStatus, setNewStatus] = useState<IssueStatus | ''>('')

  const issueId = params.id as string

  useEffect(() => {
    if (issueId) {
      fetchIssueById(issueId)
    }
    return () => selectIssue(null)
  }, [issueId, fetchIssueById, selectIssue])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

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

  const handleStatusUpdate = async () => {
    if (!newStatus || !selectedIssue) return
    await updateIssueStatus(selectedIssue.id, newStatus, notes)
    setNotes('')
    setNewStatus('')
  }

  if (isLoading) {
    return <PageSkeleton />
  }

  if (!selectedIssue) {
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
              The issue you&apos;re looking for doesn&apos;t exist.
            </p>
            <Button onClick={() => router.back()}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const status = statusConfig[selectedIssue.status]
  const StatusIcon = status.icon
  const category = ISSUE_CATEGORIES.find(c => c.id === selectedIssue.canonical_category_id)
  const location = CAMPUS_LOCATIONS.find(l => l.id === selectedIssue.location_id)
  const authority = AUTHORITIES.find(a => a.id === selectedIssue.authority_id)

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Issue Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    {category?.name || 'Unknown Category'}
                    {category?.is_environmental && (
                      <Badge variant="outline">Environmental</Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Issue ID: <span className="font-mono">{selectedIssue.id}</span>
                  </CardDescription>
                </div>
                <Badge className={cn('flex-shrink-0', status.className)}>
                  <StatusIcon className="mr-1 h-3 w-3" />
                  {status.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Key Metrics */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs">Priority Score</span>
                  </div>
                  <div className={cn("text-2xl font-bold mt-1", getPriorityColor(selectedIssue.priority_score))}>
                    {selectedIssue.priority_score}
                  </div>
                  <Progress value={selectedIssue.priority_score} className="mt-2 h-1.5" />
                </div>
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="text-xs">Total Reports</span>
                  </div>
                  <div className="text-2xl font-bold mt-1">
                    {selectedIssue.total_reports}
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Zap className="h-4 w-4" />
                    <span className="text-xs">Last 30 min</span>
                  </div>
                  <div className="text-2xl font-bold mt-1">
                    {selectedIssue.frequency_30min}
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs">Last Report</span>
                  </div>
                  <div className="text-lg font-semibold mt-1">
                    {formatTimeAgo(selectedIssue.latest_report_time)}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Issue Details */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">
                      {location?.name || 'Unknown'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Suggested Authority</p>
                    <p className="text-sm text-muted-foreground">
                      {authority?.name || 'Not Assigned'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">First Reported</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(selectedIssue.first_report_time)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Tag className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Priority Level</p>
                    <p className={cn("text-sm font-medium", getPriorityColor(selectedIssue.priority_score))}>
                      {getPriorityLabel(selectedIssue.priority_score)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Linked Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Linked Reports ({selectedIssue.linked_reports?.length || 0})</CardTitle>
              <CardDescription>
                Individual student reports aggregated into this issue
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedIssue.linked_reports && selectedIssue.linked_reports.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {selectedIssue.linked_reports.map((report, index) => (
                    <AccordionItem key={report.id} value={report.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 text-left">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-medium truncate max-w-[300px]">{report.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatTimeAgo(report.created_at)}
                            </p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pl-9 space-y-2">
                          <p className="text-sm text-muted-foreground">{report.description}</p>
                          <div className="flex gap-2 text-xs text-muted-foreground">
                            <span>{report.location?.name}</span>
                            <span>•</span>
                            <span>{report.category?.name}</span>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="text-sm text-muted-foreground">No linked reports available.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Actions */}
        <div className="space-y-6">
          {/* Status Update Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Update Status</CardTitle>
              <CardDescription>
                Change the issue status and add notes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">New Status</label>
                <Select value={newStatus} onValueChange={(v) => setNewStatus(v as IssueStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes (optional)</label>
                <Textarea
                  placeholder="Add any notes about this status change..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <Button 
                className="w-full" 
                onClick={handleStatusUpdate}
                disabled={!newStatus || isActionLoading}
              >
                {isActionLoading ? 'Updating...' : 'Update Status'}
              </Button>
            </CardContent>
          </Card>

          {/* Action History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Action History</CardTitle>
            </CardHeader>
            <CardContent>
              {issueActions.length > 0 ? (
                <div className="space-y-4">
                  {issueActions.map((action) => (
                    <div key={action.id} className="border-l-2 border-muted pl-4">
                      <p className="text-sm font-medium capitalize">
                        {action.action_type.replace('_', ' ')}
                      </p>
                      {action.notes && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {action.notes}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(action.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No actions yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
