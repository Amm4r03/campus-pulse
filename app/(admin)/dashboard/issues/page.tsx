'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Filter,
  MoreHorizontal,
  FileText,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Link2,
  Unlink,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminStore } from '@/stores'
import { useApiOptions } from '@/hooks/use-api-options'
import { cn } from '@/lib/utils'

interface ReportRow {
  id: string
  title: string
  description: string
  created_at: string
  category_id: string
  location_id: string
  category_name: string
  location_name: string
  aggregated_issue_id: string | null
}

function TableSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 flex-1 max-w-[200px]" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  )
}

const ITEMS_PER_PAGE = 15

export default function AdminIssuesPage() {
  const [reports, setReports] = useState<ReportRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [filterOpen, setFilterOpen] = useState(false)
  const [categoryId, setCategoryId] = useState<string>('all')
  const [locationId, setLocationId] = useState<string>('all')
  const [sort, setSort] = useState<'created_at' | 'title'>('created_at')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const { apiCategories, apiLocations } = useApiOptions()

  const fetchReports = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(currentPage))
      params.set('limit', String(ITEMS_PER_PAGE))
      params.set('sort', sort)
      params.set('order', order)
      if (categoryId && categoryId !== 'all') params.set('category_id', categoryId)
      if (locationId && locationId !== 'all') params.set('location_id', locationId)
      const res = await fetch(`/api/issues/admin/reports?${params.toString()}`)
      const data = await res.json()
      if (data.success && data.data) {
        setReports(data.data.items)
        setTotalCount(data.data.pagination?.total ?? 0)
      } else {
        setReports([])
        setTotalCount(0)
      }
    } catch {
      setReports([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, categoryId, locationId, sort, order])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    return d.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
  const activeFilterCount = [categoryId !== 'all', locationId !== 'all'].filter(Boolean).length

  const clearFilters = () => {
    setCategoryId('all')
    setLocationId('all')
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Issues</h1>
        <p className="text-muted-foreground">
          All individual student reports. Each row is one submission; aggregated groups are linked to a parent issue.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {totalCount} report{totalCount !== 1 ? 's' : ''} total
        </p>
        <div className="flex items-center gap-2">
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
                {activeFilterCount > 0 && (
                  <span className="bg-muted text-muted-foreground text-[10px] px-1.5 rounded">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="end">
              <div className="space-y-4">
                <h4 className="font-medium">Filter by</h4>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Category</label>
                  <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setCurrentPage(1); }}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {apiCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Location</label>
                  <Select value={locationId} onValueChange={(v) => { setLocationId(v); setCurrentPage(1); }}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All locations</SelectItem>
                      {apiLocations.map((l) => (
                        <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => { clearFilters(); setFilterOpen(false); }}>
                    Reset
                  </Button>
                  <Button size="sm" className="flex-1" onClick={() => setFilterOpen(false)}>
                    Done
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Select
            value={`${sort}-${order}`}
            onValueChange={(v) => {
              const [s, o] = v.split('-') as [typeof sort, typeof order]
              setSort(s)
              setOrder(o)
              setCurrentPage(1)
            }}
          >
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at-desc">Newest first</SelectItem>
              <SelectItem value="created_at-asc">Oldest first</SelectItem>
              <SelectItem value="title-asc">Title A–Z</SelectItem>
              <SelectItem value="title-desc">Title Z–A</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="shadow-sm overflow-hidden">
        {isLoading ? (
          <TableSkeleton />
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Sparkles className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No reports match your filters</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              Try adjusting filters or check back when students have submitted issues.
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Report / Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Aggregated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id} className="hover:bg-muted/30 transition-colors group">
                      <TableCell>
                        {report.aggregated_issue_id ? (
                          <Link href={`/dashboard/issues/${report.aggregated_issue_id}`} className="block">
                            <p className="font-medium group-hover:text-primary transition-colors line-clamp-1">
                              {report.title}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                              {report.description}
                            </p>
                          </Link>
                        ) : (
                          <div>
                            <p className="font-medium line-clamp-1">{report.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                              {report.description}
                            </p>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{report.category_name}</TableCell>
                      <TableCell className="text-muted-foreground">{report.location_name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                        {formatDate(report.created_at)}
                      </TableCell>
                      <TableCell>
                        {report.aggregated_issue_id ? (
                          <Link
                            href={`/dashboard/issues/${report.aggregated_issue_id}`}
                            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                          >
                            <Link2 className="h-3.5 w-3.5" />
                            View parent
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-muted-foreground text-sm">
                            <Unlink className="h-3.5 w-3.5" />
                            Standalone
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {report.aggregated_issue_id && (
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/issues/${report.aggregated_issue_id}`}>
                                  <FileText className="mr-2 h-4 w-4" />
                                  View parent issue
                                </Link>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="px-6 py-4 border-t flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Showing{' '}
                  <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)}
                  </span>{' '}
                  of <span className="font-medium">{totalCount}</span> results
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}