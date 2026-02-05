import { create } from 'zustand'

interface UIState {
  // Sidebar
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  
  // Modals
  activeModal: string | null
  modalData: Record<string, unknown> | null
  
  // Mobile menu
  mobileMenuOpen: boolean
  
  // Theme
  theme: 'light' | 'dark' | 'system'
}

interface UIActions {
  // Sidebar
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebarCollapsed: () => void
  
  // Modals
  showModal: (id: string, data?: Record<string, unknown>) => void
  hideModal: () => void
  
  // Mobile menu
  toggleMobileMenu: () => void
  setMobileMenuOpen: (open: boolean) => void
  
  // Theme
  setTheme: (theme: UIState['theme']) => void
  
  // Reset
  reset: () => void
}

type UIStore = UIState & UIActions

export const useUIStore = create<UIStore>()((set) => ({
  // Initial state
  sidebarOpen: true,
  sidebarCollapsed: false,
  activeModal: null,
  modalData: null,
  mobileMenuOpen: false,
  theme: 'system',

  // Sidebar actions
  toggleSidebar: () =>
    set(state => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open) =>
    set({ sidebarOpen: open }),

  toggleSidebarCollapsed: () =>
    set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  // Modal actions
  showModal: (id, data) =>
    set({ activeModal: id, modalData: data ?? null }),

  hideModal: () =>
    set({ activeModal: null, modalData: null }),

  // Mobile menu actions
  toggleMobileMenu: () =>
    set(state => ({ mobileMenuOpen: !state.mobileMenuOpen })),

  setMobileMenuOpen: (open) =>
    set({ mobileMenuOpen: open }),

  // Theme actions
  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('campus-pulse-theme', theme)
      
      // Apply theme to document
      const root = document.documentElement
      root.classList.remove('light', 'dark')
      
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        root.classList.add(systemTheme)
      } else {
        root.classList.add(theme)
      }
    }
    set({ theme })
  },

  // Reset
  reset: () =>
    set({
      sidebarOpen: true,
      sidebarCollapsed: false,
      activeModal: null,
      modalData: null,
      mobileMenuOpen: false,
    }),
}))

// Selector hooks
export const useSidebarOpen = () => useUIStore((state) => state.sidebarOpen)
export const useSidebarCollapsed = () => useUIStore((state) => state.sidebarCollapsed)
export const useActiveModal = () => useUIStore((state) => state.activeModal)
export const useModalData = () => useUIStore((state) => state.modalData)
export const useMobileMenuOpen = () => useUIStore((state) => state.mobileMenuOpen)
export const useTheme = () => useUIStore((state) => state.theme)
