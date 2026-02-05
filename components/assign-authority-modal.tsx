'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

export interface AuthorityOption {
  id: string
  name: string
  description?: string | null
}

interface AssignAuthorityModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  issueId: string | null
  currentAuthorityName?: string
  onConfirm: (issueId: string, authorityId: string) => Promise<void>
}

export function AssignAuthorityModal({
  open,
  onOpenChange,
  issueId,
  currentAuthorityName,
  onConfirm,
}: AssignAuthorityModalProps) {
  const [authorityId, setAuthorityId] = useState('')
  const [authorities, setAuthorities] = useState<AuthorityOption[]>([])
  const [loading, setLoading] = useState(false)
  const [optionsLoading, setOptionsLoading] = useState(true)

  useEffect(() => {
    if (!open) return
    setOptionsLoading(true)
    fetch('/api/authorities')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setAuthorities(data.data)
          if (!authorityId && data.data.length > 0) setAuthorityId(data.data[0].id)
        }
      })
      .finally(() => setOptionsLoading(false))
  }, [open])

  const handleConfirm = async () => {
    if (!issueId || !authorityId) return
    setLoading(true)
    try {
      await onConfirm(issueId, authorityId)
      setAuthorityId('')
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) setAuthorityId('')
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Authority</DialogTitle>
          <DialogDescription>
            Route this issue to the responsible department.
            {currentAuthorityName && (
              <span className="block mt-1 text-muted-foreground">
                Current: {currentAuthorityName}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <Select
            value={authorityId}
            onValueChange={setAuthorityId}
            disabled={optionsLoading || loading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={optionsLoading ? 'Loading...' : 'Select authority'} />
            </SelectTrigger>
            <SelectContent>
              {authorities.map((auth) => (
                <SelectItem key={auth.id} value={auth.id}>
                  {auth.name}
                  {auth.description ? ` — ${auth.description}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!authorityId || optionsLoading || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              'Assign'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
