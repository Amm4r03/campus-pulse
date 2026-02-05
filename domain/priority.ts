/**
 * Campus Pulse - Priority Calculation Logic
 * Calculates priority scores for aggregated issues
 */

import type { PriorityInput, PriorityBreakdown } from './types';

/**
 * Priority calculation weights
 * Total maximum = 100
 */
const WEIGHTS = {
    URGENCY_MAX: 25,
    IMPACT_MAX: 25,
    FREQUENCY_MAX: 25,
    ENVIRONMENTAL_BONUS: 25,
} as const;

/**
 * Calculate the urgency component (0-25)
 * Based on automation-extracted urgency score
 */
export function calculateUrgencyComponent(urgencyScore: number): number {
    // Clamp urgency score between 0 and 1
    const clampedScore = Math.max(0, Math.min(1, urgencyScore));
    return clampedScore * WEIGHTS.URGENCY_MAX;
}

/**
 * Calculate the impact component (0-25)
 * Based on total report count with logarithmic scaling
 * More reports = higher impact, but with diminishing returns
 */
export function calculateImpactComponent(reportCount: number): number {
    // Logarithmic scaling: ln(count + 1) * 10, capped at 25
    const score = Math.log(Math.max(reportCount, 1) + 1) * 10;
    return Math.min(score, WEIGHTS.IMPACT_MAX);
}

/**
 * Calculate the frequency component (0-25)
 * Based on reports in the last 30 minutes
 * Indicates how actively the issue is being reported
 */
export function calculateFrequencyComponent(reportsLast30Min: number): number {
    // Linear scaling: 2.5 points per report, capped at 25
    const score = reportsLast30Min * 2.5;
    return Math.min(score, WEIGHTS.FREQUENCY_MAX);
}

/**
 * Calculate the environmental/infrastructure component (0 or 25)
 * Binary bonus for environmental issues
 */
export function calculateEnvironmentalComponent(isEnvironmental: boolean): number {
    return isEnvironmental ? WEIGHTS.ENVIRONMENTAL_BONUS : 0;
}

/**
 * Calculate full priority score with breakdown
 * Returns a score between 0-100
 */
export function calculatePriority(input: PriorityInput): PriorityBreakdown {
    const urgencyComponent = calculateUrgencyComponent(input.urgency_score);
    const impactComponent = calculateImpactComponent(input.report_count);
    const frequencyComponent = calculateFrequencyComponent(input.reports_last_30_min);
    const environmentalComponent = calculateEnvironmentalComponent(input.is_environmental);

    const totalScore =
        urgencyComponent +
        impactComponent +
        frequencyComponent +
        environmentalComponent;

    return {
        urgency_component: Math.round(urgencyComponent * 100) / 100,
        impact_component: Math.round(impactComponent * 100) / 100,
        frequency_component: Math.round(frequencyComponent * 100) / 100,
        environmental_component: Math.round(environmentalComponent * 100) / 100,
        total_score: Math.round(totalScore * 100) / 100,
    };
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
