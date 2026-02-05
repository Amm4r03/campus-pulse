'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { 
  LayoutDashboard, 
  LogOut,
  Menu,
  X,
  Home,
  Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SidebarNav } from '@/components/layout/sidebar-nav'
import { useAuthStore, useUIStore } from '@/stores'
import { cn } from '@/lib/utils'

const adminNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isAuthenticated, role, logout } = useAuthStore()
  const { sidebarOpen, setSidebarOpen } = useUIStore()

  // Redirect if not authenticated or not an admin
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    } else if (role === 'student') {
      router.push('/submit')
    }
  }, [isAuthenticated, role, router])

  // Don't render if not authenticated
  if (!isAuthenticated || role !== 'admin') {
    return null
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar - Desktop */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r bg-background md:flex',
          !sidebarOpen && 'md:w-16'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">C</span>
            </div>
            {sidebarOpen && (
              <span className="text-lg font-semibold">
                Campus<span className="text-primary">Pulse</span>
              </span>
            )}
          </Link>
        </div>

        {/* Admin Badge */}
        {sidebarOpen && (
          <div className="border-b px-4 py-2">
            <div className="rounded-md bg-primary/10 px-3 py-1.5 text-center text-xs font-medium text-primary">
              Admin Panel
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4">
          <SidebarNav items={adminNavItems} />
        </div>

        {/* Footer */}
        <div className="border-t p-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {sidebarOpen && 'Logout'}
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden',
          sidebarOpen ? 'block' : 'hidden'
        )}
        onClick={() => setSidebarOpen(false)}
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 flex-col border-r bg-background transition-transform md:hidden',
          sidebarOpen ? 'flex translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">C</span>
            </div>
            <span className="text-lg font-semibold">
              Campus<span className="text-primary">Pulse</span>
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="border-b px-4 py-2">
          <div className="rounded-md bg-primary/10 px-3 py-1.5 text-center text-xs font-medium text-primary">
            Admin Panel
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <SidebarNav items={adminNavItems} />
        </div>
        <div className="border-t p-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col md:pl-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Home
            </Link>
          </Button>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
