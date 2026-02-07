/**
 * GET /api/authorities
 * List all authorities (for admin assign dropdown)
 */

import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { supabaseAdmin, Tables } from '@/lib/db'
import { logResponse } from '@/lib/api-logger'

const PATH = '/api/authorities'

export async function GET() {
  try {
    const { error: authError } = await requireAdmin()
    if (authError) {
      const res = { success: false, error: { code: authError.code, message: authError.message } }
      logResponse('GET', PATH, authError.status, res)
      return NextResponse.json(res, { status: authError.status })
    }

    const { data, error } = await supabaseAdmin
      .from(Tables.AUTHORITIES)
      .select('id, name, description')
      .order('name')

    if (error) {
      console.error('[API] authorities fetch failed:', error)
      const res = { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch authorities' } }
      logResponse('GET', PATH, 500, res)
      return NextResponse.json(res, { status: 500 })
    }

    const res = { success: true, data: data ?? [] }
    logResponse('GET', PATH, 200, res)
    return NextResponse.json(res)
  } catch (err) {
    console.error('[API] authorities error:', err)
    const res = { success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } }
    logResponse('GET', PATH, 500, res)
    return NextResponse.json(res, { status: 500 })
  }
}
