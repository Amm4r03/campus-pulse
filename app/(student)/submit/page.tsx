'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Send, CheckCircle2, AlertCircle, MapPin, Tag, FileText, Heading } from 'lucide-react'
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
import { useIssueStore } from '@/stores'
import { ISSUE_CATEGORIES, CATEGORY_GROUPS, CATEGORY_GROUP_LABELS } from '@/lib/data/categories'
import { getGroupedLocations, LOCATION_TYPE_LABELS } from '@/lib/data/locations'

export default function SubmitIssuePage() {
  const router = useRouter()
  const { submitIssue, isSubmitting } = useIssueStore()
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
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Submit an Issue</h1>
        <p className="text-muted-foreground">
          Report a campus issue. Please provide as much detail as possible.
        </p>
      </div>

      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Tips for Effective Reporting</AlertTitle>
        <AlertDescription>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
            <li>Be specific about the location and nature of the issue</li>
            <li>Include relevant details like time of occurrence</li>
            <li>Describe how the issue affects you or others</li>
          </ul>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Issue Details</CardTitle>
          <CardDescription>
            Fill out the form below to submit your issue report.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Heading className="h-4 w-4" />
                      Issue Title
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Brief summary of the issue"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A short, descriptive title (10-100 characters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category */}
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Category
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select issue category" />
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
                    <FormDescription>
                      Select the category that best describes your issue
                    </FormDescription>
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
                    <FormLabel className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Location
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
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
                    <FormDescription>
                      Where is this issue occurring?
                    </FormDescription>
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
                    <FormLabel className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Description
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide detailed information about the issue..."
                        className="min-h-[150px] resize-y"
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
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  'Submitting...'
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Issue
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
