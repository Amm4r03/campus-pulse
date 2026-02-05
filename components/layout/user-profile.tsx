'use client'

import { User } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuthStore } from '@/stores'
import { cn } from '@/lib/utils'

interface UserProfileProps {
  collapsed?: boolean
  className?: string
}

export function UserProfile({ collapsed = false, className }: UserProfileProps) {
  const { user, role } = useAuthStore()
  
  const displayName = role === 'admin' ? 'System Admin' : 'Student User'
  const email = role === 'admin' 
    ? 'admin@jamiahamdard.edu' 
    : 'student@jamiahamdard.edu'
  const initials = role === 'admin' ? 'SA' : 'SU'

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Avatar className="h-9 w-9 border border-border">
        <AvatarFallback className="bg-muted text-xs font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
      {!collapsed && (
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{displayName}</p>
          <p className="text-xs text-muted-foreground truncate">{email}</p>
        </div>
      )}
    </div>
  )
}
