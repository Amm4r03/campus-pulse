import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, UserRole } from '@/types'

interface AuthState {
  user: User | null
  role: UserRole | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthActions {
  setUser: (user: User | null) => void
  setRole: (role: UserRole | null) => void
  login: (role: UserRole) => void
  logout: () => void
  setLoading: (loading: boolean) => void
}

type AuthStore = AuthState & AuthActions

// Mock user generator for demo purposes
const createMockUser = (role: UserRole): User => ({
  id: `${role}-${Date.now()}`,
  role,
  created_at: new Date().toISOString(),
})

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      role: null,
      isLoading: false,
      isAuthenticated: false,

      // Actions
      setUser: (user) =>
        set({
          user,
          role: user?.role ?? null,
          isAuthenticated: !!user,
        }),

      setRole: (role) => set({ role }),

      // Mock login for demo/testing (will be replaced with Supabase auth)
      login: (role) => {
        const mockUser = createMockUser(role)
        set({
          user: mockUser,
          role,
          isAuthenticated: true,
          isLoading: false,
        })
      },

      logout: () =>
        set({
          user: null,
          role: null,
          isAuthenticated: false,
        }),

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'campus-pulse-auth',
      partialize: (state) => ({
        user: state.user,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// Selector hooks for common patterns
export const useUser = () => useAuthStore((state) => state.user)
export const useRole = () => useAuthStore((state) => state.role)
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated)
export const useIsStudent = () => useAuthStore((state) => state.role === 'student')
export const useIsAdmin = () => useAuthStore((state) => state.role === 'admin')
