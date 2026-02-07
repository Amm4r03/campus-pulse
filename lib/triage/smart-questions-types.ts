/**
 * Types for smart follow-up questions (incomplete report triage).
 */

export type QuestionType = 'select' | 'multi_select' | 'text' | 'yes_no'

export interface SmartQuestion {
  id: string
  text: string
  type: QuestionType
  suggestions: string[]
  required: boolean
  context?: string
  icon?: string
  placeholder?: string
}

export interface SmartQuestionsOutput {
  questions: SmartQuestion[]
  enrichedDescription: string
  priorityHint: 'URGENCY' | 'NORMAL' | 'LOW'
  estimatedTime: number
}
