'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ChevronRight, ChevronLeft, Zap, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export interface SmartQuestion {
  id: string
  text: string
  type: 'select' | 'multi_select' | 'text' | 'yes_no'
  suggestions: string[]
  required: boolean
  context?: string
  icon?: string
  placeholder?: string
}

interface SmartQuestionsModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (answers: Record<string, string>) => void
  questions: SmartQuestion[]
  title: string
  estimatedTime: number
}

export function SmartQuestionsModal({
  open,
  onClose,
  onSubmit,
  questions,
  title,
  estimatedTime,
}: SmartQuestionsModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [customText, setCustomText] = useState<Record<string, string>>({})

  const currentQ = questions[currentIndex]
  const progress = questions.length ? ((currentIndex + 1) / questions.length) * 100 : 0

  const handleSelect = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleNext = () => {
    if (!currentQ) return
    const value = answers[currentQ.id] ?? customText[currentQ.id] ?? ''
    if (currentQ.required && !value.trim()) {
      toast.error('Please answer this question')
      return
    }
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1)
    } else {
      const all: Record<string, string> = { ...answers }
      for (const q of questions) {
        const custom = customText[q.id]?.trim()
        if (custom) all[q.id] = custom
      }
      onSubmit(all)
      onClose()
    }
  }

  const handleBack = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1)
  }

  const handleClose = () => {
    setCurrentIndex(0)
    setAnswers({})
    setCustomText({})
    onClose()
  }

  if (!open || questions.length === 0) return null

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Quick follow-up
            </DialogTitle>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              ~{estimatedTime}s
            </span>
          </div>
          <DialogDescription>
            Help us understand: <strong>&quot;{title}&quot;</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          <div>
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {currentQ && (
            <div className="space-y-4">
              {currentQ.context && (
                <p className="rounded-md bg-muted px-2 py-1.5 text-xs text-muted-foreground">
                  {currentQ.context}
                </p>
              )}
              <h3 className="font-medium leading-tight">
                {currentQ.icon && <span className="mr-1">{currentQ.icon}</span>}
                {currentQ.text}
              </h3>

              {(currentQ.type === 'select' || currentQ.type === 'yes_no') && (
                <RadioGroup
                  value={answers[currentQ.id] ?? ''}
                  onValueChange={(v) => handleSelect(currentQ.id, v)}
                  className="grid gap-2"
                >
                  {currentQ.suggestions.map((opt) => (
                    <div
                      key={opt}
                      className={cn(
                        'flex items-center gap-3 rounded-lg border p-3 transition-colors',
                        answers[currentQ.id] === opt ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      )}
                    >
                      <RadioGroupItem value={opt} id={`${currentQ.id}-${opt}`} />
                      <Label htmlFor={`${currentQ.id}-${opt}`} className="flex-1 cursor-pointer">
                        {opt}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {currentQ.type === 'text' && (
                <Input
                  placeholder={currentQ.placeholder ?? 'Type your answer...'}
                  value={customText[currentQ.id] ?? ''}
                  onChange={(e) =>
                    setCustomText((prev) => ({ ...prev, [currentQ.id]: e.target.value }))
                  }
                  className="h-11"
                />
              )}

              {(currentQ.type === 'select' || currentQ.type === 'yes_no') && (
                <div className="pt-1">
                  <Input
                    placeholder="Or type your own answer..."
                    value={customText[currentQ.id] ?? ''}
                    onChange={(e) =>
                      setCustomText((prev) => ({ ...prev, [currentQ.id]: e.target.value }))
                    }
                    className="h-9 text-sm"
                  />
                  {customText[currentQ.id] && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Using: {customText[currentQ.id]}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between border-t pt-4">
            <Button variant="ghost" onClick={handleBack} disabled={currentIndex === 0}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
            <Button onClick={handleNext}>
              {currentIndex === questions.length - 1 ? 'Submit' : 'Next'}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
