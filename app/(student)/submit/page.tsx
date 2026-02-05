'use client'

import { useState, useEffect, useReducer } from 'react'
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
import type { Resolver } from 'react-hook-form'
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
import { useApiOptions } from '@/hooks/use-api-options'

// --- Submission flow state (useReducer for predictable transitions) ---
type SubmitFlowState = {
  submitted: boolean
  submittedIssueId: string | null
  showCrisisResources: boolean
  submissionProgress: number | null
  showSmartQuestions: boolean
  pendingSubmission: { data: IssueFormData; questions: SmartQuestion[]; estimatedTime: number } | null
  pendingFinalStep: IssueFormData | null
  finalStepCategoryId: string
  finalStepLocationId: string
}

type SubmitFlowAction =
  | { type: 'SUBMIT_PROGRESS'; progress: number | null }
  | { type: 'SUBMIT_SUCCESS'; issueId: string; showCrisis: boolean }
  | { type: 'SUBMIT_ERROR' }
  | { type: 'SHOW_SMART_QUESTIONS'; payload: { data: IssueFormData; questions: SmartQuestion[]; estimatedTime: number } }
  | { type: 'CLOSE_SMART_QUESTIONS' }
  | { type: 'SMART_ANSWERS_DONE'; enrichedData: IssueFormData; needsFinalStep: boolean; categoryId?: string; locationId?: string }
  | { type: 'SET_FINAL_STEP_IDS'; categoryId: string; locationId: string }
  | { type: 'FINAL_STEP_SUBMIT' }
  | { type: 'CLOSE_FINAL_STEP' }
  | { type: 'RESET_SUBMISSION' }
  | { type: 'CLOSE_CRISIS' }

const initialSubmitFlow: SubmitFlowState = {
  submitted: false,
  submittedIssueId: null,
  showCrisisResources: false,
  submissionProgress: null,
  showSmartQuestions: false,
  pendingSubmission: null,
  pendingFinalStep: null,
  finalStepCategoryId: '',
  finalStepLocationId: '',
}

function submitFlowReducer(state: SubmitFlowState, action: SubmitFlowAction): SubmitFlowState {
  switch (action.type) {
    case 'SUBMIT_PROGRESS':
      return { ...state, submissionProgress: action.progress }
    case 'SUBMIT_SUCCESS':
      return {
        ...state,
        submitted: true,
        submittedIssueId: action.issueId,
        submissionProgress: null,
        showCrisisResources: action.showCrisis,
      }
    case 'SUBMIT_ERROR':
      return { ...state, submissionProgress: null }
    case 'SHOW_SMART_QUESTIONS':
      return {
        ...state,
        submissionProgress: null,
        showSmartQuestions: true,
        pendingSubmission: action.payload,
      }
    case 'CLOSE_SMART_QUESTIONS':
      return { ...state, showSmartQuestions: false, pendingSubmission: null }
    case 'SMART_ANSWERS_DONE':
      return {
        ...state,
        showSmartQuestions: false,
        pendingSubmission: null,
        pendingFinalStep: action.needsFinalStep ? action.enrichedData : null,
        finalStepCategoryId: action.categoryId ?? '',
        finalStepLocationId: action.locationId ?? '',
      }
    case 'SET_FINAL_STEP_IDS':
      return { ...state, finalStepCategoryId: action.categoryId, finalStepLocationId: action.locationId }
    case 'FINAL_STEP_SUBMIT':
      return { ...state, pendingFinalStep: null }
    case 'CLOSE_FINAL_STEP':
      return { ...state, pendingFinalStep: null }
    case 'RESET_SUBMISSION':
      return { ...initialSubmitFlow }
    case 'CLOSE_CRISIS':
      return { ...state, showCrisisResources: false }
    default:
      return state
  }
}

export default function SubmitIssuePage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { addIssueFromStream, myIssues, fetchMyIssues, error: submitError, clearError } = useIssueStore()
  const [submitFlow, dispatch] = useReducer(submitFlowReducer, initialSubmitFlow)
  const { apiCategories, apiLocations, optionsLoading, optionsError } = useApiOptions()

  const form = useForm<IssueFormData>({
    resolver: zodResolver(issueFormSchemaSoft) as Resolver<IssueFormData>,
    defaultValues: {
      title: '',
      description: '',
      category_id: '',
      location_id: '',
    },
  })

  // Fetch user's issues for the preview section
  useEffect(() => {
    const userId = user?.id || 'student-1'
    fetchMyIssues(userId)
  }, [user?.id, fetchMyIssues])

  const submitStream = async (formData: IssueFormData) => {
    dispatch({ type: 'SUBMIT_PROGRESS', progress: 5 })
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
            if (typeof p === 'number') dispatch({ type: 'SUBMIT_PROGRESS', progress: p })
            if (event.stage === 'error') {
              const msg = event.message ?? 'Something went wrong.'
              const isSpamRejection = /spam|test|content policy/i.test(msg)
              toast.error(isSpamRejection ? 'Report not submitted' : 'Submission failed', { description: msg })
              dispatch({ type: 'SUBMIT_ERROR' })
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
              toast.success('Issue submitted', {
                description: 'Your report has been received and is being processed. You can track it in My Issues.',
              })
              const showCrisis =
                d.urgency_level === 'CRITICAL' ||
                d.urgency_level === 'HIGH' ||
                d.requires_immediate_action === true
              dispatch({ type: 'SUBMIT_SUCCESS', issueId: d.issue_id, showCrisis })
              return
            }
          } catch {
            // ignore parse errors for partial chunks
          }
        }
      }
      dispatch({ type: 'SUBMIT_ERROR' })
      toast.error('Submission failed', { description: 'No response from server' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit issue'
      toast.error('Submission failed', { description: message })
      dispatch({ type: 'SUBMIT_ERROR' })
    }
  }

  const onSubmit = async (data: IssueFormData) => {
    clearError()
    const validation = validateReportInput(data.title, data.description)
    if (!validation.isValid) {
      toast.warning(validation.warning ?? 'Please provide more details.')
      return
    }
    dispatch({ type: 'SUBMIT_PROGRESS', progress: 5 })
    try {
      const checkRes = await fetch('/api/issues/smart-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const checkJson = await checkRes.json()
      if (checkJson.rejected_spam) {
        dispatch({ type: 'SUBMIT_ERROR' })
        toast.error('Report not submitted', { description: checkJson.message ?? 'This looks like a test or spam. Please describe a real campus issue.' })
        return
      }
      if (!checkRes.ok) {
        dispatch({ type: 'SUBMIT_ERROR' })
        toast.error('Something went wrong', { description: checkJson.error?.message ?? 'Please try again.' })
        return
      }
      if (checkJson.success && checkJson.needs_questions && Array.isArray(checkJson.questions) && checkJson.questions.length > 0) {
        dispatch({
          type: 'SHOW_SMART_QUESTIONS',
          payload: {
            data,
            questions: checkJson.questions,
            estimatedTime: checkJson.estimated_time ?? 10,
          },
        })
        return
      }
      await submitStream(data)
    } catch (error) {
      dispatch({ type: 'SUBMIT_ERROR' })
      const message = error instanceof Error ? error.message : 'Failed to submit issue'
      toast.error('Submission failed', { description: message })
    }
  }

  const handleSmartAnswers = (answers: Record<string, string>) => {
    if (!submitFlow.pendingSubmission) return
    const enrichedDescription = buildEnrichedDescription(
      submitFlow.pendingSubmission.data.title,
      submitFlow.pendingSubmission.data.description,
      answers,
      submitFlow.pendingSubmission.questions
    )
    const enrichedData: IssueFormData = {
      ...submitFlow.pendingSubmission.data,
      description: enrichedDescription,
    }
    const hasCategory = !!enrichedData.category_id?.trim()
    const hasLocation = !!enrichedData.location_id?.trim()
    const hasEnoughDescription = enrichedData.description.length >= 20
    dispatch({
      type: 'SMART_ANSWERS_DONE',
      enrichedData,
      needsFinalStep: !(hasCategory && hasLocation && hasEnoughDescription),
      categoryId: enrichedData.category_id?.trim(),
      locationId: enrichedData.location_id?.trim(),
    })
    if (hasCategory && hasLocation && hasEnoughDescription) {
      submitStream(enrichedData)
    }
  }

  const handleFinalStepSubmit = (category_id: string, location_id: string) => {
    if (!submitFlow.pendingFinalStep) return
    const completed: IssueFormData = {
      ...submitFlow.pendingFinalStep,
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
    dispatch({ type: 'FINAL_STEP_SUBMIT' })
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

  if (submitFlow.submitted && submitFlow.submittedIssueId) {
    return (
      <>
        <CrisisResourcesModal open={submitFlow.showCrisisResources} onClose={() => dispatch({ type: 'CLOSE_CRISIS' })} />
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
              <p className="font-mono text-lg font-semibold">{submitFlow.submittedIssueId}</p>
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
                  dispatch({ type: 'RESET_SUBMISSION' })
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
      {submitFlow.showSmartQuestions && submitFlow.pendingSubmission && (
        <SmartQuestionsModal
          open={submitFlow.showSmartQuestions}
          onClose={() => dispatch({ type: 'CLOSE_SMART_QUESTIONS' })}
          onSubmit={handleSmartAnswers}
          questions={submitFlow.pendingSubmission.questions}
          title={submitFlow.pendingSubmission.data.title}
          estimatedTime={submitFlow.pendingSubmission.estimatedTime}
        />
      )}
      {submitFlow.pendingFinalStep && (
        <Dialog open={!!submitFlow.pendingFinalStep} onOpenChange={(open) => !open && dispatch({ type: 'CLOSE_FINAL_STEP' })}>
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
                <Select value={submitFlow.finalStepCategoryId} onValueChange={(v) => dispatch({ type: 'SET_FINAL_STEP_IDS', categoryId: v, locationId: submitFlow.finalStepLocationId })}>
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
                <Select value={submitFlow.finalStepLocationId} onValueChange={(v) => dispatch({ type: 'SET_FINAL_STEP_IDS', categoryId: submitFlow.finalStepCategoryId, locationId: v })}>
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
                disabled={!submitFlow.finalStepCategoryId || !submitFlow.finalStepLocationId || submitFlow.submissionProgress !== null}
                onClick={() => handleFinalStepSubmit(submitFlow.finalStepCategoryId, submitFlow.finalStepLocationId)}
              >
                {submitFlow.submissionProgress !== null ? 'Submitting...' : 'Submit Report'}
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
              {submitFlow.submissionProgress !== null && (
                <div className="mb-6 rounded-lg border bg-muted/30 p-4">
                  <p className="mb-3 text-sm font-medium">
                    {submitFlow.submissionProgress <= 15 ? 'Checking report...' : 'Submitting your report'}
                  </p>
                  <SubmissionProgressBar progress={submitFlow.submissionProgress} />
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
                      disabled={submitFlow.submissionProgress !== null}
                    >
                      {submitFlow.submissionProgress !== null ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {submitFlow.submissionProgress <= 15 ? 'Checking...' : 'Submitting...'}
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
