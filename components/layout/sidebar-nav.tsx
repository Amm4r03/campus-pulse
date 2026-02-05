'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  badge?: string | number
  /** When true, badge uses muted styling (e.g. for spam count) */
  badgeMuted?: boolean
}

interface NavGroup {
  label: string
  items: NavItem[]
}

interface SidebarNavProps {
  items?: NavItem[]
  groups?: NavGroup[]
  collapsed?: boolean
}

export function SidebarNav({ items, groups, collapsed = false }: SidebarNavProps) {
  const pathname = usePathname()

  const renderNavItem = (item: NavItem) => {
    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
          isActive
            ? 'bg-background text-foreground shadow-sm border border-border'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          collapsed && 'justify-center px-2'
        )}
      >
        <item.icon className="h-4 w-4 flex-shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1">{item.label}</span>
            {item.badge != null && item.badge !== '' && (
              <span
                className={cn(
                  'ml-auto text-xs font-medium px-2 py-0.5 rounded-full',
                  item.badgeMuted
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-destructive/10 text-destructive font-bold'
                )}
              >
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    )
  }

  // If groups are provided, render grouped navigation
  if (groups && groups.length > 0) {
    return (
      <nav className="flex flex-col gap-6">
        {groups.map((group, index) => (
          <div key={index}>
            {!collapsed && (
              <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {group.label}
              </p>
            )}
            <div className="flex flex-col gap-1">
              {group.items.map(renderNavItem)}
            </div>
          </div>
        ))}
      </nav>
    )
  }

  // Fallback to flat items list
  return (
    <nav className="flex flex-col gap-1">
      {items?.map(renderNavItem)}
    </nav>
  )
}
