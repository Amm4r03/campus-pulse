'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Send, CheckCircle2, AlertCircle, MapPin, Tag, FileText, Heading, ChevronRight } from 'lucide-react'
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
import { issueFormSchema, type IssueFormData } from '@/types/forms'
import { useIssueStore, useAuthStore } from '@/stores'
import { ISSUE_CATEGORIES, CATEGORY_GROUPS, CATEGORY_GROUP_LABELS } from '@/lib/data/categories'
import { getGroupedLocations, LOCATION_TYPE_LABELS } from '@/lib/data/locations'
import { CampusStatus, QuickStats } from '@/components/campus-status'
import { ActiveReportsPreview } from '@/components/active-reports-preview'
import Link from 'next/link'

export default function SubmitIssuePage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { submitIssue, isSubmitting, myIssues, fetchMyIssues } = useIssueStore()
  const [submitted, setSubmitted] = useState(false)
  const [submittedIssueId, setSubmittedIssueId] = useState<string | null>(null)

  const form = useForm<IssueFormData>({
    resolver: zodResolver(issueFormSchema),
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

  const onSubmit = async (data: IssueFormData) => {
    try {
      const issue = await submitIssue(data)
      setSubmittedIssueId(issue.id)
      setSubmitted(true)
    } catch (error) {
      console.error('Failed to submit issue:', error)
    }
  }

  const groupedLocations = getGroupedLocations()

  // Get active issues (not resolved)
  const activeIssues = myIssues.filter(issue => issue.status !== 'resolved')
  const resolvedCount = myIssues.filter(issue => issue.status === 'resolved').length

  if (submitted && submittedIssueId) {
    return (
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
    )
  }

  return (
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
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Category & Location - Side by Side on larger screens */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Category */}
                    <FormField
                      control={form.control}
                      name="category_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Issue Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder="Select a category..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(CATEGORY_GROUPS).map(([group, categoryIds]) => (
                                <SelectGroup key={group}>
                                  <SelectLabel>
                                    {CATEGORY_GROUP_LABELS[group as keyof typeof CATEGORY_GROUP_LABELS]}
                                  </SelectLabel>
                                  {categoryIds.map((catId) => {
                                    const category = ISSUE_CATEGORIES.find(c => c.id === catId)
                                    if (!category) return null
                                    return (
                                      <SelectItem key={category.id} value={category.id}>
                                        {category.name}
                                      </SelectItem>
                                    )
                                  })}
                                </SelectGroup>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Location */}
                    <FormField
                      control={form.control}
                      name="location_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Campus Zone / Location</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder="Select location..." />
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
                          Minimum 50 characters. Include relevant details like timing, impact, etc.
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
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        'Submitting...'
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
  )
}
