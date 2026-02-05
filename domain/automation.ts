/**
 * Campus Pulse - Automation Pipeline
 * Orchestrates the complete issue triage automation workflow
 */

import { supabaseAdmin, Tables } from '@/lib/db';
import { analyzeIssue } from '@/lib/gemini';
import { aggregateIssue, getReportCount } from './aggregation';
import { updateFrequencyMetrics } from './frequency';
import { calculatePriority } from './priority';
import { routeIssue } from './routing';
import type {
    IssueReport,
    AutomationMetadata,
    AggregatedIssue,
    PriorityBreakdown,
    LocationType
} from './types';

/**
 * Result of the complete automation pipeline
 */
export interface AutomationPipelineResult {
    success: boolean;
    issue_report_id: string;
    aggregated_issue_id: string;
    aggregation_status: 'new' | 'linked';
    automation_metadata: {
        extracted_category: string;
        urgency_score: number;
        impact_scope: 'single' | 'multi';
        environmental_flag: boolean;
        confidence_score: number;
    };
    priority: PriorityBreakdown;
    routing: {
        authority_id: string;
        authority_name: string;
    };
    error?: string;
}

/**
 * Run the complete automation pipeline for a new issue report
 * This is the main entry point called after an issue is created
 */
export async function runAutomationPipeline(
    issueReportId: string,
    title: string,
    description: string,
    categoryId: string,
    locationId: string
): Promise<AutomationPipelineResult> {
    try {
        // Step 1: Run Gemini analysis
        console.log(`[Automation] Starting analysis for issue ${issueReportId}`);
        const analysisResult = await analyzeIssue(title, description);
        console.log(`[Automation] Gemini analysis complete:`, analysisResult);

        // Step 2: Store automation metadata
        const { data: automationMetadata, error: metadataError } = await supabaseAdmin
            .from(Tables.AUTOMATION_METADATA)
            .upsert({
                issue_report_id: issueReportId,
                extracted_category: analysisResult.extracted_category,
                urgency_score: analysisResult.urgency_score,
                impact_scope: analysisResult.impact_scope,
                environmental_flag: analysisResult.environmental_flag,
                confidence_score: analysisResult.confidence_score,
                raw_model_output: {
                    reasoning: analysisResult.reasoning,
                    model: 'gemini-1.5-flash',
                    timestamp: new Date().toISOString(),
                },
            }, {
                onConflict: 'issue_report_id',
            })
            .select()
            .single();

        if (metadataError) {
            console.error('[Automation] Failed to store metadata:', metadataError);
            throw new Error(`Failed to store automation metadata: ${metadataError.message}`);
        }

        // Step 3: Aggregate issue (find or create parent)
        console.log(`[Automation] Aggregating issue...`);
        const aggregationResult = await aggregateIssue(
            issueReportId,
            categoryId,
            locationId
        );
        console.log(`[Automation] Aggregation result:`, aggregationResult);

        // Step 4: Update frequency metrics
        console.log(`[Automation] Updating frequency metrics...`);
        const frequencyMetric = await updateFrequencyMetrics(aggregationResult.aggregated_issue_id);

        // Step 5: Get category info for environmental flag
        const { data: category } = await supabaseAdmin
            .from(Tables.ISSUE_CATEGORIES)
            .select('is_environmental, name')
            .eq('id', categoryId)
            .single();

        // Step 6: Get location info for routing
        const { data: location } = await supabaseAdmin
            .from(Tables.LOCATIONS)
            .select('type')
            .eq('id', locationId)
            .single();

        // Step 7: Calculate priority
        const reportCount = await getReportCount(aggregationResult.aggregated_issue_id);
        const priorityBreakdown = calculatePriority({
            urgency_score: analysisResult.urgency_score,
            is_environmental: category?.is_environmental || analysisResult.environmental_flag,
            report_count: reportCount,
            reports_last_30_min: frequencyMetric.report_count,
        });
        console.log(`[Automation] Priority calculated:`, priorityBreakdown);

        // Step 8: Store priority snapshot
        await supabaseAdmin
            .from(Tables.PRIORITY_SNAPSHOTS)
            .insert({
                aggregated_issue_id: aggregationResult.aggregated_issue_id,
                priority_score: priorityBreakdown.total_score,
                urgency_component: priorityBreakdown.urgency_component,
                impact_component: priorityBreakdown.impact_component,
                frequency_component: priorityBreakdown.frequency_component,
                environmental_component: priorityBreakdown.environmental_component,
            });

        // Step 9: Get routing recommendation
        const routingResult = await routeIssue({
            category_name: category?.name || analysisResult.extracted_category,
            location_type: (location?.type || 'common_area') as LocationType,
        });

        // Step 10: Update aggregated issue with routing if it's new
        if (aggregationResult.is_new) {
            await supabaseAdmin
                .from(Tables.AGGREGATED_ISSUES)
                .update({ authority_id: routingResult.authority_id })
                .eq('id', aggregationResult.aggregated_issue_id);
        }

        console.log(`[Automation] Pipeline complete for issue ${issueReportId}`);

        return {
            success: true,
            issue_report_id: issueReportId,
            aggregated_issue_id: aggregationResult.aggregated_issue_id,
            aggregation_status: aggregationResult.is_new ? 'new' : 'linked',
            automation_metadata: {
                extracted_category: analysisResult.extracted_category,
                urgency_score: analysisResult.urgency_score,
                impact_scope: analysisResult.impact_scope,
                environmental_flag: analysisResult.environmental_flag,
                confidence_score: analysisResult.confidence_score,
            },
            priority: priorityBreakdown,
            routing: {
                authority_id: routingResult.authority_id,
                authority_name: routingResult.authority_name,
            },
        };

    } catch (error) {
        console.error(`[Automation] Pipeline failed for issue ${issueReportId}:`, error);

        // Return a failure result with fallback values
        return {
            success: false,
            issue_report_id: issueReportId,
            aggregated_issue_id: '',
            aggregation_status: 'new',
            automation_metadata: {
                extracted_category: 'infrastructure',
                urgency_score: 0.5,
                impact_scope: 'single',
                environmental_flag: false,
                confidence_score: 0,
            },
            priority: {
                urgency_component: 12.5,
                impact_component: 0,
                frequency_component: 0,
                environmental_component: 0,
                total_score: 12.5,
            },
            routing: {
                authority_id: '',
                authority_name: 'Administrative Office',
            },
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Re-run automation for an existing issue (for reprocessing)
 */
export async function reprocessIssue(issueReportId: string): Promise<AutomationPipelineResult> {
    // Fetch the issue report
    const { data: report, error } = await supabaseAdmin
        .from(Tables.ISSUE_REPORTS)
        .select('*')
        .eq('id', issueReportId)
        .single();

    if (error || !report) {
        throw new Error(`Issue report not found: ${issueReportId}`);
    }

    return runAutomationPipeline(
        report.id,
        report.title,
        report.description,
        report.category_id,
        report.location_id
    );
}

/**
 * Recalculate priority for an aggregated issue
 * Called when new reports are linked or frequency changes
 */
export async function recalculatePriority(aggregatedIssueId: string): Promise<PriorityBreakdown> {
    // Get the latest automation metadata from linked reports
    const { data: linkedReports } = await supabaseAdmin
        .from(Tables.ISSUE_AGGREGATION_MAP)
        .select(`
      issue_reports:issue_report_id (
        id,
        category_id
      ),
      automation_metadata:issue_report_id (
        urgency_score,
        environmental_flag
      )
    `)
        .eq('aggregated_issue_id', aggregatedIssueId);

    if (!linkedReports || linkedReports.length === 0) {
        throw new Error('No linked reports found for aggregated issue');
    }

    // Calculate average urgency score from all linked reports
    const urgencyScores = linkedReports
        .filter((r: any) => r.automation_metadata?.urgency_score != null)
        .map((r: any) => r.automation_metadata.urgency_score);

    const avgUrgency = urgencyScores.length > 0
        ? urgencyScores.reduce((a: number, b: number) => a + b, 0) / urgencyScores.length
        : 0.5;

    // Check if any report flagged as environmental
    const isEnvironmental = linkedReports.some((r: any) => r.automation_metadata?.environmental_flag);

    // Get report count and frequency
    const reportCount = linkedReports.length;
    const { data: frequencyMetric } = await supabaseAdmin
        .from(Tables.FREQUENCY_METRICS)
        .select('report_count')
        .eq('aggregated_issue_id', aggregatedIssueId)
        .order('calculated_at', { ascending: false })
        .limit(1)
        .single();

    // Calculate new priority
    const priorityBreakdown = calculatePriority({
        urgency_score: avgUrgency,
        is_environmental: isEnvironmental,
        report_count: reportCount,
        reports_last_30_min: frequencyMetric?.report_count || 0,
    });

    // Store new priority snapshot
    await supabaseAdmin
        .from(Tables.PRIORITY_SNAPSHOTS)
        .insert({
            aggregated_issue_id: aggregatedIssueId,
            priority_score: priorityBreakdown.total_score,
            urgency_component: priorityBreakdown.urgency_component,
            impact_component: priorityBreakdown.impact_component,
            frequency_component: priorityBreakdown.frequency_component,
            environmental_component: priorityBreakdown.environmental_component,
        });

    return priorityBreakdown;
}

/**
 * Get automation status for an issue
 */
export async function getAutomationStatus(issueReportId: string): Promise<{
    processed: boolean;
    metadata: AutomationMetadata | null;
}> {
    const { data, error } = await supabaseAdmin
        .from(Tables.AUTOMATION_METADATA)
        .select('*')
        .eq('issue_report_id', issueReportId)
        .single();

    if (error || !data) {
        return { processed: false, metadata: null };
    }

    return {
        processed: data.confidence_score > 0,
        metadata: data as AutomationMetadata,
    };
}
