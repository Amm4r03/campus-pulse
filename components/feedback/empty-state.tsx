import { LucideIcon, FileText, Inbox, Search, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn('border-dashed', className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">{title}</h3>
        <p className="mb-4 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
        {action && (
          <Button onClick={action.onClick}>{action.label}</Button>
        )}
      </CardContent>
    </Card>
  )
}

export function NoIssuesFound({ onSubmit }: { onSubmit?: () => void }) {
  return (
    <EmptyState
      icon={FileText}
      title="No Issues Found"
      description="You haven't submitted any issues yet. Submit your first issue to get started."
      action={onSubmit ? { label: 'Submit an Issue', onClick: onSubmit } : undefined}
    />
  )
}

export function NoResultsFound({ onReset }: { onReset?: () => void }) {
  return (
    <EmptyState
      icon={Search}
      title="No Results"
      description="No items match your current filters. Try adjusting your search criteria."
      action={onReset ? { label: 'Reset Filters', onClick: onReset } : undefined}
    />
  )
}

export function ErrorState({ 
  title = 'Something went wrong',
  description = 'An error occurred while loading. Please try again.',
  onRetry 
}: { 
  title?: string
  description?: string
  onRetry?: () => void 
}) {
  return (
    <EmptyState
      icon={AlertCircle}
      title={title}
      description={description}
      action={onRetry ? { label: 'Try Again', onClick: onRetry } : undefined}
    />
  )
}
