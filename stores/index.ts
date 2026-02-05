// Re-export all stores for convenient imports
export { useAuthStore, useUser, useRole, useIsAuthenticated, useIsStudent, useIsAdmin } from './auth-store'
export { useIssueStore, useMyIssues, useCurrentIssue, useIsSubmitting, useIssueDraft } from './issue-store'
export {
  useAdminStore,
  useAggregatedIssues,
  useSelectedIssue,
  useAdminStats,
  useAdminFilters,
  type SpamReportItem,
} from './admin-store'
export { useUIStore, useSidebarOpen, useSidebarCollapsed, useActiveModal, useModalData, useMobileMenuOpen, useTheme } from './ui-store'
