'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, LogIn, User, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStore, useUIStore } from '@/stores'
import { cn } from '@/lib/utils'

const publicNavLinks = [
  { href: '/', label: 'Home' },
  { href: '/#features', label: 'Features' },
  { href: '/#how-it-works', label: 'How It Works' },
]

export function Navbar() {
  const pathname = usePathname()
  const { isAuthenticated, role, logout } = useAuthStore()
  const { mobileMenuOpen, setMobileMenuOpen } = useUIStore()

  const getDashboardLink = () => {
    if (role === 'admin') return '/dashboard'
    return '/submit'
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground">C</span>
          </div>
          <span className="text-xl font-semibold tracking-tight">
            Campus<span className="text-primary">Pulse</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center md:gap-6">
          {publicNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                pathname === link.href
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Auth Section */}
        <div className="hidden md:flex md:items-center md:gap-4">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="capitalize">{role}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href={getDashboardLink()}>Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/login">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
          <span className="sr-only">Toggle menu</span>
        </Button>
      </nav>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="border-t md:hidden">
          <div className="container mx-auto space-y-4 px-4 py-4">
            {publicNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'block text-sm font-medium transition-colors hover:text-primary',
                  pathname === link.href
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t pt-4">
              {isAuthenticated ? (
                <div className="space-y-2">
                  <Link
                    href={getDashboardLink()}
                    className="block text-sm font-medium text-muted-foreground hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      logout()
                      setMobileMenuOpen(false)
                    }}
                    className="block text-sm font-medium text-destructive"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      Login
                    </Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      Get Started
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
