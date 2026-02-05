/**
 * GET /api/issues/admin/spam
 * List reports classified as spam (for admin review). Excludes admin-marked "not spam".
 */

import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { supabaseAdmin, Tables } from '@/lib/db'
import { logResponse } from '@/lib/api-logger'

const PATH = '/api/issues/admin/spam'

function isSpamRow(raw: { raw_model_output?: unknown }): boolean {
  const r = raw?.raw_model_output as Record<string, unknown> | undefined
  if (!r) return false
  if (r.admin_marked_not_spam === true || r.admin_marked_not_spam === 'true') return false
  const reportType = r.report_type as string | undefined
  const spamConf = typeof r.spam_confidence === 'number' ? r.spam_confidence : parseFloat(String(r.spam_confidence || 0))
  return reportType === 'SPAM' || spamConf >= 0.8
}

export async function GET() {
  try {
    const { error: authError } = await requireAdmin()
    if (authError) {
      const res = { success: false, error: { code: authError.code, message: authError.message } }
      logResponse('GET', PATH, authError.status, res)
      return NextResponse.json(res, { status: authError.status })
    }

    const { data: metaRows, error: metaError } = await supabaseAdmin
      .from(Tables.AUTOMATION_METADATA)
      .select('issue_report_id, raw_model_output')

    if (metaError) {
      console.error('[API] spam list metadata failed:', metaError)
      const res = { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch spam list' } }
      logResponse('GET', PATH, 500, res)
      return NextResponse.json(res, { status: 500 })
    }

    const spamReportIds = (metaRows ?? [])
      .filter((row: { raw_model_output?: unknown }) => isSpamRow(row))
      .map((row: { issue_report_id: string }) => row.issue_report_id)

    if (spamReportIds.length === 0) {
      const res = { success: true, data: { items: [], count: 0 } }
      logResponse('GET', PATH, 200, res)
      return NextResponse.json(res)
    }

    const { data: reports, error: reportsError } = await supabaseAdmin
      .from(Tables.ISSUE_REPORTS)
      .select(`
        id,
        title,
        description,
        created_at,
        category_id,
        location_id,
        issue_categories ( name ),
        locations ( name )
      `)
      .in('id', spamReportIds)
      .order('created_at', { ascending: false })

    if (reportsError) {
      console.error('[API] spam list reports failed:', reportsError)
      const res = { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch reports' } }
      logResponse('GET', PATH, 500, res)
      return NextResponse.json(res, { status: 500 })
    }

    const metaByReport = new Map(
      (metaRows ?? []).filter((r: { raw_model_output?: unknown }) => isSpamRow(r)).map((r: { issue_report_id: string; raw_model_output?: unknown }) => [r.issue_report_id, r.raw_model_output as Record<string, unknown>])
    )

    const first = (x: unknown): { name?: string } | null =>
      Array.isArray(x) ? (x[0] as { name?: string } | null) : (x as { name?: string } | null) ?? null
    const items = (reports ?? []).map((r: any) => {
      const raw = metaByReport.get(r.id) || {}
      return {
        id: r.id,
        title: r.title,
        description: r.description?.slice(0, 200) ?? '',
        created_at: r.created_at,
        category_name: first(r.issue_categories)?.name ?? '—',
        location_name: first(r.locations)?.name ?? '—',
        report_type: raw.report_type ?? 'SPAM',
        spam_confidence: typeof raw.spam_confidence === 'number' ? raw.spam_confidence : 0,
      }
    })

    const res = { success: true, data: { items, count: items.length } }
    logResponse('GET', PATH, 200, { ...res, data: { ...res.data, items: res.data.items.length } })
    return NextResponse.json(res)
  } catch (err) {
    console.error('[API] spam list error:', err)
    const res = { success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } }
    logResponse('GET', PATH, 500, res)
    return NextResponse.json(res, { status: 500 })
  }
}
