import type { IssueReport, AggregatedIssue, AdminAction } from '@/types'
import { getCategoryById } from './categories'
import { getLocationById } from './locations'

// ============================================
// Mock Issue Reports (Student submissions)
// ============================================

export const MOCK_ISSUE_REPORTS: IssueReport[] = [
  {
    id: 'report-1',
    reporter_id: 'student-1',
    title: 'No water supply in Boys Hostel 1 for 2 days',
    description: 'The water supply has been completely cut off in Boys Hostel 1 for the past two days. We are facing severe difficulties with basic hygiene and daily activities. The water tank appears to be empty and there has been no communication from the hostel administration about when this will be resolved. This is affecting over 200 students.',
    category_id: 'water-supply',
    location_id: 'hostel-boys-1',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'open',
    aggregation_status: 'aggregated',
    aggregated_issue_id: 'agg-1',
  },
  {
    id: 'report-2',
    reporter_id: 'student-2',
    title: 'Water problem in Boys Hostel 1',
    description: 'There is no water available in our hostel since yesterday morning. Cannot shower or even wash hands properly. This is a health hazard. Multiple students are affected and we need immediate action. Some students have had to buy bottled water for basic needs.',
    category_id: 'water-supply',
    location_id: 'hostel-boys-1',
    created_at: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'open',
    aggregation_status: 'aggregated',
    aggregated_issue_id: 'agg-1',
  },
  {
    id: 'report-3',
    reporter_id: 'student-3',
    title: 'Wi-Fi not working in Academic Block A',
    description: 'The Wi-Fi has been extremely slow and disconnecting frequently in Academic Block A, especially on the third floor. During online examinations and assignment submissions, this causes major problems. The issue has persisted for over a week now.',
    category_id: 'wifi',
    location_id: 'block-a',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'in_progress',
    aggregation_status: 'aggregated',
    aggregated_issue_id: 'agg-2',
  },
  {
    id: 'report-4',
    reporter_id: 'student-4',
    title: 'AC not working in Library reading hall',
    description: 'The air conditioning in the main reading hall of the Central Library has not been working for several days. With the current hot weather, it is very uncomfortable to study there. Students are avoiding the library which affects their studies.',
    category_id: 'ac-heating',
    location_id: 'central-library',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'open',
    aggregation_status: 'standalone',
  },
  {
    id: 'report-5',
    reporter_id: 'student-5',
    title: 'Poor food quality in Main Canteen',
    description: 'The food quality in the main canteen has deteriorated significantly. Found insects in the dal yesterday and the vegetables are often stale. Multiple students have complained of stomach issues after eating there. This needs urgent attention.',
    category_id: 'food-quality',
    location_id: 'main-canteen',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'open',
    aggregation_status: 'aggregated',
    aggregated_issue_id: 'agg-3',
  },
  {
    id: 'report-6',
    reporter_id: 'student-1',
    title: 'Broken desk in classroom 302',
    description: 'One of the desks in classroom 302 of Academic Block B has a broken leg and is unsafe to use. It wobbles dangerously and could injure someone. Please arrange for repair or replacement.',
    category_id: 'furniture',
    location_id: 'block-b',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'resolved',
    aggregation_status: 'standalone',
  },
]

// ============================================
// Mock Aggregated Issues (Admin view)
// ============================================

export const MOCK_AGGREGATED_ISSUES: AggregatedIssue[] = [
  {
    id: 'agg-1',
    canonical_category_id: 'water-supply',
    location_id: 'hostel-boys-1',
    authority_id: 'provost',
    status: 'open',
    priority_score: 92,
    total_reports: 15,
    frequency_30min: 3,
    first_report_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    latest_report_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'agg-2',
    canonical_category_id: 'wifi',
    location_id: 'block-a',
    authority_id: 'it-services',
    status: 'in_progress',
    priority_score: 68,
    total_reports: 8,
    frequency_30min: 0,
    first_report_time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    latest_report_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'agg-3',
    canonical_category_id: 'food-quality',
    location_id: 'main-canteen',
    authority_id: 'admin-office',
    status: 'open',
    priority_score: 85,
    total_reports: 12,
    frequency_30min: 2,
    first_report_time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    latest_report_time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'agg-4',
    canonical_category_id: 'electricity',
    location_id: 'hostel-girls-1',
    authority_id: 'maintenance',
    status: 'open',
    priority_score: 78,
    total_reports: 6,
    frequency_30min: 1,
    first_report_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    latest_report_time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'agg-5',
    canonical_category_id: 'sanitation',
    location_id: 'hostel-boys-2',
    authority_id: 'admin-office',
    status: 'open',
    priority_score: 72,
    total_reports: 5,
    frequency_30min: 0,
    first_report_time: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    latest_report_time: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'agg-6',
    canonical_category_id: 'safety',
    location_id: 'parking',
    authority_id: 'security',
    status: 'in_progress',
    priority_score: 65,
    total_reports: 4,
    frequency_30min: 0,
    first_report_time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    latest_report_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'agg-7',
    canonical_category_id: 'timetable',
    location_id: 'block-c',
    authority_id: 'academic-affairs',
    status: 'resolved',
    priority_score: 45,
    total_reports: 3,
    frequency_30min: 0,
    first_report_time: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    latest_report_time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

// ============================================
// Mock Admin Actions
// ============================================

export const MOCK_ADMIN_ACTIONS: AdminAction[] = [
  {
    id: 'action-1',
    admin_id: 'admin-1',
    aggregated_issue_id: 'agg-2',
    action_type: 'status_change',
    previous_value: 'open',
    new_value: 'in_progress',
    notes: 'IT team has been notified and is investigating the network issues.',
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'action-2',
    admin_id: 'admin-1',
    aggregated_issue_id: 'agg-6',
    action_type: 'status_change',
    previous_value: 'open',
    new_value: 'in_progress',
    notes: 'Security patrol has been increased in the parking area.',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'action-3',
    admin_id: 'admin-1',
    aggregated_issue_id: 'agg-7',
    action_type: 'status_change',
    previous_value: 'in_progress',
    new_value: 'resolved',
    notes: 'Timetable has been revised and updated on the notice board.',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

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
