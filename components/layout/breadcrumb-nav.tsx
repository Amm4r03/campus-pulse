'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href?: string
}

// Map routes to breadcrumb labels
const routeLabels: Record<string, string> = {
  '': 'Home',
  'dashboard': 'Dashboard',
  'issues': 'Issues',
  'submit': 'Submit Issue',
  'profile': 'Profile',
  'settings': 'Settings',
}

export function BreadcrumbNav({ className }: { className?: string }) {
  const pathname = usePathname()
  
  // Generate breadcrumb items from pathname
  const pathSegments = pathname.split('/').filter(Boolean)
  
  const breadcrumbs: BreadcrumbItem[] = pathSegments.map((segment, index) => {
    const href = '/' + pathSegments.slice(0, index + 1).join('/')
    // Handle dynamic segments like [id]
    const isId = segment.match(/^[a-zA-Z0-9-]+$/) && !routeLabels[segment]
    const label = isId ? `#${segment.slice(0, 8)}...` : routeLabels[segment] || segment
    
    return { label, href }
  })

  // Don't show breadcrumb on home page
  if (pathname === '/' || pathname === '') {
    return null
  }

  return (
    <nav className={cn("flex items-center gap-1 text-sm", className)}>
      <Link 
        href="/" 
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center gap-1">
          <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
          {index === breadcrumbs.length - 1 ? (
            <span className="font-medium text-foreground">{item.label}</span>
          ) : (
            <Link 
              href={item.href || '#'} 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}
