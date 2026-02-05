'use client'

import { useState } from 'react'
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
  Tag,
  Loader2,
  XCircle,
  Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useIssueStore } from '@/stores'
import { cn } from '@/lib/utils'
import type { IssueStatus, IssueReport } from '@/types'

const statusConfig: Record<IssueStatus, { 
  label: string
  icon: typeof Clock
  className: string
  bgClassName: string
  description: string
  progress: number
}> = {
  open: { 
    label: 'Pending Review', 
    icon: AlertCircle, 
    className: 'text-red-600 dark:text-red-400',
    bgClassName: 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    description: 'Your issue has been submitted and is waiting for review by administration.',
    progress: 25
  },
  in_progress: { 
    label: 'Being Addressed', 
    icon: Clock, 
    className: 'text-amber-600 dark:text-amber-400',
    bgClassName: 'bg-amber-100 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    description: 'Administration is actively working on resolving this issue.',
    progress: 60
  },
  resolved: { 
    label: 'Resolved', 
    icon: CheckCircle2, 
    className: 'text-emerald-600 dark:text-emerald-400',
    bgClassName: 'bg-emerald-100 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
    description: 'This issue has been resolved. Thank you for your report!',
    progress: 100
  },
}

function IssueStatusDisplay({ issue }: { issue: IssueReport }) {
  const status = statusConfig[issue.status]
  const StatusIcon = status.icon

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card className={cn("border-2", status.bgClassName)}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full",
              status.bgClassName
            )}>
              <StatusIcon className={cn("h-6 w-6", status.className)} />
            </div>
            <div className="flex-1">
              <h3 className={cn("text-lg font-semibold", status.className)}>
                {status.label}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {status.description}
              </p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{status.progress}%</span>
            </div>
            <Progress value={status.progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Issue Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Issue Details</CardTitle>
          <CardDescription>Information about your reported issue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Ticket ID */}
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">Ticket ID</span>
            <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
              {issue.id}
            </code>
          </div>
          
          {/* Title */}
          <div className="py-2 border-b">
            <span className="text-sm text-muted-foreground block mb-1">Title</span>
            <p className="font-medium">{issue.title}</p>
          </div>
          
          {/* Description */}
          <div className="py-2 border-b">
            <span className="text-sm text-muted-foreground block mb-1">Description</span>
            <p className="text-sm">{issue.description}</p>
          </div>
          
          {/* Meta Info Grid */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <span className="text-xs text-muted-foreground block">Location</span>
                <span className="text-sm font-medium">{issue.location?.name || 'Unknown'}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <div>
                <span className="text-xs text-muted-foreground block">Category</span>
                <span className="text-sm font-medium">{issue.category?.name || 'Unknown'}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <span className="text-xs text-muted-foreground block">Submitted</span>
                <span className="text-sm font-medium">{formatDate(issue.created_at)}</span>
              </div>
            </div>
            
            {issue.aggregation_status === 'aggregated' && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-xs text-muted-foreground block">Status</span>
                  <span className="text-sm font-medium text-primary">Grouped with similar reports</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Priority Score if available */}
          {issue.priority_score !== undefined && (
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Priority Score</span>
                <Badge variant={issue.priority_score >= 75 ? 'destructive' : issue.priority_score >= 50 ? 'default' : 'secondary'}>
                  {issue.priority_score}/100
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" asChild>
          <Link href="/issues">
            <FileText className="mr-2 h-4 w-4" />
            View All My Issues
          </Link>
        </Button>
        <Button className="flex-1" asChild>
          <Link href="/submit">
            Submit New Issue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

export default function TrackIssuePage() {
  const { lookupIssueById, submittedIssues } = useIssueStore()
  const [ticketId, setTicketId] = useState('')
  const [foundIssue, setFoundIssue] = useState<IssueReport | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!ticketId.trim()) {
      setSearchError('Please enter a ticket ID')
      return
    }
    
    setIsSearching(true)
    setSearchError(null)
    setHasSearched(true)
    
    try {
      const issue = await lookupIssueById(ticketId.trim())
      setFoundIssue(issue)
      
      if (!issue) {
        setSearchError('No issue found with this ticket ID. Please check the ID and try again.')
      }
    } catch (error) {
      setSearchError('An error occurred while searching. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleClear = () => {
    setTicketId('')
    setFoundIssue(null)
    setSearchError(null)
    setHasSearched(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Track Your Issue</h1>
        <p className="text-muted-foreground mt-1">
          Enter your ticket ID to check the status of your reported issue
        </p>
      </div>

      {/* Search Form */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Enter ticket ID (e.g., report-1234567890)"
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
                className="pl-10 pr-10 h-12 text-base"
              />
              {ticketId && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={handleClear}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <Button type="submit" className="w-full h-11" disabled={isSearching}>
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Track Issue
                </>
              )}
            </Button>
          </form>

          {/* Recent Tickets Quick Access */}
          {submittedIssues.length > 0 && !hasSearched && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-muted-foreground mb-3">Recent tickets:</p>
              <div className="space-y-2">
                {submittedIssues.slice(0, 3).map(issue => (
                  <button
                    key={issue.id}
                    onClick={() => {
                      setTicketId(issue.id)
                      setFoundIssue(issue)
                      setHasSearched(true)
                    }}
                    className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{issue.title}</p>
                        <p className="text-xs text-muted-foreground">
                          <code>{issue.id}</code>
                        </p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cn("ml-2 shrink-0", statusConfig[issue.status].className)}
                      >
                        {statusConfig[issue.status].label}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Message */}
      {searchError && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>{searchError}</AlertDescription>
        </Alert>
      )}

      {/* Found Issue Display */}
      {foundIssue && <IssueStatusDisplay issue={foundIssue} />}

      {/* No Issues Yet */}
      {hasSearched && !foundIssue && !searchError && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Issue Not Found</h3>
            <p className="mb-4 text-center text-sm text-muted-foreground max-w-sm">
              We couldn't find an issue with that ticket ID. Make sure you've entered the correct ID.
            </p>
            <Button asChild>
              <Link href="/submit">Submit a New Issue</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
