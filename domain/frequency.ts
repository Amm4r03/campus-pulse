/**
 * Campus Pulse - Frequency Metrics Logic
 * Tracks report frequency for escalation signals
 */

import { supabaseAdmin, Tables } from '@/lib/db';
import type { FrequencyMetric } from './types';

/**
 * Fixed 30-minute window for frequency calculation
 * As specified in AUTOMATION.md
 */
const FREQUENCY_WINDOW_MINUTES = 30;

/**
 * Calculate the number of reports in the last 30 minutes
 * for an aggregated issue
 */
export async function calculateFrequency(
    aggregatedIssueId: string
): Promise<number> {
    const thirtyMinutesAgo = new Date(Date.now() - FREQUENCY_WINDOW_MINUTES * 60 * 1000);

    const { count, error } = await supabaseAdmin
        .from(Tables.ISSUE_AGGREGATION_MAP)
        .select(`
      issue_reports:issue_report_id (created_at)
    `, { count: 'exact' })
        .eq('aggregated_issue_id', aggregatedIssueId)
        .gte('issue_reports.created_at', thirtyMinutesAgo.toISOString());

    if (error) {
        console.error('Failed to calculate frequency:', error.message);
        return 0;
    }

    return count || 0;
}

/**
 * Store a frequency metric snapshot
 */
export async function storeFrequencyMetric(
    aggregatedIssueId: string,
    reportCount: number
): Promise<FrequencyMetric> {
    const { data, error } = await supabaseAdmin
        .from(Tables.FREQUENCY_METRICS)
        .insert({
            aggregated_issue_id: aggregatedIssueId,
            window_minutes: FREQUENCY_WINDOW_MINUTES,
            report_count: reportCount,
        })
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to store frequency metric: ${error.message}`);
    }

    return data as FrequencyMetric;
}

/**
 * Calculate and store frequency metric for an aggregated issue
 * Called on every new report submission
 */
export async function updateFrequencyMetrics(
    aggregatedIssueId: string
): Promise<FrequencyMetric> {
    const reportCount = await calculateFrequency(aggregatedIssueId);
    return storeFrequencyMetric(aggregatedIssueId, reportCount);
}

/**
 * Get the latest frequency metric for an aggregated issue
 */
export async function getLatestFrequencyMetric(
    aggregatedIssueId: string
): Promise<FrequencyMetric | null> {
    const { data, error } = await supabaseAdmin
        .from(Tables.FREQUENCY_METRICS)
        .select('*')
        .eq('aggregated_issue_id', aggregatedIssueId)
        .order('calculated_at', { ascending: false })
        .limit(1)
        .single();

    if (error || !data) {
        return null;
    }

    return data as FrequencyMetric;
}

/**
 * Get frequency metrics history for an aggregated issue
 */
export async function getFrequencyHistory(
    aggregatedIssueId: string,
    limit: number = 10
): Promise<FrequencyMetric[]> {
    const { data, error } = await supabaseAdmin
        .from(Tables.FREQUENCY_METRICS)
        .select('*')
        .eq('aggregated_issue_id', aggregatedIssueId)
        .order('calculated_at', { ascending: false })
        .limit(limit);

    if (error) {
        throw new Error(`Failed to get frequency history: ${error.message}`);
    }

    return (data || []) as FrequencyMetric[];
}

/**
 * Format frequency for admin display
 * e.g., "10 reports in last 30 minutes"
 */
export function formatFrequency(reportCount: number): string {
    if (reportCount === 0) {
        return 'No recent reports';
    }

    if (reportCount === 1) {
        return '1 report in last 30 minutes';
    }

    return `${reportCount} reports in last 30 minutes`;
}

/**
 * Determine if frequency indicates urgency for admin attention
 */
export function isHighFrequency(reportCount: number): boolean {
    // Threshold: 5+ reports in 30 minutes indicates high frequency
    return reportCount >= 5;
}

/**
 * Get frequency-based urgency multiplier
 * Used to boost priority for rapidly reported issues
 */
export function getFrequencyUrgencyMultiplier(reportCount: number): number {
    if (reportCount >= 10) return 1.5;  // Very high frequency
    if (reportCount >= 5) return 1.25;  // High frequency
    if (reportCount >= 3) return 1.1;   // Moderate frequency
    return 1.0;                          // Normal
}
