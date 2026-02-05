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
  Building2,
  Brain,
  Megaphone,
  Copy,
  Bell
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAdminStore } from '@/stores'
import { ISSUE_CATEGORIES, AUTHORITIES } from '@/lib/data/categories'
import { CAMPUS_LOCATIONS } from '@/lib/data/locations'
import { cn } from '@/lib/utils'
import type { IssueStatus } from '@/types'

const statusConfig: Record<IssueStatus, { label: string; className: string }> = {
  open: { label: 'Open', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  in_progress: { label: 'Investigating', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  resolved: { label: 'Resolved', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
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
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
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

function getPriorityBorderColor(score: number): string {
  if (score >= 80) return 'border-red-500/30'
  if (score >= 60) return 'border-orange-500/30'
  if (score >= 40) return 'border-yellow-500/30'
  return 'border-emerald-500/30'
}

function getPriorityStrokeColor(score: number): string {
  if (score >= 80) return 'stroke-red-500'
  if (score >= 60) return 'stroke-orange-500'
  if (score >= 40) return 'stroke-yellow-500'
  return 'stroke-emerald-500'
}

// Circular Progress Component
function CircularProgress({ value, size = 64 }: { value: number; size?: number }) {
  const strokeWidth = 4
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference

  return (
    <div className={cn("relative flex items-center justify-center", `w-${size/4} h-${size/4}`)} style={{ width: size, height: size }}>
      <svg className="absolute transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={getPriorityStrokeColor(value)}
        />
      </svg>
      <AlertCircle className={cn("h-5 w-5", getPriorityColor(value))} />
    </div>
  )
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
  const [overridePriority, setOverridePriority] = useState<'low' | 'medium' | 'high' | null>(null)
  const [overrideReason, setOverrideReason] = useState('')
  const [sendNotification, setSendNotification] = useState(true)

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
    if (diffInHours < 24) return `${diffInHours} hours ago`
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

      {/* Issue Header Card */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Badge className={cn(
                  "text-xs font-bold uppercase tracking-wide",
                  selectedIssue.priority_score >= 80 
                    ? "bg-red-500/10 text-red-600 border border-red-500/20"
                    : selectedIssue.priority_score >= 60
                    ? "bg-orange-500/10 text-orange-600 border border-orange-500/20"
                    : "bg-yellow-500/10 text-yellow-600 border border-yellow-500/20"
                )}>
                  {getPriorityLabel(selectedIssue.priority_score)}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Reported {formatTimeAgo(selectedIssue.first_report_time)}
                </span>
              </div>
              <h1 className="text-2xl font-bold">
                {category?.name} Issue at {location?.name}
              </h1>
              <p className="text-muted-foreground mt-1">
                Multiple reports of issues affecting this area.
              </p>
              
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-4">
                <Badge variant="secondary">{category?.is_environmental ? 'Environmental' : 'Infrastructure'}</Badge>
                <Badge variant="outline">{location?.name}</Badge>
                {selectedIssue.total_reports > 10 && (
                  <Badge variant="outline" className="text-red-600">High Volume</Badge>
                )}
              </div>
            </div>

            {/* Priority Score */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-muted-foreground font-medium uppercase">Priority Score</div>
                <div className="text-3xl font-bold">
                  {selectedIssue.priority_score}
                  <span className="text-lg text-muted-foreground font-normal">/100</span>
                </div>
              </div>
              <CircularProgress value={selectedIssue.priority_score} size={64} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Priority Analysis */}
          <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-blue-800 dark:text-blue-300">
                <Brain className="h-4 w-4" />
                AI Priority Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-background p-3 rounded-lg border border-blue-100 dark:border-border shadow-sm">
                  <div className="text-xs text-muted-foreground mb-1">Volume Spike</div>
                  <div className="font-semibold text-sm">{selectedIssue.total_reports} reports in {formatTimeAgo(selectedIssue.first_report_time).replace(' ago', '')}</div>
                  <div className="w-full bg-muted h-1.5 rounded-full mt-2">
                    <div 
                      className="bg-red-500 h-1.5 rounded-full" 
                      style={{ width: `${Math.min(selectedIssue.total_reports * 5, 100)}%` }} 
                    />
                  </div>
                </div>
                <div className="bg-background p-3 rounded-lg border border-blue-100 dark:border-border shadow-sm">
                  <div className="text-xs text-muted-foreground mb-1">Frequency Score</div>
                  <div className="font-semibold text-sm">{selectedIssue.frequency_30min} reports in 30 min</div>
                  <div className="w-full bg-muted h-1.5 rounded-full mt-2">
                    <div 
                      className="bg-amber-500 h-1.5 rounded-full" 
                      style={{ width: `${Math.min(selectedIssue.frequency_30min * 10, 100)}%` }} 
                    />
                  </div>
                </div>
                <div className="bg-background p-3 rounded-lg border border-blue-100 dark:border-border shadow-sm">
                  <div className="text-xs text-muted-foreground mb-1">Location Density</div>
                  <div className="font-semibold text-sm">Concentrated: {location?.name}</div>
                  <div className="w-full bg-muted h-1.5 rounded-full mt-2">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '60%' }} />
                  </div>
                </div>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-3 leading-relaxed">
                <span className="font-semibold">Reasoning:</span> The rapid influx of reports combined with the environmental nature of this issue triggered a &quot;{getPriorityLabel(selectedIssue.priority_score)}&quot; classification. Pattern matching suggests concentrated impact in {location?.name}.
              </p>
            </CardContent>
          </Card>

          {/* Linked Reports */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Linked Student Reports ({selectedIssue.linked_reports?.length || 0})</CardTitle>
                <CardDescription>Individual reports aggregated into this issue</CardDescription>
              </div>
              <Button variant="link" size="sm" className="text-primary">
                View All
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {selectedIssue.linked_reports && selectedIssue.linked_reports.length > 0 ? (
                <div className="divide-y">
                  {selectedIssue.linked_reports.slice(0, 5).map((report, index) => (
                    <div 
                      key={report.id} 
                      className="p-4 hover:bg-muted/30 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-start gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-muted text-xs font-bold">
                            {report.title.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium truncate">
                              Anonymous Student
                              <span className="text-muted-foreground font-normal ml-2">
                                ID: {report.id.slice(0, 8)}
                              </span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatTimeAgo(report.created_at)}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {report.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">No linked reports available.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Right Column */}
        <div className="space-y-6">
          {/* Admin Actions Card */}
          <Card className="shadow-lg sticky top-24">
            <CardHeader className="bg-muted/50 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4 text-primary" />
                Admin Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-6">
              {/* Current Status */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Current Status
                </label>
                <Select value={newStatus || selectedIssue.status} onValueChange={(v) => setNewStatus(v as IssueStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open (Unassigned)</SelectItem>
                    <SelectItem value="in_progress">Investigating</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Assign Authority */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Assign Authority
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    className="pl-10" 
                    value={authority?.name || ''} 
                    placeholder="Select authority..."
                    readOnly
                  />
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="absolute right-1 top-1 h-7"
                  >
                    Change
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Override Priority */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Override Priority
                  </label>
                  <span className="text-xs text-muted-foreground">
                    Current: {getPriorityLabel(selectedIssue.priority_score)}
                  </span>
                </div>
                <div className="flex gap-2 mb-3">
                  {(['low', 'medium', 'high'] as const).map((level) => (
                    <Button
                      key={level}
                      variant={overridePriority === level ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        "flex-1 capitalize",
                        overridePriority === level && level === 'high' && "bg-red-500 hover:bg-red-600"
                      )}
                      onClick={() => setOverridePriority(overridePriority === level ? null : level)}
                    >
                      {level}
                    </Button>
                  ))}
                </div>
                <Textarea 
                  placeholder="Reason for override..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="resize-none h-20"
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button variant="outline" className="gap-2">
                  <Copy className="h-4 w-4" />
                  Mark Duplicate
                </Button>
                <Button 
                  className="shadow-md"
                  onClick={handleStatusUpdate}
                  disabled={isActionLoading}
                >
                  {isActionLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Broadcast Update Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm">
                Broadcast Update
                <Megaphone className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Notify all {selectedIssue.total_reports} reporting students of status change.
              </p>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox 
                  checked={sendNotification}
                  onCheckedChange={(checked) => setSendNotification(!!checked)}
                />
                Send push notification
              </label>
              <Button variant="secondary" className="w-full">
                Compose Message
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
