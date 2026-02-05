'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { 
  PlusCircle, 
  FileText, 
  User, 
  LogOut,
  Menu,
  X,
  Home,
  Bell,
  Search,
  Compass
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SidebarNav, BreadcrumbNav, UserProfile } from '@/components/layout'
import { useAuthStore, useUIStore } from '@/stores'
import { cn } from '@/lib/utils'

const studentNavGroups = [
  {
    label: 'Main Menu',
    items: [
      { href: '/submit', label: 'Submit Issue', icon: PlusCircle },
      { href: '/track', label: 'Track Issues', icon: Compass },
      { href: '/issues', label: 'My Issues', icon: FileText },
    ],
  },
  {
    label: 'Account',
    items: [
      { href: '/profile', label: 'Profile', icon: User },
    ],
  },
]

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isAuthenticated, role, logout } = useAuthStore()
  const { sidebarOpen, setSidebarOpen } = useUIStore()

  // Redirect if not authenticated or not a student
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    } else if (role === 'admin') {
      router.push('/dashboard')
    }
  }, [isAuthenticated, role, router])

  // Don't render if not authenticated
  if (!isAuthenticated || role !== 'student') {
    return null
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar - Desktop */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r bg-sidebar md:flex',
          !sidebarOpen && 'md:w-16'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <span className="text-lg font-bold text-primary-foreground">CP</span>
            </div>
            {sidebarOpen && (
              <div>
                <span className="text-sm font-bold tracking-tight">Campus Pulse</span>
                <p className="text-[10px] text-muted-foreground">Jamia Hamdard</p>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4">
          <SidebarNav groups={studentNavGroups} collapsed={!sidebarOpen} />
        </div>

        {/* Footer with User Profile */}
        <div className="border-t p-4 space-y-4">
          <UserProfile collapsed={!sidebarOpen} />
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10",
              sidebarOpen ? "justify-start" : "justify-center"
            )}
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            {sidebarOpen && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden',
          sidebarOpen ? 'block' : 'hidden'
        )}
        onClick={() => setSidebarOpen(false)}
      />
      
      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 flex-col border-r bg-sidebar transition-transform md:hidden',
          sidebarOpen ? 'flex translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <span className="text-lg font-bold text-primary-foreground">CP</span>
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight">Campus Pulse</span>
              <p className="text-[10px] text-muted-foreground">Jamia Hamdard</p>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <SidebarNav groups={studentNavGroups} />
        </div>
        <div className="border-t p-4 space-y-4">
          <UserProfile />
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={cn(
        "flex flex-1 flex-col",
        sidebarOpen ? "md:pl-64" : "md:pl-16"
      )}>
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
          
          {/* Breadcrumb */}
          <BreadcrumbNav className="hidden md:flex" />
          
          <div className="flex-1" />
          
          {/* Header Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            </Button>
            <div className="h-6 w-px bg-border mx-1 hidden sm:block" />
            <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Home
              </Link>
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
