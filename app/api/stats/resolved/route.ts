/**
 * GET /api/stats/resolved
 * Returns resolved-issue counts from the database (status flag, no deletion).
 * For analytics and "Issues closed" / "Resolved Today" dashboard stats.
 */

import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { supabaseAdmin, Tables } from '@/lib/db'
import { logResponse } from '@/lib/api-logger'

const PATH = '/api/stats/resolved'

export async function GET() {
  try {
    const { error: authError } = await requireAdmin()
    if (authError) {
      const res = { success: false, error: { code: authError.code, message: authError.message } }
      logResponse('GET', PATH, authError.status, res)
      return NextResponse.json(res, { status: authError.status })
    }

    // Total resolved (all time) – we keep resolved issues, only status is set
    const { count: resolvedCount, error: countError } = await supabaseAdmin
      .from(Tables.AGGREGATED_ISSUES)
      .select('*', { count: 'exact', head: true })
      .eq('status', 'resolved')

    if (countError) {
      console.error('[API] resolved count failed:', countError)
      const res = { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch stats' } }
      logResponse('GET', PATH, 500, res)
      return NextResponse.json(res, { status: 500 })
    }

    // Resolved today: updated_at >= start of today (UTC)
    const todayStart = new Date()
    todayStart.setUTCHours(0, 0, 0, 0)
    const todayStartIso = todayStart.toISOString()

    const { count: resolvedTodayCount, error: todayError } = await supabaseAdmin
      .from(Tables.AGGREGATED_ISSUES)
      .select('*', { count: 'exact', head: true })
      .eq('status', 'resolved')
      .gte('updated_at', todayStartIso)

    if (todayError) {
      console.error('[API] resolved today count failed:', todayError)
    }

    const res = {
      success: true,
      data: {
        resolved_count: resolvedCount ?? 0,
        resolved_today_count: todayError ? 0 : (resolvedTodayCount ?? 0),
      },
    }
    logResponse('GET', PATH, 200, res)
    return NextResponse.json(res)
  } catch (err) {
    console.error('[API] resolved stats error:', err)
    const res = { success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } }
    logResponse('GET', PATH, 500, res)
    return NextResponse.json(res, { status: 500 })
  }
}
