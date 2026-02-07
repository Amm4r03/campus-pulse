'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Phone, Building2, Heart } from 'lucide-react'

export const CRISIS_RESOURCES = {
  campus: [
    { name: 'Campus Security', phone: '+91-11-26059688', available: '24/7' },
    { name: 'Student Counselor', phone: '+91-11-26059689', available: 'Mon–Fri 9AM–5PM' },
    { name: 'Medical Center (HAHC)', phone: '+91-11-26059690', available: '24/7' },
  ],
  external: [
    { name: 'Mental Health Helpline', phone: '9152987821', available: '24/7' },
    { name: 'Women Helpline', phone: '1091', available: '24/7' },
    { name: 'Police Emergency', phone: '100', available: '24/7' },
  ],
} as const

interface CrisisResourcesModalProps {
  open: boolean
  onClose: () => void
}

export function CrisisResourcesModal({ open, onClose }: CrisisResourcesModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-destructive" />
            Resources available to you
          </DialogTitle>
          <DialogDescription>
            Your report has been flagged as urgent. While we process it, you can reach out to these resources if you need immediate help.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 pt-2">
          <section>
            <h3 className="flex items-center gap-2 font-semibold text-sm mb-2">
              <Building2 className="h-4 w-4" />
              Campus resources
            </h3>
            <ul className="space-y-3">
              {CRISIS_RESOURCES.campus.map((r) => (
                <li key={r.name} className="rounded-lg border bg-muted/50 p-3 text-sm">
                  <strong className="block">{r.name}</strong>
                  <a href={`tel:${r.phone.replace(/\D/g, '')}`} className="flex items-center gap-1.5 text-primary hover:underline mt-1">
                    <Phone className="h-3.5 w-3.5" />
                    {r.phone}
                  </a>
                  <span className="text-muted-foreground text-xs block mt-0.5">Available: {r.available}</span>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h3 className="font-semibold text-sm mb-2">24/7 external helplines</h3>
            <ul className="space-y-3">
              {CRISIS_RESOURCES.external.map((r) => (
                <li key={r.name} className="rounded-lg border bg-muted/50 p-3 text-sm">
                  <strong className="block">{r.name}</strong>
                  <a href={`tel:${r.phone.replace(/\D/g, '')}`} className="flex items-center gap-1.5 text-primary hover:underline mt-1">
                    <Phone className="h-3.5 w-3.5" />
                    {r.phone}
                  </a>
                  {r.available && <span className="text-muted-foreground text-xs block mt-0.5">{r.available}</span>}
                </li>
              ))}
            </ul>
          </section>
          <Button onClick={onClose} className="w-full">
            I&apos;ve seen these resources
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
