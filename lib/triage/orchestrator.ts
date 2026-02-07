/**
 * Parallel triage orchestrator: spam check, location, and urgency in parallel
 * with optional LLM enhancement and fallbacks.
 */

import { checkSpamNSFW } from './spam-check';
import { extractLocationFast, extractLocationWithLLM } from './location-extractor';
import { assessUrgencyFast, assessUrgencyWithLLM } from './urgency-assessor';
import type { AutomationOutput, UrgencyLevel, ReportType } from '@/domain/types';

const VALID_CATEGORIES = [
  'wifi', 'water', 'sanitation', 'electricity', 'hostel', 'academics', 'safety', 'food', 'infrastructure',
] as const;

export interface PipelineInput {
  title: string;
  description: string;
  availableLocations: Array<{ id: string; name: string }>;
  availableCategories: Array<{ id: string; name: string }>;
}

export interface PipelineResult {
  spamCheck: { isSpam: boolean; isNsfw: boolean; confidence: number };
  locationExtraction: { locationName: string; categoryName: string; confidence: number };
  urgencyAssessment: {
    urgencyScore: number;
    urgencyLevel: string;
    reporterWelfareFlag: boolean;
    requiresImmediateAction: boolean;
  };
  fullAnalysisNeeded: boolean;
  automationOutput: AutomationOutput;
}

/** Normalize category name to valid slug. */
function toValidCategory(name: string): string {
  const slug = name.toLowerCase().trim();
  if ((VALID_CATEGORIES as readonly string[]).includes(slug)) return slug;
  if (slug.includes('wifi') || slug.includes('internet')) return 'wifi';
  if (slug.includes('water')) return 'water';
  if (slug.includes('electric') || slug.includes('power')) return 'electricity';
  if (slug.includes('sanitation') || slug.includes('clean')) return 'sanitation';
  if (slug.includes('hostel')) return 'hostel';
  if (slug.includes('academic') || slug.includes('exam')) return 'academics';
  if (slug.includes('safety') || slug.includes('security')) return 'safety';
  if (slug.includes('food') || slug.includes('canteen') || slug.includes('mess')) return 'food';
  return 'infrastructure';
}

/** Run parallel triage (spam + fast location + fast urgency), then optional LLM enhancement. */
export async function runParallelTriage(input: PipelineInput): Promise<PipelineResult> {
  const { title, description, availableLocations, availableCategories } = input;
  const titleSnippet = title.slice(0, 50) + (title.length > 50 ? '...' : '');

  console.log('[LLM] Triage: starting parallel (spam + fast location + fast urgency)', { titleSnippet });
  const startMs = Date.now();

  const [spamResult, fastLocation, fastUrgency] = await Promise.all([
    checkSpamNSFW(title, description),
    Promise.resolve(extractLocationFast(title, description)),
    Promise.resolve(assessUrgencyFast(title, description)),
  ]);

  const fastElapsed = Date.now() - startMs;
  console.log('[LLM] Triage: fast phase done', {
    titleSnippet,
    spam: spamResult.isSpam,
    spamConfidence: spamResult.confidence,
    locationConfidence: fastLocation.confidence,
    urgencyScore: fastUrgency.urgencyScore,
    urgencyLevel: fastUrgency.urgencyLevel,
    elapsedMs: fastElapsed,
  });

  const needsLocationLLM = fastLocation.confidence < 0.6;
  const needsUrgencyLLM = fastUrgency.urgencyScore < 0.5 && !spamResult.isSpam;
  if (needsLocationLLM || needsUrgencyLLM) {
    console.log('[LLM] Triage: invoking LLM enhancement', {
      titleSnippet,
      needsLocationLLM,
      needsUrgencyLLM,
    });
  }

  const [llmLocation, llmUrgency] = await Promise.all([
    needsLocationLLM
      ? extractLocationWithLLM(title, description, availableLocations, availableCategories)
      : Promise.resolve(null),
    needsUrgencyLLM ? assessUrgencyWithLLM(title, description) : Promise.resolve(null),
  ]);

  const finalLocation = llmLocation ?? fastLocation;
  const finalUrgency = llmUrgency ?? fastUrgency;

  const fullAnalysisNeeded =
    !spamResult.isSpam &&
    !spamResult.isNsfw &&
    (finalLocation.confidence < 0.8 || finalUrgency.urgencyScore >= 0.7);

  const categorySlug = toValidCategory(finalLocation.categoryName);
  const environmentalCategories = ['water', 'electricity', 'sanitation', 'infrastructure'];
  const confidenceScore = Math.min(
    1,
    spamResult.confidence,
    finalLocation.confidence,
    1 - Math.abs(finalUrgency.urgencyScore - 0.5) * 0.5
  );

  const automationOutput: AutomationOutput = {
    extracted_category: categorySlug,
    urgency_score: finalUrgency.urgencyScore,
    impact_scope: 'single',
    environmental_flag: environmentalCategories.includes(categorySlug),
    confidence_score: confidenceScore,
    reasoning: `Fast triage: spam=${spamResult.isSpam}, location=${finalLocation.confidence.toFixed(2)}, urgency=${finalUrgency.urgencyScore.toFixed(2)}`,
    urgency_level: finalUrgency.urgencyLevel as UrgencyLevel,
    report_type: (spamResult.isSpam ? 'SPAM' : 'GENERAL') as ReportType,
    reporter_welfare_flag: finalUrgency.reporterWelfareFlag,
    requires_immediate_action: finalUrgency.requiresImmediateAction,
    spam_confidence: spamResult.confidence,
    context_validity: 'VALID',
  };

  const totalElapsed = Date.now() - startMs;
  console.log('[LLM] Triage: complete', {
    titleSnippet,
    category: categorySlug,
    locationName: finalLocation.locationName,
    urgencyLevel: finalUrgency.urgencyLevel,
    reportType: spamResult.isSpam ? 'SPAM' : 'GENERAL',
    fullAnalysisNeeded,
    totalElapsedMs: totalElapsed,
  });

  return {
    spamCheck: {
      isSpam: spamResult.isSpam,
      isNsfw: spamResult.isNsfw,
      confidence: spamResult.confidence,
    },
    locationExtraction: {
      locationName: finalLocation.locationName,
      categoryName: finalLocation.categoryName,
      confidence: finalLocation.confidence,
    },
    urgencyAssessment: {
      urgencyScore: finalUrgency.urgencyScore,
      urgencyLevel: finalUrgency.urgencyLevel,
      reporterWelfareFlag: finalUrgency.reporterWelfareFlag,
      requiresImmediateAction: finalUrgency.requiresImmediateAction,
    },
    fullAnalysisNeeded,
    automationOutput,
  };
}

/** Ultra-fast path for emergency submissions (spam + heuristic urgency only). */
export async function runEmergencyTriage(
  title: string,
  description: string
): Promise<PipelineResult> {
  const [spam, urgency] = await Promise.all([
    checkSpamNSFW(title, description),
    Promise.resolve(assessUrgencyFast(title, description)),
  ]);

  const automationOutput: AutomationOutput = {
    extracted_category: 'safety',
    urgency_score: urgency.urgencyScore,
    impact_scope: 'single',
    environmental_flag: false,
    confidence_score: 0.6,
    reasoning: 'Emergency triage - fast path',
    urgency_level: urgency.urgencyLevel as UrgencyLevel,
    report_type: 'EMERGENCY' as ReportType,
    reporter_welfare_flag: urgency.reporterWelfareFlag,
    requires_immediate_action: urgency.requiresImmediateAction,
    spam_confidence: spam.confidence,
    context_validity: 'VALID',
  };

  return {
    spamCheck: { isSpam: spam.isSpam, isNsfw: spam.isNsfw, confidence: spam.confidence },
    locationExtraction: { locationName: '', categoryName: 'safety', confidence: 0.5 },
    urgencyAssessment: {
      urgencyScore: urgency.urgencyScore,
      urgencyLevel: urgency.urgencyLevel,
      reporterWelfareFlag: urgency.reporterWelfareFlag,
      requiresImmediateAction: urgency.requiresImmediateAction,
    },
    fullAnalysisNeeded: urgency.urgencyScore >= 0.8,
    automationOutput,
  };
}

function createMinimalFallback(input: PipelineInput): PipelineResult {
  const fastLocation = extractLocationFast(input.title, input.description);
  const fastUrgency = assessUrgencyFast(input.title, input.description);
  const categorySlug = toValidCategory(fastLocation.categoryName);
  return {
    spamCheck: { isSpam: false, isNsfw: false, confidence: 0 },
    locationExtraction: {
      locationName: fastLocation.locationName,
      categoryName: fastLocation.categoryName,
      confidence: fastLocation.confidence,
    },
    urgencyAssessment: {
      urgencyScore: fastUrgency.urgencyScore,
      urgencyLevel: fastUrgency.urgencyLevel,
      reporterWelfareFlag: fastUrgency.reporterWelfareFlag,
      requiresImmediateAction: fastUrgency.requiresImmediateAction,
    },
    fullAnalysisNeeded: true,
    automationOutput: {
      extracted_category: categorySlug,
      urgency_score: fastUrgency.urgencyScore,
      impact_scope: 'single',
      environmental_flag: ['water', 'electricity', 'sanitation', 'infrastructure'].includes(categorySlug),
      confidence_score: 0.3,
      reasoning: 'Fallback: heuristic only',
      urgency_level: fastUrgency.urgencyLevel as UrgencyLevel,
      report_type: 'GENERAL',
      reporter_welfare_flag: fastUrgency.reporterWelfareFlag,
      requires_immediate_action: fastUrgency.requiresImmediateAction,
      spam_confidence: 0,
      context_validity: 'VALID',
    },
  };
}

/** Run parallel triage with fallbacks; never throws. */
export async function runRobustTriage(input: PipelineInput): Promise<PipelineResult> {
  const titleSnippet = input.title.slice(0, 50) + (input.title.length > 50 ? '...' : '');
  try {
    return await runParallelTriage(input);
  } catch (error) {
    console.warn('[LLM] Triage: parallel triage failed, using fallback', {
      titleSnippet,
      error: error instanceof Error ? error.message : String(error),
    });
    try {
      return createMinimalFallback(input);
    } catch {
      return {
        spamCheck: { isSpam: false, isNsfw: false, confidence: 0 },
        locationExtraction: { locationName: '', categoryName: 'infrastructure', confidence: 0.2 },
        urgencyAssessment: {
          urgencyScore: 0.5,
          urgencyLevel: 'MEDIUM',
          reporterWelfareFlag: false,
          requiresImmediateAction: false,
        },
        fullAnalysisNeeded: true,
        automationOutput: {
          extracted_category: 'infrastructure',
          urgency_score: 0.5,
          impact_scope: 'single',
          environmental_flag: false,
          confidence_score: 0.1,
          reasoning: 'Emergency fallback - manual review required',
          urgency_level: 'MEDIUM',
          report_type: 'GENERAL',
          reporter_welfare_flag: false,
          requires_immediate_action: false,
          spam_confidence: 0,
          context_validity: 'VALID',
        },
      };
    }
  }
}
