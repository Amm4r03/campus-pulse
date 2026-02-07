/**
 * GET /api/stats/locations/most-reported
 * Returns the location name with the highest report count (for admin dashboard).
 */

import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { supabaseAdmin, Views } from '@/lib/db'
import { logResponse } from '@/lib/api-logger'

const PATH = '/api/stats/locations/most-reported'

export async function GET() {
  try {
    const { error: authError } = await requireAdmin()
    if (authError) {
      const res = { success: false, error: { code: authError.code, message: authError.message } }
      logResponse('GET', PATH, authError.status, res)
      return NextResponse.json(res, { status: authError.status })
    }

    const { data: rows, error } = await supabaseAdmin
      .from(Views.AGGREGATED_ISSUES_DASHBOARD)
      .select('location_name, total_reports')

    if (error) {
      console.error('[API] most-reported location failed:', error)
      const res = { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch stats' } }
      logResponse('GET', PATH, 500, res)
      return NextResponse.json(res, { status: 500 })
    }

    // Sum reports by location; view has one row per aggregated issue
    const byLocation = (rows ?? []).reduce<Record<string, number>>((acc, row) => {
      const name = row.location_name ?? '—'
      acc[name] = (acc[name] ?? 0) + (Number(row.total_reports) || 0)
      return acc
    }, {})
    const entries = Object.entries(byLocation)
    const top = entries.length
      ? entries.reduce((a, b) => (a[1] >= b[1] ? a : b))
      : (['—', 0] as [string, number])
    const location = top[0]
    const totalReports = top[1]
    const res = { success: true, location, total_reports: totalReports }
    logResponse('GET', PATH, 200, res)
    return NextResponse.json(res)
  } catch (err) {
    console.error('[API] most-reported error:', err)
    const res = { success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } }
    logResponse('GET', PATH, 500, res)
    return NextResponse.json(res, { status: 500 })
  }
}
