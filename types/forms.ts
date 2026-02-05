import { z } from 'zod'

// ============================================
// Issue Submission Form
// ============================================

/** Strict schema: all fields required, used when validating final payload before create API. */
export const issueFormSchema = z.object({
  title: z
    .string()
    .min(10, 'Title must be at least 10 characters')
    .max(100, 'Title must be less than 100 characters'),
  description: z
    .string()
    .min(20, 'Please provide at least 20 characters (or answer the follow-up questions)')
    .max(2000, 'Description must be less than 2000 characters'),
  category_id: z
    .string()
    .min(1, 'Please select a category'),
  location_id: z
    .string()
    .min(1, 'Please select a location'),
})

export type IssueFormData = z.infer<typeof issueFormSchema>

/**
 * Soft schema for the submit page: minimal input to start the flow.
 * Category, location, and long description are optional; smart-check will ask follow-up questions.
 * Use this so users can submit with just a title (and optional short description).
 */
export const issueFormSchemaSoft = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters'),
  description: z
    .string()
    .max(2000, 'Description must be less than 2000 characters')
    .optional()
    .default(''),
  category_id: z
    .string()
    .optional()
    .default(''),
  location_id: z
    .string()
    .optional()
    .default(''),
})

/** Form values when using soft schema (optional category/location/description until final step). */
export type IssueFormDataSoft = z.infer<typeof issueFormSchemaSoft>

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
