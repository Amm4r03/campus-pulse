/**
 * Campus Pulse - Aggregation Logic
 * Determines if issues should be aggregated together
 */

import { supabaseAdmin, Tables } from '@/lib/db';
import type { IssueReport, AggregatedIssue, IssueCategory } from './types';

/**
 * Aggregation rules:
 * 1. Same category
 * 2. Same location
 * 3. Parent issue is OPEN (not resolved)
 * 4. Resolved issues never accept new reports - create new aggregated issue
 */

export interface AggregationResult {
    aggregated_issue_id: string;
    is_new: boolean;
    linked_at: string;
}

/**
 * Find an existing open aggregated issue that matches the criteria
 * Returns null if no matching open issue exists
 */
export async function findOpenAggregatedIssue(
    categoryId: string,
    locationId: string
): Promise<AggregatedIssue | null> {
    const { data, error } = await supabaseAdmin
        .from(Tables.AGGREGATED_ISSUES)
        .select('*')
        .eq('canonical_category_id', categoryId)
        .eq('location_id', locationId)
        .eq('status', 'open')
        .limit(1)
        .single();

    if (error || !data) {
        return null;
    }

    return data as AggregatedIssue;
}

/**
 * Create a new aggregated issue
 */
export async function createAggregatedIssue(
    categoryId: string,
    locationId: string,
    authorityId: string
): Promise<AggregatedIssue> {
    const { data, error } = await supabaseAdmin
        .from(Tables.AGGREGATED_ISSUES)
        .insert({
            canonical_category_id: categoryId,
            location_id: locationId,
            authority_id: authorityId,
            status: 'open',
        })
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to create aggregated issue: ${error.message}`);
    }

    return data as AggregatedIssue;
}

/**
 * Link an issue report to an aggregated issue
 */
export async function linkReportToAggregatedIssue(
    issueReportId: string,
    aggregatedIssueId: string
): Promise<void> {
    const { error } = await supabaseAdmin
        .from(Tables.ISSUE_AGGREGATION_MAP)
        .insert({
            issue_report_id: issueReportId,
            aggregated_issue_id: aggregatedIssueId,
        });

    if (error) {
        throw new Error(`Failed to link report to aggregated issue: ${error.message}`);
    }
}

/**
 * Get the default authority for a category
 */
export async function getDefaultAuthority(categoryId: string): Promise<string> {
    const { data, error } = await supabaseAdmin
        .from(Tables.ISSUE_CATEGORIES)
        .select('default_authority_id')
        .eq('id', categoryId)
        .single();

    if (error || !data) {
        throw new Error(`Failed to get default authority for category: ${error?.message}`);
    }

    return data.default_authority_id;
}

/**
 * Main aggregation function
 * Finds or creates an aggregated issue and links the report to it
 * 
 * This follows the rule: resolved issues never accept new reports,
 * so we only look for OPEN issues to aggregate with
 */
export async function aggregateIssue(
    issueReportId: string,
    categoryId: string,
    locationId: string
): Promise<AggregationResult> {
    // Try to find existing open aggregated issue
    const existingIssue = await findOpenAggregatedIssue(categoryId, locationId);

    let aggregatedIssueId: string;
    let isNew: boolean;

    if (existingIssue) {
        // Link to existing open issue
        aggregatedIssueId = existingIssue.id;
        isNew = false;
    } else {
        // Create new aggregated issue
        const authorityId = await getDefaultAuthority(categoryId);
        const newIssue = await createAggregatedIssue(categoryId, locationId, authorityId);
        aggregatedIssueId = newIssue.id;
        isNew = true;
    }

    // Link the report to the aggregated issue
    await linkReportToAggregatedIssue(issueReportId, aggregatedIssueId);

    return {
        aggregated_issue_id: aggregatedIssueId,
        is_new: isNew,
        linked_at: new Date().toISOString(),
    };
}

/**
 * Get the count of linked reports for an aggregated issue
 */
export async function getReportCount(aggregatedIssueId: string): Promise<number> {
    const { count, error } = await supabaseAdmin
        .from(Tables.ISSUE_AGGREGATION_MAP)
        .select('*', { count: 'exact', head: true })
        .eq('aggregated_issue_id', aggregatedIssueId);

    if (error) {
        throw new Error(`Failed to get report count: ${error.message}`);
    }

    return count || 0;
}

/**
 * Get all linked reports for an aggregated issue
 * Note: Does NOT include reporter_id to maintain anonymity
 */
export async function getLinkedReports(aggregatedIssueId: string): Promise<Array<{
    id: string;
    title: string;
    description: string;
    created_at: string;
}>> {
    const { data, error } = await supabaseAdmin
        .from(Tables.ISSUE_AGGREGATION_MAP)
        .select(`
      issue_reports:issue_report_id (
        id,
        title,
        description,
        created_at
      )
    `)
        .eq('aggregated_issue_id', aggregatedIssueId)
        .order('created_at', { ascending: false });

    if (error) {
        throw new Error(`Failed to get linked reports: ${error.message}`);
    }

    // Flatten the nested structure
    return (data || []).map((item: any) => item.issue_reports);
}
