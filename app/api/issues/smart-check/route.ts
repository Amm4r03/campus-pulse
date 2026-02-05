/**
 * POST /api/issues/smart-check
 * Check if a report needs follow-up questions (incomplete report).
 * Returns questions when category, location, or description is missing/short.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireStudent } from '@/lib/auth'
import { supabaseAdmin, Tables } from '@/lib/db'
import { generateQuestionsForReport } from '@/lib/triage/question-generator'
import { checkSpamNSFW } from '@/lib/triage/spam-check'
import { logResponse } from '@/lib/api-logger'

const PATH = '/api/issues/smart-check'

const MIN_DESCRIPTION_LENGTH = 30

export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await requireStudent()
    if (authError) {
      const res = { success: false, error: { code: authError.code, message: authError.message } }
      logResponse('POST', PATH, authError.status, res)
      return NextResponse.json(res, { status: authError.status })
    }

    const body = await request.json()
    const { title, description, category_id, location_id } = body

    if (!title || String(title).trim().length < 3) {
      const res = { success: false, error: { code: 'VALIDATION_ERROR', message: 'Title is required' } }
      logResponse('POST', PATH, 400, res)
      return NextResponse.json(res, { status: 400 })
    }

    const desc = description ? String(description).trim() : ''
    // Spam check first: never show quick-questions modal for content we classify as spam
    const spamResult = await checkSpamNSFW(String(title).trim(), desc)
    if (spamResult.isSpam || spamResult.isNsfw) {
      const message = spamResult.isNsfw
        ? 'This report cannot be submitted due to content policy.'
        : 'This looks like a test or spam. Please describe a real campus issue so we can help.'
      const res = { success: true, rejected_spam: true, message }
      logResponse('POST', PATH, 200, res)
      return NextResponse.json(res)
    }

    const hasCategory = !!category_id && String(category_id).trim() !== ''
    const hasLocation = !!location_id && String(location_id).trim() !== ''
    const hasEnoughDescription = desc.length >= MIN_DESCRIPTION_LENGTH

    const needsQuestions = !hasCategory || !hasLocation || !hasEnoughDescription

    if (!needsQuestions) {
      const res = { success: true, needs_questions: false }
      logResponse('POST', PATH, 200, res)
      return NextResponse.json(res)
    }

    let categoryName: string | null = null
    if (category_id) {
      const { data: cat } = await supabaseAdmin
        .from(Tables.ISSUE_CATEGORIES)
        .select('name')
        .eq('id', category_id)
        .single()
      categoryName = cat?.name ?? null
    }

    const result = generateQuestionsForReport(
      String(title).trim(),
      desc,
      categoryName,
      location_id ? String(location_id).trim() : null
    )

    if (result.questions.length === 0) {
      const res = { success: true, needs_questions: false }
      logResponse('POST', PATH, 200, res)
      return NextResponse.json(res)
    }

    const res = {
      success: true,
      needs_questions: true,
      questions: result.questions,
      enriched_description: result.enrichedDescription,
      priority_hint: result.priorityHint,
      estimated_time: result.estimatedTime,
    }
    logResponse('POST', PATH, 200, res)
    return NextResponse.json(res)
  } catch (err) {
    console.error('[smart-check]', err)
    const res = { success: false, error: { code: 'SERVER_ERROR', message: 'Smart check failed' } }
    logResponse('POST', PATH, 500, res)
    return NextResponse.json(res, { status: 500 })
  }
}
