/**
 * POST /api/issues/admin/spam/[reportId]/mark-not-spam
 * Mark a report as not spam (admin correction for training data).
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { supabaseAdmin, Tables } from '@/lib/db'
import { logResponse } from '@/lib/api-logger'

const PATH = '/api/issues/admin/spam/[reportId]/mark-not-spam'

interface RouteParams {
  params: Promise<{ reportId: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { error: authError } = await requireAdmin()
    if (authError) {
      const res = { success: false, error: { code: authError.code, message: authError.message } }
      logResponse('POST', PATH, authError.status, res)
      return NextResponse.json(res, { status: authError.status })
    }

    const { reportId } = await params
    if (!reportId) {
      const res = { success: false, error: { code: 'VALIDATION_ERROR', message: 'reportId required' } }
      logResponse('POST', PATH, 400, res)
      return NextResponse.json(res, { status: 400 })
    }

    const { data: meta, error: fetchError } = await supabaseAdmin
      .from(Tables.AUTOMATION_METADATA)
      .select('id, raw_model_output')
      .eq('issue_report_id', reportId)
      .single()

    if (fetchError || !meta) {
      const res = { success: false, error: { code: 'NOT_FOUND', message: 'Report or metadata not found' } }
      logResponse('POST', PATH, 404, res)
      return NextResponse.json(res, { status: 404 })
    }

    const raw = (meta.raw_model_output as Record<string, unknown>) ?? {}
    const updatedRaw = {
      ...raw,
      report_type: 'GENERAL',
      spam_confidence: 0,
      admin_marked_not_spam: true,
      admin_marked_not_spam_at: new Date().toISOString(),
    }

    const { error: updateError } = await supabaseAdmin
      .from(Tables.AUTOMATION_METADATA)
      .update({ raw_model_output: updatedRaw })
      .eq('issue_report_id', reportId)

    if (updateError) {
      console.error('[API] mark-not-spam update failed:', updateError)
      const res = { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update' } }
      logResponse('POST', PATH, 500, res)
      return NextResponse.json(res, { status: 500 })
    }

    const res = { success: true, data: { issue_report_id: reportId } }
    logResponse('POST', PATH, 200, res)
    return NextResponse.json(res)
  } catch (err) {
    console.error('[API] mark-not-spam error:', err)
    const res = { success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } }
    logResponse('POST', PATH, 500, res)
    return NextResponse.json(res, { status: 500 })
  }
}
