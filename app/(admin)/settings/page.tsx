'use client'

import { User, Bell, Shield } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your admin preferences
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your account preferences
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Account settings will be available after Supabase auth integration.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Configure how you receive notifications
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Notification settings will be available in a future update.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Security</CardTitle>
                <CardDescription>
                  Security and privacy settings
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Security settings will be available after Supabase auth integration.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
