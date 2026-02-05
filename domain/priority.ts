/**
 * Campus Pulse - Priority Calculation Logic
 * Final locked formula for judge-defensible priority scoring
 * 
 * Formula: Final Priority = R × C × 100
 * Where R = (U × 0.35) + (I × 0.30) + (F × 0.25) + (E × 0.10)
 */

import type { PriorityInput, PriorityBreakdown, ImpactScope } from './types';

/**
 * Priority calculation weights (sum = 1.0)
 * These weights are LOCKED and should not be changed
 */
const WEIGHTS = {
    URGENCY: 0.35,
    IMPACT: 0.30,
    FREQUENCY: 0.25,
    ENVIRONMENTAL: 0.10,
} as const;

/**
 * Impact scope base values
 */
const IMPACT_BASE = {
    SINGLE: 0.4,
    MULTI: 0.7,
} as const;

/**
 * Impact aggregation boost
 * +0.03 per additional linked report, capped so total I ≤ 1.0
 */
const IMPACT_BOOST_PER_REPORT = 0.03;

/**
 * Frequency scaling: reports / 10, capped at 1.0
 */
const FREQUENCY_DIVISOR = 10;

/**
 * Calculate the urgency component (0-0.35)
 * Based on automation-extracted urgency score
 * 
 * Examples:
 * - "WiFi slow" → 0.3 → component = 0.105
 * - "No water in hostel since morning" → 0.8 → component = 0.28
 * - "Electrical short circuit" → 0.95 → component = 0.3325
 */
export function calculateUrgencyComponent(urgencyScore: number): number {
    // Clamp urgency score between 0 and 1
    const clampedScore = Math.max(0, Math.min(1, urgencyScore));
    return clampedScore * WEIGHTS.URGENCY;
}

/**
 * Calculate the impact component (0-0.30)
 * Based on impact scope (single/multi) and report count
 * 
 * Formula:
 * - Base: single = 0.4, multi = 0.7
 * - Boost: +0.03 per additional report (beyond first)
 * - Total I capped at 1.0
 * - Component = I × 0.30
 */
export function calculateImpactComponent(
    impactScope: ImpactScope,
    reportCount: number
): number {
    // Base value from impact scope
    const base = impactScope === 'multi' ? IMPACT_BASE.MULTI : IMPACT_BASE.SINGLE;

    // Boost from additional reports (first report doesn't add boost)
    const additionalReports = Math.max(0, reportCount - 1);
    const boost = additionalReports * IMPACT_BOOST_PER_REPORT;

    // Total impact score, capped at 1.0
    const impactScore = Math.min(base + boost, 1.0);

    return impactScore * WEIGHTS.IMPACT;
}

/**
 * Calculate the frequency component (0-0.25)
 * Based on reports in the last 30 minutes
 * 
 * Formula: F = min(reports_last_30_minutes / 10, 1.0)
 * 
 * Interpretation:
 * - 1 report → 0.1 → component = 0.025
 * - 5 reports → 0.5 → component = 0.125
 * - ≥10 reports → 1.0 → component = 0.25 (max)
 */
export function calculateFrequencyComponent(reportsLast30Min: number): number {
    const frequencyScore = Math.min(reportsLast30Min / FREQUENCY_DIVISOR, 1.0);
    return frequencyScore * WEIGHTS.FREQUENCY;
}

/**
 * Calculate the environmental/infrastructure component (0 or 0.10)
 * Binary bonus for environmental issues
 * 
 * Environmental = water, electricity, sanitation, infrastructure
 */
export function calculateEnvironmentalComponent(isEnvironmental: boolean): number {
    return isEnvironmental ? WEIGHTS.ENVIRONMENTAL : 0;
}

/**
 * Calculate full priority score with breakdown
 * 
 * Formula:
 * Raw Priority (R) = (U × 0.35) + (I × 0.30) + (F × 0.25) + (E × 0.10)
 * Final Priority = R × C × 100
 * 
 * Where C (confidence) acts as a penalty multiplier:
 * - High confidence (0.9) → 90% of raw score
 * - Low confidence (0.2) → 20% of raw score (spam sinks)
 * 
 * @returns Score between 0-100
 */
export function calculatePriority(input: PriorityInput): PriorityBreakdown {
    // Calculate individual components
    const urgencyComponent = calculateUrgencyComponent(input.urgency_score);
    const impactComponent = calculateImpactComponent(input.impact_scope, input.report_count);
    const frequencyComponent = calculateFrequencyComponent(input.reports_last_30_min);
    const environmentalComponent = calculateEnvironmentalComponent(input.is_environmental);

    // Raw priority score (0-1.0 range)
    const rawScore =
        urgencyComponent +
        impactComponent +
        frequencyComponent +
        environmentalComponent;

    // Clamp confidence between 0 and 1
    const confidenceMultiplier = Math.max(0, Math.min(1, input.confidence_score));

    // Final score with confidence adjustment (0-100 range)
    const totalScore = rawScore * confidenceMultiplier * 100;

    return {
        urgency_component: round2(urgencyComponent * 100), // Scale to 0-35 for display
        impact_component: round2(impactComponent * 100),   // Scale to 0-30 for display
        frequency_component: round2(frequencyComponent * 100), // Scale to 0-25 for display
        environmental_component: round2(environmentalComponent * 100), // Scale to 0-10 for display
        raw_score: round2(rawScore * 100),
        confidence_multiplier: round2(confidenceMultiplier),
        total_score: round2(totalScore),
    };
}

/**
 * Round to 2 decimal places
 */
function round2(value: number): number {
    return Math.round(value * 100) / 100;
}

/**
 * Compare two priority scores for sorting
 * Returns negative if a should come before b (higher priority first)
 */
export function comparePriority(a: number, b: number): number {
    return b - a; // Descending order (higher priority first)
}

/**
 * Get priority level label based on score
 */
export function getPriorityLevel(score: number): 'critical' | 'high' | 'medium' | 'low' {
    if (score >= 75) return 'critical';
    if (score >= 50) return 'high';
    if (score >= 25) return 'medium';
    return 'low';
}

/**
 * Format priority for display
 */
export function formatPriority(score: number): string {
    const level = getPriorityLevel(score);
    return `${level.charAt(0).toUpperCase() + level.slice(1)} (${score.toFixed(1)})`;
}

/**
 * Example calculations for verification:
 * 
 * Case 1: One serious report, high urgency
 * U=0.8, single, 1 report, env=false, C=0.9
 * R = (0.8×0.35) + (0.4×0.30) + (0.1×0.25) + (0×0.10) = 0.28 + 0.12 + 0.025 = 0.425
 * Final = 0.425 × 0.9 × 100 = 38.25
 * 
 * Case 2: Many students reporting, high frequency
 * U=0.5, multi, 10 reports, env=true, C=0.8
 * I = min(0.7 + 9×0.03, 1.0) = min(0.97, 1.0) = 0.97
 * R = (0.5×0.35) + (0.97×0.30) + (1.0×0.25) + (1.0×0.10) = 0.175 + 0.291 + 0.25 + 0.10 = 0.816
 * Final = 0.816 × 0.8 × 100 = 65.28
 * 
 * Case 3: Low-effort vague spam
 * U=0.3, single, 1 report, env=false, C=0.2
 * R = (0.3×0.35) + (0.4×0.30) + (0.1×0.25) = 0.105 + 0.12 + 0.025 = 0.25
 * Final = 0.25 × 0.2 × 100 = 5.0
 */
