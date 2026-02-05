'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

interface SidebarNavProps {
  items: NavItem[]
}

export function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
