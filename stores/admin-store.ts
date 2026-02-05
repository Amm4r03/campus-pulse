import { create } from 'zustand'
import type { AggregatedIssue, AdminFilters, AdminAction } from '@/types'
import { getCategoryById } from '@/lib/data/categories'
import { getLocationById } from '@/lib/data/locations'

interface AdminState {
  // Issue data
  aggregatedIssues: AggregatedIssue[]
  selectedIssue: AggregatedIssue | null
  issueActions: AdminAction[]
  
  // Loading states
  isLoading: boolean
  isActionLoading: boolean
  
  // Error state
  error: string | null
  
  // Filters
  filters: AdminFilters
  
  // Stats
  stats: {
    total: number
    open: number
    inProgress: number
    resolved: number
    highPriority: number
  }
  /** Total count of individual issue reports (for Issues nav badge) */
  reportCount: number
  /** Most reported location (for dashboard stat card) */
  mostReportedLocation: string | null
  /** Spam reports (for admin spam tab) */
  spamReports: SpamReportItem[]
  /** Count of spam reports (muted badge in nav) */
  spamCount: number
  /** Resolved count from DB (all time) for analytics */
  resolvedCount: number
  /** Resolved today count from DB for "Issues closed" card */
  resolvedTodayCount: number
}

export interface SpamReportItem {
  id: string
  title: string
  description: string
  created_at: string
  category_name: string
  location_name: string
  report_type: string
  spam_confidence: number
}

interface AdminActions {
  // Data fetching
  /** Optional status override (e.g. 'open,in_progress' for Active tab, 'resolved' for Recently Resolved) */
  fetchAggregatedIssues: (overrides?: { status?: AdminFilters['status'] }) => Promise<void>
  fetchReportCount: () => Promise<void>
  fetchIssueById: (id: string) => Promise<void>
  fetchIssueActions: (issueId: string) => Promise<void>
  
  // Issue actions
  updateIssueStatus: (issueId: string, status: AggregatedIssue['status'], notes?: string) => Promise<void>
  updateIssueAuthority: (issueId: string, authorityId: string) => Promise<void>
  fetchMostReportedLocation: () => Promise<void>
  fetchSpamCount: () => Promise<void>
  fetchSpamReports: () => Promise<void>
  markReportNotSpam: (reportId: string) => Promise<void>
  fetchResolvedStats: () => Promise<void>
  
  // Selection
  selectIssue: (id: string | null) => void
  
  // Filters
  setFilters: (filters: Partial<AdminFilters>) => void
  resetFilters: () => void
  
  // Reset
  reset: () => void
}

type AdminStore = AdminState & AdminActions

const DEFAULT_FILTERS: AdminFilters = {
  status: 'all',
  category_id: 'all',
  location_id: 'all',
  category_name: 'all',
  location_name: 'all',
  date_range: { start: null, end: null },
  sort_by: 'priority',
  sort_order: 'desc',
}

// Calculate stats from issues
const calculateStats = (issues: AggregatedIssue[]) => ({
  total: issues.length,
  open: issues.filter(i => i.status === 'open').length,
  inProgress: issues.filter(i => i.status === 'in_progress').length,
  resolved: issues.filter(i => i.status === 'resolved').length,
  highPriority: issues.filter(i => (i.priority_score || 0) >= 75).length,
})

export const useAdminStore = create<AdminStore>()((set, get) => ({
  // Initial state
  aggregatedIssues: [],
  selectedIssue: null,
  issueActions: [],
  isLoading: false,
  isActionLoading: false,
  error: null,
  filters: DEFAULT_FILTERS,
  stats: {
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    highPriority: 0,
  },
  reportCount: 0,
  mostReportedLocation: null,
  spamReports: [],
  spamCount: 0,
  resolvedCount: 0,
  resolvedTodayCount: 0,

  fetchMostReportedLocation: async () => {
    try {
      const res = await fetch('/api/stats/locations/most-reported')
      const data = await res.json()
      if (data.success && data.location != null) {
        set({ mostReportedLocation: data.location })
      }
    } catch {
      // ignore
    }
  },

  fetchSpamCount: async () => {
    try {
      const res = await fetch('/api/issues/admin/spam')
      const data = await res.json()
      if (data.success && data.data != null) {
        set({ spamCount: data.data.count ?? 0 })
      }
    } catch {
      // ignore
    }
  },

  fetchSpamReports: async () => {
    try {
      const res = await fetch('/api/issues/admin/spam')
      const data = await res.json()
      if (data.success && data.data) {
        set({
          spamReports: data.data.items ?? [],
          spamCount: data.data.count ?? 0,
        })
      }
    } catch {
      set({ spamReports: [], spamCount: 0 })
    }
  },

  markReportNotSpam: async (reportId: string) => {
    const res = await fetch(`/api/issues/admin/spam/${reportId}/mark-not-spam`, { method: 'POST' })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error?.message ?? 'Failed to mark as not spam')
    }
    set(state => ({
      spamReports: state.spamReports.filter(r => r.id !== reportId),
      spamCount: Math.max(0, state.spamCount - 1),
    }))
  },

  fetchResolvedStats: async () => {
    try {
      const res = await fetch('/api/stats/resolved')
      const data = await res.json()
      if (data.success && data.data) {
        set({
          resolvedCount: data.data.resolved_count ?? 0,
          resolvedTodayCount: data.data.resolved_today_count ?? 0,
        })
      }
    } catch {
      // ignore
    }
  },

  // Fetch total count of individual reports (for nav badge)
  fetchReportCount: async () => {
    try {
      const res = await fetch('/api/issues/admin/reports?page=1&limit=1')
      const data = await res.json()
      if (data.success && data.data?.pagination?.total != null) {
        set({ reportCount: data.data.pagination.total })
      }
    } catch {
      // ignore
    }
  },

  // Fetch all aggregated issues from real API
  fetchAggregatedIssues: async (overrides) => {
    set({ isLoading: true, error: null })
    
    try {
      const { filters } = get()
      const effective = { ...filters, ...overrides }
      
      // Build query params (view filters by name: category_name, location_name)
      const params = new URLSearchParams()
      if (effective.status !== 'all') params.set('status', effective.status)
      if (effective.category_name && effective.category_name !== 'all') params.set('category_name', effective.category_name)
      if (effective.location_name && effective.location_name !== 'all') params.set('location_name', effective.location_name)
      if (effective.sort_by) params.set('sort_by', effective.sort_by)
      if (effective.sort_order) params.set('order', effective.sort_order)
      
      const response = await fetch(`/api/issues/admin?${params.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.success && data.data?.items) {
          // Map API response to AggregatedIssue format (view returns only names, no ids)
          const issues: AggregatedIssue[] = data.data.items.map((item: any) => ({
            id: item.id,
            canonical_category_id: '',
            location_id: '',
            authority_id: '',
            status: item.status,
            priority_score: item.current_priority ?? 0,
            total_reports: item.total_reports ?? 1,
            frequency_30min: item.reports_last_30_min ?? 0,
            first_report_time: item.first_report_time,
            latest_report_time: item.latest_report_time,
            created_at: item.created_at,
            updated_at: item.updated_at,
            category: item.category_name != null ? { id: '', name: item.category_name, is_environmental: !!item.is_environmental } : undefined,
            location: item.location_name != null ? { id: '', name: item.location_name } : undefined,
            authority: item.authority_name != null ? { id: '', name: item.authority_name } : undefined,
          }))
          
          set({ 
            aggregatedIssues: issues, 
            isLoading: false,
            stats: calculateStats(issues),
          })
          get().fetchMostReportedLocation()
          return
        }
      }
      
      // If API fails, set empty state (no mock fallback for admin)
      set({ 
        aggregatedIssues: [], 
        isLoading: false,
        stats: calculateStats([]),
        error: 'Failed to fetch issues from server'
      })
      
    } catch (error) {
      console.error('Failed to fetch admin issues:', error)
      set({ 
        aggregatedIssues: [], 
        isLoading: false,
        stats: calculateStats([]),
        error: 'Connection error'
      })
    }
  },

  // Fetch a single issue by ID from real API
  fetchIssueById: async (id: string) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await fetch(`/api/issues/${id}`)
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.success && data.data?.issue) {
          const item = data.data.issue
          const linkedReports = data.data.linked_reports || []
          
          const issue: AggregatedIssue = {
            id: item.id,
            canonical_category_id: item.category?.id,
            location_id: item.location?.id,
            authority_id: item.authority?.id,
            status: item.status,
            priority_score: item.metrics?.current_priority || 0,
            total_reports: item.metrics?.total_reports || 1,
            frequency_30min: item.metrics?.reports_last_30_min || 0,
            first_report_time: item.metrics?.first_report_time,
            latest_report_time: item.metrics?.latest_report_time,
            created_at: item.created_at,
            updated_at: item.updated_at,
            category: item.category,
            location: item.location,
            authority: item.authority,
            linked_reports: linkedReports,
            priority_breakdown: item.metrics?.priority_breakdown,
          }
          
          set({ 
            selectedIssue: issue, 
            isLoading: false,
            issueActions: data.data.admin_actions || []
          })
          return
        }
      }
      
      set({ selectedIssue: null, isLoading: false, error: 'Issue not found' })
      
    } catch (error) {
      console.error('Failed to fetch issue:', error)
      set({ selectedIssue: null, isLoading: false, error: 'Connection error' })
    }
  },

  // Fetch admin actions for an issue (now included in fetchIssueById)
  fetchIssueActions: async (_issueId: string) => {
    // Actions are now fetched as part of fetchIssueById
    // This is kept for backwards compatibility
  },

  // Update issue status via real API
  updateIssueStatus: async (issueId, status, notes) => {
    set({ isActionLoading: true, error: null })
    
    try {
      const body =
        status === 'resolved'
          ? { action_type: 'resolve' as const, notes: notes || undefined }
          : { action_type: 'change_status' as const, new_value: { status }, notes: notes || undefined }
      const response = await fetch(`/api/issues/${issueId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      
      if (response.ok) {
        // Update in local state optimistically
        set(state => ({
          aggregatedIssues: state.aggregatedIssues.map(issue =>
            issue.id === issueId
              ? { ...issue, status, updated_at: new Date().toISOString() }
              : issue
          ),
          selectedIssue: state.selectedIssue?.id === issueId
            ? { ...state.selectedIssue, status, updated_at: new Date().toISOString() }
            : state.selectedIssue,
          isActionLoading: false,
        }))
        
        // Recalculate stats
        const { aggregatedIssues } = get()
        set({ stats: calculateStats(aggregatedIssues) })
        return
      }
      
      throw new Error('Failed to update status')
      
    } catch (error) {
      console.error('Failed to update issue status:', error)
      
      // Still update locally for demo purposes
      set(state => ({
        aggregatedIssues: state.aggregatedIssues.map(issue =>
          issue.id === issueId
            ? { ...issue, status, updated_at: new Date().toISOString() }
            : issue
        ),
        selectedIssue: state.selectedIssue?.id === issueId
          ? { ...state.selectedIssue, status, updated_at: new Date().toISOString() }
          : state.selectedIssue,
        isActionLoading: false,
      }))
      
      const { aggregatedIssues } = get()
      set({ stats: calculateStats(aggregatedIssues) })
    }
  },

  updateIssueAuthority: async (issueId, authorityId) => {
    set({ isActionLoading: true, error: null })
    try {
      const response = await fetch(`/api/issues/${issueId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_type: 'assign',
          new_value: { authority_id: authorityId },
        }),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error?.message ?? 'Failed to assign authority')
      }
      set({ isActionLoading: false })
      await get().fetchAggregatedIssues()
    } catch (error) {
      console.error('Failed to assign authority:', error)
      set({ isActionLoading: false, error: error instanceof Error ? error.message : 'Failed to assign' })
      throw error
    }
  },

  // Select an issue
  selectIssue: (id) => {
    if (id === null) {
      set({ selectedIssue: null, issueActions: [] })
      return
    }
    
    const issue = get().aggregatedIssues.find(i => i.id === id)
    if (issue) {
      set({ selectedIssue: issue })
    }
  },

  // Filter management
  setFilters: (filters) => {
    set(state => ({
      filters: { ...state.filters, ...filters },
    }))
    // Refetch with new filters
    get().fetchAggregatedIssues()
  },

  resetFilters: () => {
    set({ filters: DEFAULT_FILTERS })
    get().fetchAggregatedIssues()
  },

  // Reset store
  reset: () =>
    set({
      aggregatedIssues: [],
      selectedIssue: null,
      issueActions: [],
      isLoading: false,
      isActionLoading: false,
      error: null,
      filters: DEFAULT_FILTERS,
      stats: {
        total: 0,
        open: 0,
        inProgress: 0,
        resolved: 0,
        highPriority: 0,
      },
      reportCount: 0,
      mostReportedLocation: null,
      spamReports: [],
      spamCount: 0,
      resolvedCount: 0,
      resolvedTodayCount: 0,
    }),
}))

// Selector hooks
export const useAggregatedIssues = () => useAdminStore((state) => state.aggregatedIssues)
export const useSelectedIssue = () => useAdminStore((state) => state.selectedIssue)
export const useAdminStats = () => useAdminStore((state) => state.stats)
export const useAdminFilters = () => useAdminStore((state) => state.filters)
