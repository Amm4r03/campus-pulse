import type { IssueReport, AggregatedIssue, AdminAction } from '@/types'
import { getCategoryById } from './categories'
import { getLocationById } from './locations'

/**
 * ============================================
 * MOCK DATA - FOR REFERENCE ONLY
 * ============================================
 * 
 * This file contains mock data structures that demonstrate the 
 * expected format of issues in the Campus Pulse system.
 * 
 * In production, all data comes from:
 * - Student issues: /api/student/issues (Supabase + Gemini AI triage)
 * - Admin issues: /api/issues/admin (aggregated from Supabase)
 * - Issue creation: /api/issues/create (with real-time LLM processing)
 * 
 * The mock data below is commented out to ensure the demo shows
 * real business logic with actual API calls and LLM processing.
 * ============================================
 */

// Mock data is commented out - the system now uses real API calls
// Uncomment if you need to test without a database connection

/*
export const MOCK_ISSUE_REPORTS: IssueReport[] = [
  // Example issue format for reference:
  // {
  //   id: 'report-1',
  //   reporter_id: 'student-1',
  //   title: 'No water supply in Boys Hostel 1 for 2 days',
  //   description: '...',
  //   category_id: 'water-supply',
  //   location_id: 'hostel-boys-1',
  //   created_at: new Date().toISOString(),
  //   status: 'open',
  //   aggregation_status: 'aggregated',
  //   aggregated_issue_id: 'agg-1',
  // },
]

export const MOCK_AGGREGATED_ISSUES: AggregatedIssue[] = [
  // Example aggregated issue format for reference:
  // {
  //   id: 'agg-1',
  //   canonical_category_id: 'water-supply',
  //   location_id: 'hostel-boys-1',
  //   authority_id: 'provost',
  //   status: 'open',
  //   priority_score: 92,
  //   total_reports: 15,
  //   frequency_30min: 3,
  //   created_at: new Date().toISOString(),
  //   updated_at: new Date().toISOString(),
  // },
]

export const MOCK_ADMIN_ACTIONS: AdminAction[] = [
  // Example admin action format for reference:
  // {
  //   id: 'action-1',
  //   admin_id: 'admin-1',
  //   aggregated_issue_id: 'agg-2',
  //   action_type: 'status_change',
  //   previous_value: 'open',
  //   new_value: 'in_progress',
  //   notes: 'IT team notified.',
  //   created_at: new Date().toISOString(),
  // },
]
*/

// Empty arrays - all data comes from real APIs
export const MOCK_ISSUE_REPORTS: IssueReport[] = []
export const MOCK_AGGREGATED_ISSUES: AggregatedIssue[] = []
export const MOCK_ADMIN_ACTIONS: AdminAction[] = []

// ============================================
// Helper functions to populate related data
// ============================================

export function getIssueReportWithRelations(report: IssueReport): IssueReport {
  return {
    ...report,
    category: getCategoryById(report.category_id),
    location: getLocationById(report.location_id),
  }
}

export function getAggregatedIssueWithRelations(issue: AggregatedIssue): AggregatedIssue {
  const linkedReports = MOCK_ISSUE_REPORTS.filter(
    r => r.aggregated_issue_id === issue.id
  ).map(getIssueReportWithRelations)

  return {
    ...issue,
    category: getCategoryById(issue.canonical_category_id),
    location: getLocationById(issue.location_id),
    linked_reports: linkedReports,
  }
}

// Get all reports for a specific student
export function getReportsForStudent(studentId: string): IssueReport[] {
  return MOCK_ISSUE_REPORTS
    .filter(r => r.reporter_id === studentId)
    .map(getIssueReportWithRelations)
}

// Get admin actions for an issue
export function getActionsForIssue(aggregatedIssueId: string): AdminAction[] {
  return MOCK_ADMIN_ACTIONS.filter(a => a.aggregated_issue_id === aggregatedIssueId)
}
