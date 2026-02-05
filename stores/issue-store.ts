import { create } from 'zustand'
import type { IssueReport, IssueFormData, StudentFilters } from '@/types'
import { getIssueReportWithRelations } from '@/lib/data/mock-issues'
import { getCategoryById } from '@/lib/data/categories'
import { getLocationById } from '@/lib/data/locations'

interface IssueState {
  // Issue data
  myIssues: IssueReport[]
  currentIssue: IssueReport | null
  
  // Submitted issues (stored locally for demo)
  submittedIssues: IssueReport[]
  
  // Loading states
  isLoading: boolean
  isSubmitting: boolean
  
  // Error state
  error: string | null
  
  // Form draft for optimistic updates
  draft: Partial<IssueFormData>
  
  // Filters
  filters: StudentFilters
}

interface IssueActions {
  // Data fetching
  fetchMyIssues: (studentId: string) => Promise<void>
  fetchIssueById: (id: string) => Promise<void>
  lookupIssueById: (id: string) => Promise<IssueReport | null>
  
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
  clearError: () => void
  reset: () => void
}

type IssueStore = IssueState & IssueActions

const DEFAULT_FILTERS: StudentFilters = {
  status: 'all',
  sort_by: 'date',
  sort_order: 'desc',
}

export const useIssueStore = create<IssueStore>()((set, get) => ({
  // Initial state
  myIssues: [],
  currentIssue: null,
  submittedIssues: [],
  isLoading: false,
  isSubmitting: false,
  error: null,
  draft: {},
  filters: DEFAULT_FILTERS,

  // Fetch issues for the current student - tries API first, falls back to local
  fetchMyIssues: async (_studentId: string) => {
    set({ isLoading: true, error: null })
    
    try {
      // Try to fetch from real API
      const response = await fetch('/api/student/issues')
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data?.items) {
          // Map API response to IssueReport format
          const issues: IssueReport[] = data.data.items.map((item: any) => ({
            id: item.id,
            reporter_id: item.reporter_id,
            title: item.title,
            description: item.description,
            category_id: item.category_id,
            location_id: item.location_id,
            created_at: item.created_at,
            status: item.aggregated_status || 'open',
            aggregation_status: item.aggregated_issue_id ? 'aggregated' : 'standalone',
            aggregated_issue_id: item.aggregated_issue_id,
            category: item.category_name ? { id: item.category_id, name: item.category_name } : getCategoryById(item.category_id),
            location: item.location_name ? { id: item.location_id, name: item.location_name } : getLocationById(item.location_id),
          }))
          
          set({ myIssues: issues, isLoading: false })
          return
        }
      }
      
      // If API fails, use locally submitted issues
      const { submittedIssues, filters } = get()
      let filtered = [...submittedIssues]
      
      if (filters.status !== 'all') {
        filtered = filtered.filter(i => i.status === filters.status)
      }
      
      filtered.sort((a, b) => {
        const multiplier = filters.sort_order === 'asc' ? 1 : -1
        return multiplier * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      })
      
      set({ myIssues: filtered, isLoading: false })
      
    } catch (error) {
      console.error('Failed to fetch issues:', error)
      // Fall back to local submitted issues
      const { submittedIssues } = get()
      set({ myIssues: submittedIssues, isLoading: false })
    }
  },

  // Fetch a single issue by ID
  fetchIssueById: async (id: string) => {
    set({ isLoading: true, error: null })
    
    try {
      // First check locally submitted issues
      const { submittedIssues } = get()
      const localIssue = submittedIssues.find(i => i.id === id)
      
      if (localIssue) {
        set({ currentIssue: localIssue, isLoading: false })
        return
      }
      
      // Try API (this would need a student issue detail endpoint)
      // For now, just return null if not found locally
      set({ currentIssue: null, isLoading: false })
      
    } catch (error) {
      console.error('Failed to fetch issue:', error)
      set({ currentIssue: null, isLoading: false, error: 'Failed to fetch issue' })
    }
  },

  // Lookup issue by ID (for track page - returns the issue without setting state)
  lookupIssueById: async (id: string) => {
    const { submittedIssues } = get()
    
    // First check locally submitted issues
    const localIssue = submittedIssues.find(i => i.id === id)
    if (localIssue) {
      return localIssue
    }
    
    // Could add API call here for real lookup
    return null
  },

  // Submit a new issue - calls real API with Gemini triage
  submitIssue: async (data: IssueFormData) => {
    set({ isSubmitting: true, error: null })
    
    try {
      // Call the real API endpoint
      const response = await fetch('/api/issues/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        // Create issue report from API response
        const newIssue: IssueReport = {
          id: result.data.issue_id,
          reporter_id: 'student-1', // Will be set by auth in real implementation
          title: data.title,
          description: data.description,
          category_id: data.category_id,
          location_id: data.location_id,
          created_at: new Date().toISOString(),
          status: 'open',
          aggregation_status: result.data.aggregation_status === 'linked' ? 'aggregated' : 'standalone',
          aggregated_issue_id: result.data.aggregated_issue_id,
          priority_score: result.data.initial_priority,
          category: getCategoryById(data.category_id),
          location: getLocationById(data.location_id),
        }
        
        set(state => ({
          myIssues: [newIssue, ...state.myIssues],
          submittedIssues: [newIssue, ...state.submittedIssues],
          isSubmitting: false,
          draft: {},
        }))
        
        return newIssue
      }
      
      // If API call fails, create issue locally for demo
      throw new Error(result.error?.message || 'API call failed')
      
    } catch (error) {
      console.error('API submission failed, creating local issue:', error)
      
      // Create local issue for demo purposes
      const newIssue: IssueReport = {
        id: `report-${Date.now()}`,
        reporter_id: 'student-1',
        title: data.title,
        description: data.description,
        category_id: data.category_id,
        location_id: data.location_id,
        created_at: new Date().toISOString(),
        status: 'open',
        aggregation_status: 'standalone',
        category: getCategoryById(data.category_id),
        location: getLocationById(data.location_id),
      }
      
      set(state => ({
        myIssues: [newIssue, ...state.myIssues],
        submittedIssues: [newIssue, ...state.submittedIssues],
        isSubmitting: false,
        draft: {},
      }))
      
      return newIssue
    }
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
  
  // Clear error
  clearError: () => set({ error: null }),

  // Reset entire store
  reset: () =>
    set({
      myIssues: [],
      currentIssue: null,
      submittedIssues: [],
      isLoading: false,
      isSubmitting: false,
      error: null,
      draft: {},
      filters: DEFAULT_FILTERS,
    }),
}))

// Selector hooks
export const useMyIssues = () => useIssueStore((state) => state.myIssues)
export const useCurrentIssue = () => useIssueStore((state) => state.currentIssue)
export const useIsSubmitting = () => useIssueStore((state) => state.isSubmitting)
export const useIssueDraft = () => useIssueStore((state) => state.draft)
