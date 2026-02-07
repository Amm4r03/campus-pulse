'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'

interface ResolveIssueModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  issueId: string | null
  onConfirm: (issueId: string, notes: string) => Promise<void>
}

export function ResolveIssueModal({
  open,
  onOpenChange,
  issueId,
  onConfirm,
}: ResolveIssueModalProps) {
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    if (!issueId) return
    setLoading(true)
    try {
      await onConfirm(issueId, notes.trim())
      setNotes('')
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) setNotes('')
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark as Resolved</DialogTitle>
          <DialogDescription>
            Add resolution notes (optional). These will be saved with the status change.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <Textarea
            placeholder="e.g. Fixed the leak in Block B. Plumber was assigned."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[100px] resize-none"
            disabled={loading}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Mark Resolved'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
