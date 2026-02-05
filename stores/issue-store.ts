import { create } from 'zustand'
import type { IssueReport, IssueFormData, StudentFilters } from '@/types'
import { 
  MOCK_ISSUE_REPORTS, 
  getIssueReportWithRelations 
} from '@/lib/data/mock-issues'

interface IssueState {
  // Issue data
  myIssues: IssueReport[]
  currentIssue: IssueReport | null
  
  // Loading states
  isLoading: boolean
  isSubmitting: boolean
  
  // Form draft for optimistic updates
  draft: Partial<IssueFormData>
  
  // Filters
  filters: StudentFilters
}

interface IssueActions {
  // Data fetching
  fetchMyIssues: (studentId: string) => Promise<void>
  fetchIssueById: (id: string) => Promise<void>
  
  // Issue submission
  submitIssue: (data: IssueFormData) => Promise<IssueReport>
  
  // Draft management
  setDraft: (draft: Partial<IssueFormData>) => void
  clearDraft: () => void
  
  // Filters
  setFilters: (filters: Partial<StudentFilters>) => void
  resetFilters: () => void
  
  // Clear state
  clearCurrentIssue: () => void
  reset: () => void
}

type IssueStore = IssueState & IssueActions

const DEFAULT_FILTERS: StudentFilters = {
  status: 'all',
  sort_by: 'date',
  sort_order: 'desc',
}

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const useIssueStore = create<IssueStore>()((set, get) => ({
  // Initial state
  myIssues: [],
  currentIssue: null,
  isLoading: false,
  isSubmitting: false,
  draft: {},
  filters: DEFAULT_FILTERS,

  // Fetch issues for the current student (mock implementation)
  fetchMyIssues: async (studentId: string) => {
    set({ isLoading: true })
    
    // Simulate API call
    await delay(500)
    
    // Filter mock data by student ID
    const issues = MOCK_ISSUE_REPORTS
      .filter(report => report.reporter_id === studentId)
      .map(getIssueReportWithRelations)
    
    // Apply filters
    const { filters } = get()
    let filtered = [...issues]
    
    if (filters.status !== 'all') {
      filtered = filtered.filter(i => i.status === filters.status)
    }
    
    // Sort
    filtered.sort((a, b) => {
      const multiplier = filters.sort_order === 'asc' ? 1 : -1
      if (filters.sort_by === 'date') {
        return multiplier * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      }
      return 0
    })
    
    set({ myIssues: filtered, isLoading: false })
  },

  // Fetch a single issue by ID
  fetchIssueById: async (id: string) => {
    set({ isLoading: true })
    
    await delay(300)
    
    const issue = MOCK_ISSUE_REPORTS.find(r => r.id === id)
    if (issue) {
      set({ currentIssue: getIssueReportWithRelations(issue), isLoading: false })
    } else {
      set({ currentIssue: null, isLoading: false })
    }
  },

  // Submit a new issue (mock implementation)
  submitIssue: async (data: IssueFormData) => {
    set({ isSubmitting: true })
    
    await delay(1000)
    
    // Create new issue
    const newIssue: IssueReport = {
      id: `report-${Date.now()}`,
      reporter_id: 'student-1', // Would come from auth in real implementation
      title: data.title,
      description: data.description,
      category_id: data.category_id,
      location_id: data.location_id,
      created_at: new Date().toISOString(),
      status: 'open',
      aggregation_status: 'standalone',
    }
    
    const issueWithRelations = getIssueReportWithRelations(newIssue)
    
    set(state => ({
      myIssues: [issueWithRelations, ...state.myIssues],
      isSubmitting: false,
      draft: {},
    }))
    
    return issueWithRelations
  },

  // Draft management for form persistence
  setDraft: (draft) =>
    set(state => ({
      draft: { ...state.draft, ...draft },
    })),

  clearDraft: () => set({ draft: {} }),

  // Filter management
  setFilters: (filters) =>
    set(state => ({
      filters: { ...state.filters, ...filters },
    })),

  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  // Clear current issue
  clearCurrentIssue: () => set({ currentIssue: null }),

  // Reset entire store
  reset: () =>
    set({
      myIssues: [],
      currentIssue: null,
      isLoading: false,
      isSubmitting: false,
      draft: {},
      filters: DEFAULT_FILTERS,
    }),
}))

// Selector hooks
export const useMyIssues = () => useIssueStore((state) => state.myIssues)
export const useCurrentIssue = () => useIssueStore((state) => state.currentIssue)
export const useIsSubmitting = () => useIssueStore((state) => state.isSubmitting)
export const useIssueDraft = () => useIssueStore((state) => state.draft)
