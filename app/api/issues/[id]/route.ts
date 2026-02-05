/**
 * GET /api/issues/[id]
 * Get detailed view of an aggregated issue
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin, Tables } from '@/lib/db';
import { getLinkedReports } from '@/domain/aggregation';
import type { AdminIssueDetailResponse, ApiResponse } from '@/domain/types';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function GET(
    request: NextRequest,
    { params }: RouteParams
): Promise<NextResponse<ApiResponse<AdminIssueDetailResponse>>> {
    try {
        // Authenticate and authorize
        const { user, error: authError } = await requireAdmin();
        if (authError) {
            return NextResponse.json(
                { success: false, error: { code: authError.code, message: authError.message } },
                { status: authError.status }
            );
        }

        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', message: 'Issue ID is required' } },
                { status: 400 }
            );
        }

        // Fetch aggregated issue with related data
        const { data: issue, error: issueError } = await supabaseAdmin
            .from(Tables.AGGREGATED_ISSUES)
            .select(`
        *,
        category:issue_categories(*),
        location:locations(*),
        authority:authorities(*)
      `)
            .eq('id', id)
            .single();

        if (issueError || !issue) {
            return NextResponse.json(
                { success: false, error: { code: 'NOT_FOUND', message: 'Issue not found' } },
                { status: 404 }
            );
        }

        // Get linked reports (anonymized - no reporter_id)
        const linkedReportsRaw = await getLinkedReports(id);

        // Get automation metadata for each report
        const linkedReports = await Promise.all(
            linkedReportsRaw.map(async (report) => {
                const { data: automation } = await supabaseAdmin
                    .from(Tables.AUTOMATION_METADATA)
                    .select('urgency_score, impact_scope, confidence_score')
                    .eq('issue_report_id', report.id)
                    .single();

                return {
                    id: report.id,
                    title: report.title,
                    description: report.description,
                    created_at: report.created_at,
                    automation: automation || null,
                };
            })
        );

        // Get latest priority snapshot
        const { data: prioritySnapshot } = await supabaseAdmin
            .from(Tables.PRIORITY_SNAPSHOTS)
            .select('*')
            .eq('aggregated_issue_id', id)
            .order('calculated_at', { ascending: false })
            .limit(1)
            .single();

        // Get latest frequency metric
        const { data: frequencyMetric } = await supabaseAdmin
            .from(Tables.FREQUENCY_METRICS)
            .select('report_count')
            .eq('aggregated_issue_id', id)
            .order('calculated_at', { ascending: false })
            .limit(1)
            .single();

        // Get admin actions history
        const { data: adminActions } = await supabaseAdmin
            .from(Tables.ADMIN_ACTIONS)
            .select('id, action_type, notes, created_at')
            .eq('aggregated_issue_id', id)
            .order('created_at', { ascending: false });

        // Build response (note: reporter_id is NOT included anywhere)
        const response: AdminIssueDetailResponse = {
            issue: {
                id: issue.id,
                status: issue.status,
                category: {
                    id: issue.category.id,
                    name: issue.category.name,
                    is_environmental: issue.category.is_environmental,
                },
                location: {
                    id: issue.location.id,
                    name: issue.location.name,
                    type: issue.location.type,
                    latitude: issue.location.latitude,
                    longitude: issue.location.longitude,
                },
                authority: {
                    id: issue.authority.id,
                    name: issue.authority.name,
                    description: issue.authority.description,
                },
                metrics: {
                    total_reports: linkedReports.length,
                    first_report_time: linkedReports.length > 0
                        ? linkedReports[linkedReports.length - 1].created_at
                        : issue.created_at,
                    latest_report_time: linkedReports.length > 0
                        ? linkedReports[0].created_at
                        : issue.created_at,
                    current_priority: prioritySnapshot?.priority_score ?? 0,
                    priority_breakdown: {
                        urgency_component: prioritySnapshot?.urgency_component ?? 0,
                        impact_component: prioritySnapshot?.impact_component ?? 0,
                        frequency_component: prioritySnapshot?.frequency_component ?? 0,
                        environmental_component: prioritySnapshot?.environmental_component ?? 0,
                    },
                    reports_last_30_min: frequencyMetric?.report_count ?? 0,
                },
                created_at: issue.created_at,
                updated_at: issue.updated_at,
            },
            linked_reports: linkedReports,
            admin_actions: adminActions || [],
        };

        return NextResponse.json({
            success: true,
            data: response,
        });

    } catch (error) {
        console.error('Unexpected error in issue detail:', error);
        return NextResponse.json(
            { success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } },
            { status: 500 }
        );
    }
}
