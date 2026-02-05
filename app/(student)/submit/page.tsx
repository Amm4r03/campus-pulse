'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Send, CheckCircle2, AlertCircle, MapPin, Tag, FileText, Heading, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { issueFormSchemaSoft, type IssueFormData } from '@/types/forms'
import { useIssueStore, useAuthStore } from '@/stores'
import { toast } from 'sonner'
import { LOCATION_TYPE_LABELS } from '@/lib/data/locations'
import { CampusStatus, QuickStats } from '@/components/campus-status'
import type { LocationType } from '@/types'
import { ActiveReportsPreview } from '@/components/active-reports-preview'
import { CrisisResourcesModal } from '@/components/crisis-resources-modal'
import { SmartQuestionsModal, type SmartQuestion } from '@/components/smart-questions-modal'
import { SubmissionProgressBar } from '@/components/submission-progress-bar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { buildEnrichedDescription } from '@/lib/triage/question-generator'
import { validateReportInput } from '@/lib/validate-report'
import Link from 'next/link'

export default function SubmitIssuePage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { submitIssue, addIssueFromStream, isSubmitting, myIssues, fetchMyIssues, error: submitError, clearError } = useIssueStore()
  const [submitted, setSubmitted] = useState(false)
  const [submittedIssueId, setSubmittedIssueId] = useState<string | null>(null)
  const [showCrisisResources, setShowCrisisResources] = useState(false)
  const [submissionProgress, setSubmissionProgress] = useState<number | null>(null)
  const [showSmartQuestions, setShowSmartQuestions] = useState(false)
  const [pendingSubmission, setPendingSubmission] = useState<{
    data: IssueFormData
    questions: SmartQuestion[]
    estimatedTime: number
  } | null>(null)
  /** When set, smart questions are done but category/location (or description length) still needed before final submit. */
  const [pendingFinalStep, setPendingFinalStep] = useState<IssueFormData | null>(null)
  const [finalStepCategoryId, setFinalStepCategoryId] = useState('')
  const [finalStepLocationId, setFinalStepLocationId] = useState('')

  // Categories and locations from API (real DB IDs) – required for submission to succeed
  const [apiCategories, setApiCategories] = useState<Array<{ id: string; name: string }>>([])
  const [apiLocations, setApiLocations] = useState<Array<{ id: string; name: string; type: LocationType }>>([])
  const [optionsLoading, setOptionsLoading] = useState(true)
  const [optionsError, setOptionsError] = useState<string | null>(null)

  const form = useForm<IssueFormData>({
    resolver: zodResolver(issueFormSchemaSoft),
    defaultValues: {
      title: '',
      description: '',
      category_id: '',
      location_id: '',
    },
  })

  // Fetch categories and locations from API so form uses real DB IDs (not mock slugs)
  useEffect(() => {
    let cancelled = false
    setOptionsLoading(true)
    setOptionsError(null)
    Promise.all([
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/locations').then((r) => r.json()),
    ])
      .then(([catRes, locRes]) => {
        if (cancelled) return
        const err: string[] = []
        if (catRes.success && catRes.data) setApiCategories(catRes.data)
        else err.push(catRes.error?.message || 'Failed to load categories')
        if (locRes.success && locRes.data) setApiLocations(locRes.data)
        else err.push(locRes.error?.message || 'Failed to load locations')
        if (err.length) setOptionsError(err.join('. '))
      })
      .catch((err) => {
        if (!cancelled) setOptionsError(err?.message || 'Failed to load options')
      })
      .finally(() => {
        if (!cancelled) setOptionsLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  // Fetch user's issues for the preview section
  useEffect(() => {
    const userId = user?.id || 'student-1'
    fetchMyIssues(userId)
  }, [user?.id, fetchMyIssues])

  const submitStream = async (formData: IssueFormData) => {
    setSubmissionProgress(5)
    try {
      const res = await fetch('/api/issues/create/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) {
        let errMessage = 'Submission failed'
        try {
          const errJson = await res.json().catch(() => ({}))
          if (errJson.error?.message) errMessage = errJson.error.message
        } catch {
          // ignore
        }
        throw new Error(errMessage)
      }
      if (!res.body) {
        throw new Error('No response from server')
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          const match = line.match(/^data:\s*(.+)$/m)
          if (!match) continue
          try {
            const event = JSON.parse(match[1]) as { stage: string; progress: number; message?: string; data?: unknown }
            const p = event.progress ?? 0
            if (typeof p === 'number') setSubmissionProgress(p)
            if (event.stage === 'error') {
              const msg = event.message ?? 'Something went wrong.'
              const isSpamRejection = /spam|test|content policy/i.test(msg)
              toast.error(isSpamRejection ? 'Report not submitted' : 'Submission failed', { description: msg })
              setSubmissionProgress(null)
              return
            }
            if (event.stage === 'complete' && event.data && typeof event.data === 'object' && 'issue_id' in event.data) {
              const d = event.data as {
                issue_id: string
                aggregated_issue_id: string
                aggregation_status: string
                initial_priority: number
                urgency_level?: string
                requires_immediate_action?: boolean
              }
              addIssueFromStream(d, formData)
              setSubmittedIssueId(d.issue_id)
              setSubmitted(true)
              setSubmissionProgress(null)
              toast.success('Issue submitted', {
                description: 'Your report has been received and is being processed. You can track it in My Issues.',
              })
              const isCriticalOrImmediate =
                d.urgency_level === 'CRITICAL' ||
                d.urgency_level === 'HIGH' ||
                d.requires_immediate_action === true
              if (isCriticalOrImmediate) setShowCrisisResources(true)
              return
            }
          } catch {
            // ignore parse errors for partial chunks
          }
        }
      }
      setSubmissionProgress(null)
      toast.error('Submission failed', { description: 'No response from server' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit issue'
      toast.error('Submission failed', { description: message })
      setSubmissionProgress(null)
    }
  }

  const onSubmit = async (data: IssueFormData) => {
    clearError()
    const validation = validateReportInput(data.title, data.description)
    if (!validation.isValid) {
      toast.warning(validation.warning ?? 'Please provide more details.')
      return
    }
    setSubmissionProgress(5)
    try {
      const checkRes = await fetch('/api/issues/smart-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const checkJson = await checkRes.json()
      if (checkJson.rejected_spam) {
        setSubmissionProgress(null)
        toast.error('Report not submitted', { description: checkJson.message ?? 'This looks like a test or spam. Please describe a real campus issue.' })
        return
      }
      if (!checkRes.ok) {
        setSubmissionProgress(null)
        toast.error('Something went wrong', { description: checkJson.error?.message ?? 'Please try again.' })
        return
      }
      if (checkJson.success && checkJson.needs_questions && Array.isArray(checkJson.questions) && checkJson.questions.length > 0) {
        setSubmissionProgress(null)
        setPendingSubmission({
          data,
          questions: checkJson.questions,
          estimatedTime: checkJson.estimated_time ?? 10,
        })
        setShowSmartQuestions(true)
        return
      }
      await submitStream(data)
    } catch (error) {
      setSubmissionProgress(null)
      const message = error instanceof Error ? error.message : 'Failed to submit issue'
      toast.error('Submission failed', { description: message })
    }
  }

  const handleSmartAnswers = (answers: Record<string, string>) => {
    if (!pendingSubmission) return
    const enrichedDescription = buildEnrichedDescription(
      pendingSubmission.data.title,
      pendingSubmission.data.description,
      answers,
      pendingSubmission.questions
    )
    const enrichedData: IssueFormData = {
      ...pendingSubmission.data,
      description: enrichedDescription,
    }
    setShowSmartQuestions(false)
    setPendingSubmission(null)
    const hasCategory = !!enrichedData.category_id?.trim()
    const hasLocation = !!enrichedData.location_id?.trim()
    const hasEnoughDescription = enrichedData.description.length >= 20
    if (hasCategory && hasLocation && hasEnoughDescription) {
      submitStream(enrichedData)
    } else {
      setFinalStepCategoryId(enrichedData.category_id?.trim() ?? '')
      setFinalStepLocationId(enrichedData.location_id?.trim() ?? '')
      setPendingFinalStep(enrichedData)
    }
  }

  const handleFinalStepSubmit = (category_id: string, location_id: string) => {
    if (!pendingFinalStep) return
    const completed: IssueFormData = {
      ...pendingFinalStep,
      category_id,
      location_id,
    }
    if (completed.description.length < 20) {
      toast.warning('Please add at least 20 characters in the description, or we’ll use your title and answers.')
      completed.description = completed.description.trim() || `Issue: ${completed.title}`
      if (completed.description.length < 20) {
        toast.error('Description is still too short. Add a bit more detail above or in the next step.')
        return
      }
    }
    setPendingFinalStep(null)
    submitStream(completed)
  }

  // Group locations by type for dropdown (from API data)
  const groupedLocations = apiLocations.reduce<Record<string, typeof apiLocations>>((acc, loc) => {
    const t = loc.type
    if (!acc[t]) acc[t] = []
    acc[t].push(loc)
    return acc
  }, {})
  // Category groups by name (DB names: wifi, water, sanitation, etc.) for familiar grouping
  const CATEGORY_GROUP_ORDER: Record<string, string[]> = {
    services: ['wifi', 'food'],
    infrastructure: ['water', 'sanitation', 'electricity', 'infrastructure'],
    safety: ['safety'],
    academic: ['academics'],
    hostel: ['hostel'],
  }
  const CATEGORY_GROUP_LABELS: Record<string, string> = {
    services: 'Services',
    infrastructure: 'Infrastructure',
    safety: 'Safety & Security',
    academic: 'Academic',
    hostel: 'Hostel',
  }

  // Get active issues (not resolved)
  const activeIssues = myIssues.filter(issue => issue.status !== 'resolved')
  const resolvedCount = myIssues.filter(issue => issue.status === 'resolved').length

  if (submitted && submittedIssueId) {
    return (
      <>
        <CrisisResourcesModal open={showCrisisResources} onClose={() => setShowCrisisResources(false)} />
        <div className="mx-auto max-w-2xl">
        <Card className="border-2 border-primary/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Issue Submitted Successfully!</CardTitle>
            <CardDescription>
              Your issue has been received and will be processed shortly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">Issue ID</p>
              <p className="font-mono text-lg font-semibold">{submittedIssueId}</p>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              You can track the status of your issue in the &quot;My Issues&quot; section.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button className="flex-1" onClick={() => router.push('/issues')}>
                View My Issues
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setSubmitted(false)
                  setSubmittedIssueId(null)
                  form.reset()
                }}
              >
                Submit Another Issue
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      </>
    )
  }

  return (
    <>
      {showSmartQuestions && pendingSubmission && (
        <SmartQuestionsModal
          open={showSmartQuestions}
          onClose={() => {
            setShowSmartQuestions(false)
            setPendingSubmission(null)
          }}
          onSubmit={handleSmartAnswers}
          questions={pendingSubmission.questions}
          title={pendingSubmission.data.title}
          estimatedTime={pendingSubmission.estimatedTime}
        />
      )}
      {pendingFinalStep && (
        <Dialog open={!!pendingFinalStep} onOpenChange={(open) => !open && setPendingFinalStep(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Almost there</DialogTitle>
              <DialogDescription>
                Please select a category and location so we can route your report correctly.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Issue Category</label>
                <Select value={finalStepCategoryId} onValueChange={setFinalStepCategoryId}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select a category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_GROUP_ORDER).map(([group, names]) => {
                      const catsInGroup = apiCategories.filter((c) =>
                        names.includes(c.name.toLowerCase().trim())
                      )
                      if (catsInGroup.length === 0) return null
                      return (
                        <SelectGroup key={group}>
                          <SelectLabel>{CATEGORY_GROUP_LABELS[group]}</SelectLabel>
                          {catsInGroup.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )
                    })}
                    {apiCategories
                      .filter(
                        (c) =>
                          !Object.values(CATEGORY_GROUP_ORDER).flat().includes(c.name.toLowerCase())
                      )
                      .map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Campus Zone / Location</label>
                <Select value={finalStepLocationId} onValueChange={setFinalStepLocationId}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select location..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(groupedLocations).map(([type, locations]) => (
                      <SelectGroup key={type}>
                        <SelectLabel>{LOCATION_TYPE_LABELS[type as keyof typeof LOCATION_TYPE_LABELS]}</SelectLabel>
                        {locations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                disabled={!finalStepCategoryId || !finalStepLocationId || !!submissionProgress}
                onClick={() => handleFinalStepSubmit(finalStepCategoryId, finalStepLocationId)}
              >
                {submissionProgress !== null ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      <div className="space-y-8">
      {/* Hero Section */}
      <div>
        <h1 className="text-3xl lg:text-4xl font-black tracking-tight">Report an Issue</h1>
        <p className="text-muted-foreground mt-1">
          Something broken? Let us know so we can fix it. Help us improve Jamia Hamdard University facilities.
        </p>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column - Form */}
        <div className="flex-1 space-y-6">
          {/* Report Form Card */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                New Report Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {optionsError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Could not load form options</AlertTitle>
                  <AlertDescription>{optionsError}</AlertDescription>
                </Alert>
              )}
              {submitError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}
              {submissionProgress !== null && (
                <div className="mb-6 rounded-lg border bg-muted/30 p-4">
                  <p className="mb-3 text-sm font-medium">
                    {submissionProgress <= 15 ? 'Checking report...' : 'Submitting your report'}
                  </p>
                  <SubmissionProgressBar progress={submissionProgress} />
                </div>
              )}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Category & Location - Side by Side on larger screens */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Category - from API so IDs match database */}
                    <FormField
                      control={form.control}
                      name="category_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Issue Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={optionsLoading}>
                            <FormControl>
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder={optionsLoading ? 'Loading...' : 'Select a category...'} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(CATEGORY_GROUP_ORDER).map(([group, names]) => {
                                const catsInGroup = apiCategories.filter((c) =>
                                  names.includes(c.name.toLowerCase().trim())
                                )
                                if (catsInGroup.length === 0) return null
                                return (
                                  <SelectGroup key={group}>
                                    <SelectLabel>{CATEGORY_GROUP_LABELS[group]}</SelectLabel>
                                    {catsInGroup.map((category) => (
                                      <SelectItem key={category.id} value={category.id}>
                                        {category.name}
                                      </SelectItem>
                                    ))}
                                  </SelectGroup>
                                )
                              })}
                              {/* Uncategorized (e.g. if API returns extra) */}
                              {apiCategories
                                .filter(
                                  (c) =>
                                    !Object.values(CATEGORY_GROUP_ORDER).flat().includes(c.name.toLowerCase())
                                )
                                .map((category) => (
                                  <SelectItem key={category.id} value={category.id}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Location - from API so IDs match database */}
                    <FormField
                      control={form.control}
                      name="location_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Campus Zone / Location</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={optionsLoading}>
                            <FormControl>
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder={optionsLoading ? 'Loading...' : 'Select location...'} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(groupedLocations).map(([type, locations]) => (
                                <SelectGroup key={type}>
                                  <SelectLabel>
                                    {LOCATION_TYPE_LABELS[type as keyof typeof LOCATION_TYPE_LABELS]}
                                  </SelectLabel>
                                  {locations.map((location) => (
                                    <SelectItem key={location.id} value={location.id}>
                                      {location.name}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Title */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issue Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Water leakage in 2nd floor restroom"
                            className="h-12"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Detailed Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the issue in detail. When did it start? Is it recurring?"
                            className="min-h-[120px] resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Optional. Add detail here or answer the quick follow-up questions after you click Submit.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Submit Button */}
                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      size="lg"
                      className="min-w-[160px] shadow-lg shadow-primary/20"
                      disabled={submissionProgress !== null}
                    >
                      {submissionProgress !== null ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {submissionProgress <= 15 ? 'Checking...' : 'Submitting...'}
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Submit Report
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Active Reports Preview - Below form on mobile, hidden on large screens */}
          <div className="lg:hidden">
            <ActiveReportsPreview issues={myIssues.slice(0, 2)} />
          </div>
        </div>

        {/* Right Column - Sidebar (Desktop only) */}
        <aside className="hidden lg:flex lg:w-80 flex-col gap-6">
          {/* Campus Status - Sticky */}
          <div className="sticky top-24 space-y-6">
            <CampusStatus />
            
            {/* Quick Stats */}
            <QuickStats resolvedCount={resolvedCount} activeCount={activeIssues.length} />
          </div>
        </aside>
      </div>

      {/* Active Reports Section - Desktop */}
      <div className="hidden lg:block">
        <ActiveReportsPreview issues={myIssues} />
      </div>
    </div>
    </>
  )
}
