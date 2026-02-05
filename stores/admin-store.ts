import { create } from 'zustand'
import type { AggregatedIssue, AdminFilters, AdminAction } from '@/types'
import { 
  MOCK_AGGREGATED_ISSUES,
  getAggregatedIssueWithRelations,
  getActionsForIssue,
} from '@/lib/data/mock-issues'

interface AdminState {
  // Issue data
  aggregatedIssues: AggregatedIssue[]
  selectedIssue: AggregatedIssue | null
  issueActions: AdminAction[]
  
  // Loading states
  isLoading: boolean
  isActionLoading: boolean
  
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

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Calculate stats from issues
const calculateStats = (issues: AggregatedIssue[]) => ({
  total: issues.length,
  open: issues.filter(i => i.status === 'open').length,
  inProgress: issues.filter(i => i.status === 'in_progress').length,
  resolved: issues.filter(i => i.status === 'resolved').length,
  highPriority: issues.filter(i => i.priority_score >= 75).length,
})

export const useAdminStore = create<AdminStore>()((set, get) => ({
  // Initial state
  aggregatedIssues: [],
  selectedIssue: null,
  issueActions: [],
  isLoading: false,
  isActionLoading: false,
  filters: DEFAULT_FILTERS,
  stats: {
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    highPriority: 0,
  },

  // Fetch all aggregated issues
  fetchAggregatedIssues: async () => {
    set({ isLoading: true })
    
    await delay(500)
    
    // Get all issues with relations
    let issues = MOCK_AGGREGATED_ISSUES.map(getAggregatedIssueWithRelations)
    
    // Apply filters
    const { filters } = get()
    
    if (filters.status !== 'all') {
      issues = issues.filter(i => i.status === filters.status)
    }
    
    if (filters.category_id !== 'all') {
      issues = issues.filter(i => i.canonical_category_id === filters.category_id)
    }
    
    if (filters.location_id !== 'all') {
      issues = issues.filter(i => i.location_id === filters.location_id)
    }
    
    // Sort
    issues.sort((a, b) => {
      const multiplier = filters.sort_order === 'asc' ? 1 : -1
      
      switch (filters.sort_by) {
        case 'priority':
          return multiplier * (a.priority_score - b.priority_score)
        case 'date':
          return multiplier * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        case 'frequency':
          return multiplier * (a.frequency_30min - b.frequency_30min)
        default:
          return 0
      }
    })
    
    // Calculate stats from unfiltered data
    const allIssues = MOCK_AGGREGATED_ISSUES.map(getAggregatedIssueWithRelations)
    
    set({ 
      aggregatedIssues: issues, 
      isLoading: false,
      stats: calculateStats(allIssues),
    })
  },

  // Fetch a single issue by ID
  fetchIssueById: async (id: string) => {
    set({ isLoading: true })
    
    await delay(300)
    
    const issue = MOCK_AGGREGATED_ISSUES.find(i => i.id === id)
    if (issue) {
      const issueWithRelations = getAggregatedIssueWithRelations(issue)
      set({ selectedIssue: issueWithRelations, isLoading: false })
      
      // Also fetch actions
      get().fetchIssueActions(id)
    } else {
      set({ selectedIssue: null, isLoading: false })
    }
  },

  // Fetch admin actions for an issue
  fetchIssueActions: async (issueId: string) => {
    await delay(200)
    
    const actions = getActionsForIssue(issueId)
    set({ issueActions: actions })
  },

  // Update issue status (mock implementation)
  updateIssueStatus: async (issueId, status, _notes) => {
    set({ isActionLoading: true })
    
    await delay(500)
    
    // Update in local state
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
      get().fetchIssueActions(id)
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
