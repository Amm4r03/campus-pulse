/**
 * Campus Pulse - Automation Pipeline
 * Orchestrates the complete issue triage automation workflow
 */

import { supabaseAdmin, Tables } from '@/lib/db';
import { runRobustTriage } from '@/lib/triage/orchestrator';
import { MODEL_NAME as GEMINI_MODEL_NAME } from '@/lib/gemini';
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
        urgency_level?: string;
        requires_immediate_action?: boolean;
        report_type?: string;
        spam_confidence?: number;
    };
    priority: PriorityBreakdown;
    routing: {
        authority_id: string;
        authority_name: string;
    };
    error?: string;
}

export interface AutomationProgressEvent {
    stage: string;
    progress: number;
    message: string;
    data?: unknown;
}

export interface RunAutomationPipelineOptions {
    onProgress?: (event: AutomationProgressEvent) => void;
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
    locationId: string,
    options?: RunAutomationPipelineOptions
): Promise<AutomationPipelineResult> {
    const onProgress = options?.onProgress;
    try {
        onProgress?.({ stage: 'triage', progress: 15, message: 'Running safety checks...' });
        // Step 1: Fetch categories and locations for parallel triage
        const [categoriesRes, locationsRes] = await Promise.all([
            supabaseAdmin.from(Tables.ISSUE_CATEGORIES).select('id, name'),
            supabaseAdmin.from(Tables.LOCATIONS).select('id, name'),
        ]);
        const availableCategories = (categoriesRes.data ?? []).map((r) => ({ id: r.id, name: r.name }));
        const availableLocations = (locationsRes.data ?? []).map((r) => ({ id: r.id, name: r.name }));

        // Step 2: Run parallel triage (spam + location + urgency in parallel, ~700–1200ms)
        console.log(`[Automation] Starting parallel triage for issue ${issueReportId}`);
        const triageResult = await runRobustTriage({
            title,
            description,
            availableLocations,
            availableCategories,
        });
        const analysisResult = triageResult.automationOutput;
        console.log(`[Automation] Parallel triage complete:`, {
            urgency: analysisResult.urgency_score,
            category: analysisResult.extracted_category,
            fullAnalysisNeeded: triageResult.fullAnalysisNeeded,
        });
        onProgress?.({
            stage: 'triage_complete',
            progress: 40,
            message: `Analysis: ${analysisResult.urgency_level ?? 'MEDIUM'} priority`,
            data: {
                urgency_level: analysisResult.urgency_level,
                requires_immediate_action: analysisResult.requires_immediate_action,
            },
        });

        // Step 3: Store automation metadata (including safety/escalation dimensions in raw_model_output)
        const rawModelOutput: Record<string, unknown> = {
            reasoning: analysisResult.reasoning,
            model: 'parallel-triage',
            gemini_model: GEMINI_MODEL_NAME,
            timestamp: new Date().toISOString(),
            urgency_level: analysisResult.urgency_level,
            report_type: analysisResult.report_type,
            reporter_welfare_flag: analysisResult.reporter_welfare_flag,
            requires_immediate_action: analysisResult.requires_immediate_action,
            spam_confidence: analysisResult.spam_confidence,
            context_validity: analysisResult.context_validity,
        };
        const { data: automationMetadata, error: metadataError } = await supabaseAdmin
            .from(Tables.AUTOMATION_METADATA)
            .upsert({
                issue_report_id: issueReportId,
                extracted_category: analysisResult.extracted_category,
                urgency_score: analysisResult.urgency_score,
                impact_scope: analysisResult.impact_scope,
                environmental_flag: analysisResult.environmental_flag,
                confidence_score: analysisResult.confidence_score,
                raw_model_output: rawModelOutput,
            }, {
                onConflict: 'issue_report_id',
            })
            .select()
            .single();

        if (metadataError) {
            console.error('[Automation] Failed to store metadata:', metadataError);
            throw new Error(`Failed to store automation metadata: ${metadataError.message}`);
        }

        onProgress?.({ stage: 'aggregating', progress: 55, message: 'Checking for similar issues...' });
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

        onProgress?.({ stage: 'priority', progress: 70, message: 'Calculating priority score...' });
        // Step 7: Calculate priority (with single-report escalation and welfare boost)
        const reportCount = await getReportCount(aggregationResult.aggregated_issue_id);
        const priorityBreakdown = calculatePriority({
            urgency_score: analysisResult.urgency_score,
            impact_scope: analysisResult.impact_scope,
            is_environmental: category?.is_environmental || analysisResult.environmental_flag,
            report_count: reportCount,
            reports_last_30_min: frequencyMetric.report_count,
            confidence_score: analysisResult.confidence_score,
            requires_immediate_action: analysisResult.requires_immediate_action,
            reporter_welfare_flag: analysisResult.reporter_welfare_flag,
        });
        if (analysisResult.requires_immediate_action) {
            console.warn('[Automation] Immediate action required for report', issueReportId, {
                urgency_level: analysisResult.urgency_level,
                reporter_welfare_flag: analysisResult.reporter_welfare_flag,
            });
        }
        console.log(`[Automation] Priority calculated:`, priorityBreakdown);

        // Step 8: Store priority snapshot (non-critical for main flow; log and continue on failure)
        const { error: snapshotError } = await supabaseAdmin
            .from(Tables.PRIORITY_SNAPSHOTS)
            .insert({
                aggregated_issue_id: aggregationResult.aggregated_issue_id,
                priority_score: priorityBreakdown.total_score,
                urgency_component: priorityBreakdown.urgency_component,
                impact_component: priorityBreakdown.impact_component,
                frequency_component: priorityBreakdown.frequency_component,
                environmental_component: priorityBreakdown.environmental_component,
            })
            .select();

        if (snapshotError) {
            console.error('[Automation] Failed to store priority snapshot:', snapshotError);
        }

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
        onProgress?.({
            stage: 'complete',
            progress: 100,
            message: 'Report submitted successfully',
            data: undefined,
        });

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
                urgency_level: analysisResult.urgency_level,
                requires_immediate_action: analysisResult.requires_immediate_action,
                report_type: analysisResult.report_type,
                spam_confidence: analysisResult.spam_confidence,
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
                report_type: 'GENERAL',
                spam_confidence: 0,
            },
            priority: {
                urgency_component: 17.5,
                impact_component: 12,
                frequency_component: 2.5,
                environmental_component: 0,
                raw_score: 32,
                confidence_multiplier: 0,
                total_score: 0,
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
        impact_scope,
        environmental_flag,
        confidence_score
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

    // Calculate average confidence score
    const confidenceScores = linkedReports
        .filter((r: any) => r.automation_metadata?.confidence_score != null)
        .map((r: any) => r.automation_metadata.confidence_score);

    const avgConfidence = confidenceScores.length > 0
        ? confidenceScores.reduce((a: number, b: number) => a + b, 0) / confidenceScores.length
        : 0.5;

    // Determine overall impact scope (multi if any report is multi)
    const hasMultiImpact = linkedReports.some((r: any) => r.automation_metadata?.impact_scope === 'multi');

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
        impact_scope: hasMultiImpact ? 'multi' : 'single',
        is_environmental: isEnvironmental,
        report_count: reportCount,
        reports_last_30_min: frequencyMetric?.report_count || 0,
        confidence_score: avgConfidence,
    });

    // Store new priority snapshot (log and continue on failure)
    const { error: snapshotError } = await supabaseAdmin
        .from(Tables.PRIORITY_SNAPSHOTS)
        .insert({
            aggregated_issue_id: aggregatedIssueId,
            priority_score: priorityBreakdown.total_score,
            urgency_component: priorityBreakdown.urgency_component,
            impact_component: priorityBreakdown.impact_component,
            frequency_component: priorityBreakdown.frequency_component,
            environmental_component: priorityBreakdown.environmental_component,
        })
        .select();

    if (snapshotError) {
        console.error('[Automation] Failed to store priority snapshot in recalculatePriority:', snapshotError);
    }

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
