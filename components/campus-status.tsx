'use client'

import { AlertTriangle, CheckCircle2, Info, ExternalLink, Wifi, Droplets, Wrench } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatusItem {
  id: string
  title: string
  description: string
  type: 'warning' | 'info' | 'resolved'
  icon?: typeof Wifi
  isLive?: boolean
}

// Mock campus status data - in production, this would come from the backend
const CAMPUS_STATUS_ITEMS: StatusItem[] = [
  {
    id: '1',
    title: 'Main Server Maintenance',
    description: 'Expected downtime: 2:00 PM - 4:00 PM today. Student portal may be inaccessible.',
    type: 'warning',
    icon: Wrench,
    isLive: true,
  },
  {
    id: '2',
    title: 'Water Supply - Hostels',
    description: 'Repair work in progress near Boys Hostel Wing B. Low pressure expected.',
    type: 'info',
    icon: Droplets,
  },
  {
    id: '3',
    title: 'WiFi Restored - Library',
    description: 'Library WiFi is now fully operational after morning maintenance.',
    type: 'resolved',
    icon: Wifi,
  },
]

const statusStyles = {
  warning: {
    container: 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20',
    dot: 'bg-amber-500',
    icon: AlertTriangle,
  },
  info: {
    container: 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20',
    dot: 'bg-blue-500',
    icon: Info,
  },
  resolved: {
    container: 'bg-muted/50 border-border',
    dot: 'bg-emerald-500',
    icon: CheckCircle2,
  },
}

interface CampusStatusProps {
  className?: string
}

export function CampusStatus({ className }: CampusStatusProps) {
  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Campus Status
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Check known issues before reporting to avoid duplicates.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {CAMPUS_STATUS_ITEMS.map((item) => {
          const style = statusStyles[item.type]
          const Icon = item.icon || style.icon

          return (
            <div
              key={item.id}
              className={cn(
                'flex gap-3 items-start p-3 rounded-lg border',
                style.container
              )}
            >
              <div className="mt-0.5">
                {item.isLive ? (
                  <span className="relative flex h-3 w-3">
                    <span className={cn(
                      "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                      style.dot
                    )} />
                    <span className={cn(
                      "relative inline-flex rounded-full h-3 w-3",
                      style.dot
                    )} />
                  </span>
                ) : item.type === 'resolved' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <span className={cn("inline-flex rounded-full h-3 w-3", style.dot)} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          )
        })}

        <div className="pt-3 border-t">
          <a
            href="#"
            className="flex items-center justify-center gap-2 text-primary text-sm font-medium hover:underline"
          >
            View System Status Page
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  )
}

interface QuickStatsProps {
  className?: string
  resolvedCount?: number
  activeCount?: number
}

export function QuickStats({ className, resolvedCount = 12, activeCount = 2 }: QuickStatsProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      <div className="bg-primary/10 rounded-xl p-4 flex flex-col items-center justify-center text-center border border-primary/10">
        <span className="text-2xl font-black text-primary">{resolvedCount}</span>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide mt-1">
          Resolved (30d)
        </span>
      </div>
      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 flex flex-col items-center justify-center text-center border border-amber-100 dark:border-amber-800/30">
        <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{activeCount}</span>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide mt-1">
          Active
        </span>
      </div>
    </div>
  )
}
