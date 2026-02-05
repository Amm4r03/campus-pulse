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
  Sparkles
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
import { useAdminStore } from '@/stores'
import { cn } from '@/lib/utils'
import { ISSUE_CATEGORIES, AUTHORITIES } from '@/lib/data/categories'
import { CAMPUS_LOCATIONS } from '@/lib/data/locations'
import type { IssueStatus } from '@/types'

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
    setFilters
  } = useAdminStore()

  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchAggregatedIssues()
  }, [fetchAggregatedIssues])

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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
          value={stats.resolved}
          description="Issues closed"
          icon={CheckCircle2}
          iconBg="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 dark:text-emerald-400"
          trend={{ value: '92% rate', positive: true }}
        />
        <StatCard
          title="High Volume Area"
          value="Boys Hostel"
          description="Most reported location"
          icon={TrendingUp}
          iconBg="bg-purple-50 dark:bg-purple-900/20 text-purple-500 dark:text-purple-400"
        />
      </div>

      {/* Issues Table Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Active Issues</h2>
            <p className="text-sm text-muted-foreground">
              Real-time reports requiring administrative attention.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
              {(filters.status !== 'all' || filters.category_id !== 'all') && (
                <span className="bg-muted text-muted-foreground text-[10px] px-1.5 rounded">
                  {[filters.status !== 'all', filters.category_id !== 'all'].filter(Boolean).length}
                </span>
              )}
            </Button>
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
              <h3 className="text-lg font-semibold">All Clear!</h3>
              <p className="text-sm text-muted-foreground">
                No active issues at the moment.
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
                      const category = ISSUE_CATEGORIES.find(c => c.id === issue.canonical_category_id)
                      const location = CAMPUS_LOCATIONS.find(l => l.id === issue.location_id)
                      const authority = AUTHORITIES.find(a => a.id === issue.authority_id)
                      const priority = getPriorityLabel(issue.priority_score)
                      const IconComponent = categoryIcons[issue.canonical_category_id] || Wrench

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
                                category?.is_environmental 
                                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                  : "bg-muted text-muted-foreground"
                              )}>
                                <IconComponent className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium group-hover:text-primary transition-colors">
                                  {category?.name || 'Unknown Category'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {category?.is_environmental ? 'Environmental' : 'Infrastructure'}
                                </p>
                              </div>
                            </Link>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {location?.name || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            <Badge className={priority.className}>
                              {priority.label}
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
                                {authority?.name?.charAt(0) || '?'}
                              </div>
                              <span className="text-sm">{authority?.name || 'Unassigned'}</span>
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
                                <DropdownMenuItem>Mark as Resolved</DropdownMenuItem>
                                <DropdownMenuItem>Assign Authority</DropdownMenuItem>
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
    </div>
  )
}
