/**
 * Full monolithic analysis (existing Gemini pipeline).
 * Used as optional enhancement when parallel triage flags fullAnalysisNeeded.
 */

import type { AutomationOutput } from '@/domain/types';
import { analyzeIssue } from '@/lib/gemini';

export async function runFullAnalysis(
  title: string,
  description: string
): Promise<AutomationOutput> {
  return analyzeIssue(title, description);
}
