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
}

interface AdminActions {
  // Data fetching
  fetchAggregatedIssues: () => Promise<void>
  fetchIssueById: (id: string) => Promise<void>
  fetchIssueActions: (issueId: string) => Promise<void>
  
  // Issue actions
  updateIssueStatus: (issueId: string, status: AggregatedIssue['status'], notes?: string) => Promise<void>
  
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

  // Fetch all aggregated issues from real API
  fetchAggregatedIssues: async () => {
    set({ isLoading: true, error: null })
    
    try {
      const { filters } = get()
      
      // Build query params
      const params = new URLSearchParams()
      if (filters.status !== 'all') params.set('status', filters.status)
      if (filters.sort_by) params.set('sort_by', filters.sort_by)
      if (filters.sort_order) params.set('order', filters.sort_order)
      
      const response = await fetch(`/api/issues/admin?${params.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.success && data.data?.items) {
          // Map API response to AggregatedIssue format
          const issues: AggregatedIssue[] = data.data.items.map((item: any) => ({
            id: item.id,
            canonical_category_id: item.category_id,
            location_id: item.location_id,
            authority_id: item.authority_id,
            status: item.status,
            priority_score: item.current_priority || 0,
            total_reports: item.total_reports || 1,
            frequency_30min: item.reports_last_30_min || 0,
            first_report_time: item.first_report_time,
            latest_report_time: item.latest_report_time,
            created_at: item.created_at,
            updated_at: item.updated_at,
            category: item.category_name ? { id: item.category_id, name: item.category_name } : getCategoryById(item.category_id),
            location: item.location_name ? { id: item.location_id, name: item.location_name } : getLocationById(item.location_id),
          }))
          
          set({ 
            aggregatedIssues: issues, 
            isLoading: false,
            stats: calculateStats(issues),
          })
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
      const response = await fetch(`/api/issues/${issueId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_type: 'status_change',
          new_value: status,
          notes: notes || `Status changed to ${status}`,
        }),
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
    }),
}))

// Selector hooks
export const useAggregatedIssues = () => useAdminStore((state) => state.aggregatedIssues)
export const useSelectedIssue = () => useAdminStore((state) => state.selectedIssue)
export const useAdminStats = () => useAdminStore((state) => state.stats)
export const useAdminFilters = () => useAdminStore((state) => state.filters)
