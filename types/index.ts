// ============================================
// User Types
// ============================================

export type UserRole = 'student' | 'admin'

export interface User {
  id: string
  role: UserRole
  created_at: string
}

// ============================================
// Location Types (aligned with domain & DB schema)
// ============================================

import type { LocationType as DomainLocationType } from '@/domain/types'
export type LocationType = DomainLocationType

export interface Location {
  id: string
  name: string
  type: DomainLocationType
  is_active: boolean
}

// ============================================
// Issue Category Types
// ============================================

export interface IssueCategory {
  id: string
  name: string
  is_environmental: boolean
  default_authority_id?: string
}

// ============================================
// Authority Types
// ============================================

export interface Authority {
  id: string
  name: string
  description: string
}

// ============================================
// Issue Report Types (Student-facing)
// ============================================

export type IssueStatus = 'open' | 'in_progress' | 'resolved'

export type AggregationStatus = 'standalone' | 'aggregated'

export interface IssueReport {
  id: string
  reporter_id: string
  title: string
  description: string
  category_id: string
  location_id: string
  created_at: string
  status: IssueStatus
  aggregation_status: AggregationStatus
  aggregated_issue_id?: string
  // Automation/triage fields (from API response)
  priority_score?: number
  urgency_level?: string
  requires_immediate_action?: boolean
  // Populated fields for display
  category?: IssueCategory
  location?: Location
}

// ============================================
// Aggregated Issue Types (Admin-facing)
// ============================================

export interface PriorityBreakdown {
  urgency_component: number
  impact_component: number
  frequency_component: number
  environmental_component: number
}

export interface AggregatedIssue {
  id: string
  canonical_category_id: string
  location_id: string
  authority_id: string
  status: IssueStatus
  priority_score: number
  total_reports: number
  frequency_30min: number
  first_report_time: string
  latest_report_time: string
  created_at: string
  updated_at: string
  // Populated fields for display
  category?: IssueCategory
  location?: Location
  authority?: Authority
  linked_reports?: IssueReport[]
  priority_breakdown?: PriorityBreakdown
}

// ============================================
// Automation Metadata Types
// ============================================

export interface AutomationMetadata {
  id: string
  issue_report_id: string
  extracted_category: string
  urgency_score: number
  impact_scope: 'single' | 'multi'
  environmental_flag: boolean
  confidence_score: number
  created_at: string
}

// ============================================
// Priority Snapshot Types
// ============================================

export interface PrioritySnapshot {
  id: string
  aggregated_issue_id: string
  priority_score: number
  calculated_at: string
}

// ============================================
// Frequency Metrics Types
// ============================================

export interface FrequencyMetric {
  id: string
  aggregated_issue_id: string
  window_minutes: number
  report_count: number
  calculated_at: string
}

// ============================================
// Admin Action Types
// ============================================

export type AdminActionType = 
  | 'status_change' 
  | 'priority_override' 
  | 'note_added' 
  | 'authority_reassigned'

export interface AdminAction {
  id: string
  admin_id: string
  aggregated_issue_id: string
  action_type: AdminActionType
  previous_value?: string
  new_value?: string
  notes?: string
  created_at: string
}

// ============================================
// Filter Types
// ============================================

export interface AdminFilters {
  /** 'open,in_progress' = active issues only (for Active tab) */
  status: IssueStatus | 'all' | 'open,in_progress'
  category_id: string | 'all'
  location_id: string | 'all'
  /** Used for API filtering (view has category_name, not id) */
  category_name: string | 'all'
  location_name: string | 'all'
  date_range: {
    start: string | null
    end: string | null
  }
  sort_by: 'priority' | 'date' | 'frequency'
  sort_order: 'asc' | 'desc'
}

export interface StudentFilters {
  status: IssueStatus | 'all'
  sort_by: 'date' | 'status'
  sort_order: 'asc' | 'desc'
}

// ============================================
// Toast/Notification Types
// ============================================

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
}

// Re-export form types
export type { IssueFormData, LoginFormData, AdminActionFormData } from './forms'
