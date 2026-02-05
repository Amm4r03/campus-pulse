import { z } from 'zod'

// ============================================
// Issue Submission Form
// ============================================

export const issueFormSchema = z.object({
  title: z
    .string()
    .min(10, 'Title must be at least 10 characters')
    .max(100, 'Title must be less than 100 characters'),
  description: z
    .string()
    .min(50, 'Please provide more detail (at least 50 characters)')
    .max(2000, 'Description must be less than 2000 characters'),
  category_id: z
    .string()
    .min(1, 'Please select a category'),
  location_id: z
    .string()
    .min(1, 'Please select a location'),
})

export type IssueFormData = z.infer<typeof issueFormSchema>

// ============================================
// Login Form
// ============================================

export const loginFormSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
})

export type LoginFormData = z.infer<typeof loginFormSchema>

// ============================================
// Admin Action Form
// ============================================

export const adminActionSchema = z.object({
  action_type: z.enum(['status_change', 'priority_override', 'note_added', 'authority_reassigned']),
  new_status: z.enum(['open', 'in_progress', 'resolved']).optional(),
  priority_override: z.number().min(0).max(100).optional(),
  notes: z.string().max(1000).optional(),
  authority_id: z.string().optional(),
})

export type AdminActionFormData = z.infer<typeof adminActionSchema>
