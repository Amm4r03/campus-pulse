'use client'

import { useEffect, useState } from 'react'
import {
  ShieldAlert,
  RefreshCw,
  CheckCircle2,
  MessageSquareOff,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminStore, type SpamReportItem } from '@/stores'
import { cn } from '@/lib/utils'

function TableSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}

export default function AdminSpamPage() {
  const {
    spamReports,
    spamCount,
    fetchSpamReports,
    fetchSpamCount,
    markReportNotSpam,
  } = useAdminStore()

  const [loading, setLoading] = useState(false)
  const [actingId, setActingId] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetchSpamReports().finally(() => setLoading(false))
  }, [fetchSpamReports])

  const handleMarkNotSpam = async (reportId: string) => {
    setActingId(reportId)
    try {
      await markReportNotSpam(reportId)
      await fetchSpamCount()
    } finally {
      setActingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ShieldAlert className="h-7 w-7 text-muted-foreground" />
          Spam review
        </h1>
        <p className="text-muted-foreground">
          Reports classified as spam. Mark as not spam to move them back to normal issues and improve future detection.
        </p>
      </div>

      <Card className={cn('shadow-sm border-muted bg-muted/20')}>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Flagged reports</CardTitle>
              <CardDescription>
                <span className="font-medium text-muted-foreground">{spamCount}</span> report{spamCount !== 1 ? 's' : ''} currently marked as spam
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-muted-foreground border-muted-foreground/30"
              onClick={() => {
                setLoading(true)
                fetchSpamReports().finally(() => setLoading(false))
              }}
              disabled={loading}
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading && spamReports.length === 0 ? (
            <TableSkeleton />
          ) : spamReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <MessageSquareOff className="mb-4 h-12 w-12 opacity-50" />
              <p className="font-medium">No spam reports</p>
              <p className="text-sm">Flagged reports will appear here for review.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 border-muted">
                    <TableHead className="text-muted-foreground">Report & category</TableHead>
                    <TableHead className="text-muted-foreground">Location</TableHead>
                    <TableHead className="text-muted-foreground">Confidence</TableHead>
                    <TableHead className="text-muted-foreground">Date</TableHead>
                    <TableHead className="text-right text-muted-foreground">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {spamReports.map((report: SpamReportItem) => (
                    <TableRow
                      key={report.id}
                      className="border-muted/50 hover:bg-muted/30 transition-colors"
                    >
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="font-medium text-foreground/90">{report.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2 max-w-[280px]">
                            {report.description}
                          </p>
                          <Badge variant="secondary" className="text-[10px] bg-muted text-muted-foreground">
                            {report.category_name}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {report.location_name}
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-sm">
                          {Math.round((report.spam_confidence ?? 0) * 100)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                        {formatDate(report.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-foreground hover:bg-muted"
                          onClick={() => handleMarkNotSpam(report.id)}
                          disabled={actingId !== null}
                        >
                          {actingId === report.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-1.5" />
                              Mark as not spam
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
