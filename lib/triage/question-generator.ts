/**
 * Template-based smart question generation for incomplete reports.
 */

import { QUESTION_TEMPLATES } from './question-templates'
import type { SmartQuestion, SmartQuestionsOutput } from './smart-questions-types'

const MIN_DESCRIPTION_LENGTH = 30
const MAX_QUESTIONS = 4
const MIN_QUESTIONS_IF_MISSING = 2

/**
 * Generate 2–4 follow-up questions based on missing fields and report context.
 * categoryName: slug or display name (e.g. 'wifi', 'Water Supply') for template lookup.
 */
export function generateQuestionsForReport(
  title: string,
  description: string,
  categoryName: string | null,
  _locationId: string | null
): SmartQuestionsOutput {
  const missingFields: string[] = []
  if (!categoryName || categoryName.trim() === '') missingFields.push('category')
  if (!_locationId || _locationId.trim() === '') missingFields.push('location')
  if (!description || description.trim().length < MIN_DESCRIPTION_LENGTH) missingFields.push('description')

  if (missingFields.length === 0) {
    return {
      questions: [],
      enrichedDescription: description,
      priorityHint: 'NORMAL',
      estimatedTime: 0,
    }
  }

  const titleLower = title.toLowerCase().trim()
  const categorySlug = categoryName?.toLowerCase().trim() ?? ''

  let questionCategory = 'default'
  if (
    titleLower.includes('wifi') || titleLower.includes('internet') ||
    categorySlug.includes('wifi') || categorySlug.includes('internet')
  ) {
    questionCategory = 'wifi'
  } else if (
    titleLower.includes('water') || titleLower.includes('leak') ||
    categorySlug.includes('water')
  ) {
    questionCategory = 'water'
  } else if (
    titleLower.includes('electric') || titleLower.includes('power') || titleLower.includes(' ac ') ||
    categorySlug.includes('electric')
  ) {
    questionCategory = 'electricity'
  } else if (
    titleLower.includes('safe') || titleLower.includes('security') || titleLower.includes('theft') || titleLower.includes('harassment') ||
    categorySlug.includes('safety')
  ) {
    questionCategory = 'safety'
  } else if (
    titleLower.includes('hostel') || titleLower.includes('room') ||
    categorySlug.includes('hostel')
  ) {
    questionCategory = 'hostel'
  }

  const template = QUESTION_TEMPLATES[questionCategory] ?? QUESTION_TEMPLATES.default
  const selected: SmartQuestion[] = []

  if (missingFields.includes('description')) {
    const durationQ = template.find((q) => q.id.includes('duration'))
    if (durationQ) selected.push({ ...durationQ, id: `q_${durationQ.id}` })
  }

  const impactQ = template.find((q) => q.id.includes('impact') || q.id.includes('scope') || q.id.includes('affect') || q.id.includes('essential'))
  if (impactQ && !selected.some((s) => s.id === `q_${impactQ.id}`) && selected.length < MAX_QUESTIONS) {
    selected.push({ ...impactQ, id: `q_${impactQ.id}` })
  }

  if (questionCategory !== 'safety' && selected.length < MAX_QUESTIONS) {
    const reportedQ = template.find((q) => q.id.includes('reported'))
    if (reportedQ && !selected.some((s) => s.id === `q_${reportedQ.id}`)) {
      selected.push({ ...reportedQ, id: `q_${reportedQ.id}` })
    }
  }

  if (questionCategory === 'safety') {
    const safetyQ = template.find((q) => q.id.includes('safety_status'))
    if (safetyQ) {
      selected.unshift({ ...safetyQ, id: `q_${safetyQ.id}` })
    }
  }

  if (questionCategory === 'safety') {
    const locationQ = template.find((q) => q.id.includes('safety_location'))
    if (locationQ && !selected.some((s) => s.id === `q_${locationQ.id}`) && selected.length < MAX_QUESTIONS) {
      selected.push({ ...locationQ, id: `q_${locationQ.id}` })
    }
  }

  while (selected.length < MIN_QUESTIONS_IF_MISSING && template.length > 0) {
    const next = template.find((q) => !selected.some((s) => s.id === `q_${q.id}`))
    if (!next) break
    selected.push({ ...next, id: `q_${next.id}` })
  }

  const priorityHint = titleLower.includes('unsafe') || titleLower.includes('danger') || titleLower.includes('help now')
    ? 'URGENCY'
    : 'NORMAL'

  return {
    questions: selected.slice(0, MAX_QUESTIONS),
    enrichedDescription: description?.trim() || `Issue: ${title}`,
    priorityHint,
    estimatedTime: Math.max(selected.length * 3, 6),
  }
}

/**
 * Build enriched description from original + answers (call after user submits answers).
 */
export function buildEnrichedDescription(
  title: string,
  originalDescription: string,
  answers: Record<string, string>,
  questions: SmartQuestion[]
): string {
  const parts: string[] = []
  for (const q of questions) {
    const a = answers[q.id]?.trim()
    if (a) parts.push(`${q.text}: ${a}`)
  }
  if (parts.length === 0) return originalDescription?.trim() || `Issue: ${title}`
  const additional = `Additional details:\n${parts.join('\n')}`
  if (originalDescription?.trim()) return `${originalDescription.trim()}\n\n${additional}`
  return `Issue: ${title}\n\n${additional}`
}
