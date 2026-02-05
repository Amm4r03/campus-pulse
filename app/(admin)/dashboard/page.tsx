'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  TrendingUp,
  Filter,
  MoreHorizontal,
  Users,
  Zap,
  ChevronLeft,
  ChevronRight,
  Wifi,
  Droplets,
  Wrench,
  Trash2,
  Sparkles,
  AlertTriangle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useAdminStore } from '@/stores'
import { cn } from '@/lib/utils'
import type { IssueStatus } from '@/types'
import { ResolveIssueModal } from '@/components/resolve-issue-modal'
import { AssignAuthorityModal } from '@/components/assign-authority-modal'

const statusConfig: Record<IssueStatus, { label: string; className: string }> = {
  open: { label: 'Open', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  resolved: { label: 'Resolved', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
}

const categoryIcons: Record<string, typeof Wifi> = {
  wifi: Wifi,
  water: Droplets,
  electricity: Zap,
  sanitation: Trash2,
  hostel: Wrench,
  academics: Wrench,
  safety: AlertCircle,
  food: Droplets,
  infrastructure: Wrench,
}

function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon,
  iconBg,
  trend 
}: { 
  title: string
  value: number | string
  description: string
  icon: typeof TrendingUp
  iconBg: string
  trend?: { value: string; positive?: boolean }
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className={cn("p-2 rounded-lg", iconBg)}>
            <Icon className="h-5 w-5" />
          </div>
          {trend && (
            <span className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full",
              trend.positive 
                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
            )}>
              {trend.value}
            </span>
          )}
        </div>
        <h3 className="text-2xl font-bold mt-2">{value}</h3>
        <p className="text-xs text-muted-foreground font-medium">{description}</p>
      </CardContent>
    </Card>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  )
}

function getPriorityLabel(score: number): { label: string; className: string } {
  if (score >= 80) return { label: 'High Priority', className: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' }
  if (score >= 50) return { label: 'Medium Priority', className: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' }
  return { label: 'Low Priority', className: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' }
}

const ITEMS_PER_PAGE = 5

export default function AdminDashboardPage() {
  const { 
    aggregatedIssues, 
    stats, 
    filters, 
    isLoading, 
    fetchAggregatedIssues,
    setFilters,
    resetFilters,
    updateIssueStatus,
    updateIssueAuthority,
    mostReportedLocation,
    resolvedTodayCount,
    fetchResolvedStats,
  } = useAdminStore()

  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [filterOpen, setFilterOpen] = useState(false)
  const [resolveModalIssueId, setResolveModalIssueId] = useState<string | null>(null)
  const [assignModalIssueId, setAssignModalIssueId] = useState<string | null>(null)
  /** 'active' = open + in_progress, 'resolved' = recently resolved tab */
  const [issuesTab, setIssuesTab] = useState<'active' | 'resolved'>('active')
  // Options for filter dropdowns (from API so IDs match DB)
  const [apiCategories, setApiCategories] = useState<Array<{ id: string; name: string }>>([])
  const [apiLocations, setApiLocations] = useState<Array<{ id: string; name: string }>>([])

  // Fetch issues for current tab (active = open+in_progress, resolved = resolved); counts from DB
  useEffect(() => {
    const status = issuesTab === 'active' ? 'open,in_progress' : 'resolved'
    fetchAggregatedIssues({ status })
  }, [fetchAggregatedIssues, issuesTab])

  useEffect(() => {
    fetchResolvedStats()
  }, [fetchResolvedStats])

  // Load categories and locations for filter dropdowns
  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/locations').then((r) => r.json()),
    ]).then(([catRes, locRes]) => {
      if (catRes.success && catRes.data) setApiCategories(catRes.data)
      if (locRes.success && locRes.data) setApiLocations(locRes.data)
    })
  }, [])

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 5) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  // Pagination
  const totalPages = Math.ceil(aggregatedIssues.length / ITEMS_PER_PAGE)
  const paginatedIssues = aggregatedIssues.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(paginatedIssues.map(i => i.id)))
    } else {
      setSelectedRows(new Set())
    }
  }

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRows)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedRows(newSelected)
  }

  const allSelected = paginatedIssues.length > 0 && paginatedIssues.every(i => selectedRows.has(i.id))

  // Single-report safety: issues requiring immediate human review (priority 95–100)
  const immediateReviewIssues = aggregatedIssues.filter((i) => (i.priority_score ?? 0) >= 90)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Issue Overview</h1>
        <p className="text-muted-foreground">
          Real-time campus issue monitoring and management.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Critical Issues"
          value={stats.highPriority}
          description="Requiring immediate attention"
          icon={AlertCircle}
          iconBg="bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400"
          trend={{ value: '+4 this hour', positive: false }}
        />
        <StatCard
          title="Pending Triage"
          value={stats.open}
          description="Awaiting review"
          icon={Clock}
          iconBg="bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400"
        />
        <StatCard
          title="Resolved Today"
          value={resolvedTodayCount}
          description="Issues closed (from database)"
          icon={CheckCircle2}
          iconBg="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 dark:text-emerald-400"
        />
        <StatCard
          title="High Volume Area"
          value={mostReportedLocation ?? 'Loading...'}
          description="Most reported location"
          icon={TrendingUp}
          iconBg="bg-purple-50 dark:bg-purple-900/20 text-purple-500 dark:text-purple-400"
        />
      </div>

      {/* Immediate Review – single-report safety (priority ≥ 90), only on Active tab */}
      {issuesTab === 'active' && immediateReviewIssues.length > 0 && (
        <Card className="shadow-sm border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              Immediate Review
            </CardTitle>
            <CardDescription>
              These issues were flagged for immediate human review (e.g. safety or single serious reports).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {immediateReviewIssues.slice(0, 10).map((issue) => {
                const categoryName = issue.category?.name ?? 'Unknown'
                const locationName = issue.location?.name ?? 'Unknown'
                return (
                  <li key={issue.id}>
                    <Link
                      href={`/dashboard/issues/${issue.id}`}
                      className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm hover:bg-muted/50"
                    >
                      <span className="font-medium">{categoryName}</span>
                      <span className="text-muted-foreground">{locationName}</span>
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                        {issue.priority_score ?? 0}/100
                      </Badge>
                    </Link>
                  </li>
                )
              })}
            </ul>
            {immediateReviewIssues.length > 10 && (
              <p className="text-xs text-muted-foreground mt-2">
                +{immediateReviewIssues.length - 10} more in the table below
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Issues Table Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border bg-muted/30 p-0.5">
              <button
                type="button"
                onClick={() => { setIssuesTab('active'); setCurrentPage(1); }}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  issuesTab === 'active'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Active Issues
              </button>
              <button
                type="button"
                onClick={() => { setIssuesTab('resolved'); setCurrentPage(1); }}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  issuesTab === 'resolved'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Recently Resolved
              </button>
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                {issuesTab === 'active' ? 'Active Issues' : 'Recently Resolved'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {issuesTab === 'active'
                  ? 'Open and in-progress reports requiring attention.'
                  : 'Issues closed (kept for analytics).'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {issuesTab === 'active' && (
            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filter
                  {(filters.status !== 'all' || filters.category_name !== 'all' || filters.location_name !== 'all') && (
                    <span className="bg-muted text-muted-foreground text-[10px] px-1.5 rounded">
                      {[filters.status !== 'all', filters.category_name !== 'all', filters.location_name !== 'all'].filter(Boolean).length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72" align="end">
                <div className="space-y-4">
                  <h4 className="font-medium">Filter results</h4>
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Status</label>
                    <Select
                      value={filters.status}
                      onValueChange={(v) => setFilters({ status: v as IssueStatus | 'all' })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Category</label>
                    <Select
                      value={filters.category_name}
                      onValueChange={(v) => setFilters({ category_name: v })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All categories</SelectItem>
                        {apiCategories.map((c) => (
                          <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Location</label>
                    <Select
                      value={filters.location_name}
                      onValueChange={(v) => setFilters({ location_name: v })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="All locations" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All locations</SelectItem>
                        {apiLocations.map((l) => (
                          <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => { resetFilters(); setFilterOpen(false); }}>
                      Reset
                    </Button>
                    <Button size="sm" className="flex-1" onClick={() => setFilterOpen(false)}>
                      Done
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            )}
            <Select
              value={filters.sort_by}
              onValueChange={(value) => setFilters({ sort_by: value as 'priority' | 'date' | 'frequency' })}
            >
              <SelectTrigger className="w-[120px] h-9">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="frequency">Frequency</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table Card */}
        <Card className="shadow-sm overflow-hidden">
          {isLoading ? (
            <TableSkeleton />
          ) : aggregatedIssues.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Sparkles className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold">
                {issuesTab === 'active' ? 'All Clear!' : 'No resolved issues'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {issuesTab === 'active'
                  ? 'No active issues at the moment.'
                  : 'Resolved issues will appear here for analytics.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-10">
                        <Checkbox 
                          checked={allSelected}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Issue & Category</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Volume</TableHead>
                      <TableHead>Suggested Authority</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedIssues.map((issue) => {
                      const categoryName = issue.category?.name ?? 'Unknown Category'
                      const locationName = issue.location?.name ?? 'Unknown'
                      const authorityName = issue.authority?.name ?? 'Unassigned'
                      const isEnvironmental = !!(issue.category && 'is_environmental' in issue.category && issue.category.is_environmental)
                      const priority = getPriorityLabel(issue.priority_score)
                      const IconComponent = categoryIcons[categoryName] || Wrench

                      return (
                        <TableRow 
                          key={issue.id}
                          className="hover:bg-muted/30 transition-colors group"
                        >
                          <TableCell>
                            <Checkbox 
                              checked={selectedRows.has(issue.id)}
                              onCheckedChange={(checked) => handleSelectRow(issue.id, !!checked)}
                            />
                          </TableCell>
                          <TableCell>
                            <Link href={`/dashboard/issues/${issue.id}`} className="flex items-center gap-3">
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center",
                                isEnvironmental 
                                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                  : "bg-muted text-muted-foreground"
                              )}>
                                <IconComponent className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium group-hover:text-primary transition-colors">
                                  {categoryName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {isEnvironmental ? 'Environmental' : 'Infrastructure'}
                                </p>
                              </div>
                            </Link>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {locationName}
                          </TableCell>
                          <TableCell>
                            <Badge className={priority.className}>
                              {priority.label} ({Math.round(issue.priority_score ?? 0)}/100)
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{issue.total_reports} reports</span>
                              {issue.frequency_30min > 0 ? (
                                <span className="text-[10px] text-red-500 dark:text-red-400 font-medium flex items-center gap-0.5">
                                  <TrendingUp className="h-2.5 w-2.5" />
                                  {issue.frequency_30min} in 30m
                                </span>
                              ) : (
                                <span className="text-[10px] text-muted-foreground">
                                  Last {formatTimeAgo(issue.latest_report_time)}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium">
                                {authorityName.charAt(0)}
                              </div>
                              <span className="text-sm">{authorityName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/dashboard/issues/${issue.id}`}>
                                    View Details
                                  </Link>
                                </DropdownMenuItem>
                                {issuesTab === 'active' && (
                                  <DropdownMenuItem onClick={() => setResolveModalIssueId(issue.id)}>
                                    Mark as Resolved
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => setAssignModalIssueId(issue.id)}>
                                  Assign Authority
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, aggregatedIssues.length)}</span> of{' '}
                  <span className="font-medium">{aggregatedIssues.length}</span> results
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>

      <ResolveIssueModal
        open={resolveModalIssueId !== null}
        onOpenChange={(open) => !open && setResolveModalIssueId(null)}
        issueId={resolveModalIssueId}
        onConfirm={async (issueId, notes) => {
          await updateIssueStatus(issueId, 'resolved', notes)
          fetchResolvedStats()
        }}
      />
      <AssignAuthorityModal
        open={assignModalIssueId !== null}
        onOpenChange={(open) => !open && setAssignModalIssueId(null)}
        issueId={assignModalIssueId}
        currentAuthorityName={assignModalIssueId ? aggregatedIssues.find((i) => i.id === assignModalIssueId)?.authority?.name : undefined}
        onConfirm={async (issueId, authorityId) => {
          await updateIssueAuthority(issueId, authorityId)
        }}
      />
    </div>
  )
}
