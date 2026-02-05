/**
 * POST /api/issues/create
 * Student submits a new issue report
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireStudent } from '@/lib/auth';
import { supabaseAdmin, Tables } from '@/lib/db';
import { aggregateIssue } from '@/domain/aggregation';
import { updateFrequencyMetrics } from '@/domain/frequency';
import { calculatePriority } from '@/domain/priority';
import type {
    CreateIssueRequest,
    CreateIssueResponse,
    ApiResponse,
    AutomationMetadata
} from '@/domain/types';

// Validation constants
const MIN_TITLE_LENGTH = 5;
const MIN_DESCRIPTION_LENGTH = 20;

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<CreateIssueResponse>>> {
    try {
        // Authenticate and authorize
        const { user, error: authError } = await requireStudent();
        if (authError) {
            return NextResponse.json(
                { success: false, error: { code: authError.code, message: authError.message } },
                { status: authError.status }
            );
        }

        // Parse request body
        const body: CreateIssueRequest = await request.json();
        const { title, description, category_id, location_id } = body;

        // Validate input
        if (!title || title.length < MIN_TITLE_LENGTH) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: `Title must be at least ${MIN_TITLE_LENGTH} characters`
                    }
                },
                { status: 400 }
            );
        }

        if (!description || description.length < MIN_DESCRIPTION_LENGTH) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters`
                    }
                },
                { status: 400 }
            );
        }

        if (!category_id || !location_id) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Category and location are required'
                    }
                },
                { status: 400 }
            );
        }

        // Step 1: Insert issue report (immutable)
        const { data: issueReport, error: insertError } = await supabaseAdmin
            .from(Tables.ISSUE_REPORTS)
            .insert({
                reporter_id: user.id,
                title,
                description,
                category_id,
                location_id,
            })
            .select()
            .single();

        if (insertError) {
            console.error('Failed to create issue report:', insertError);
            return NextResponse.json(
                { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to create issue report' } },
                { status: 500 }
            );
        }

        // Step 2: Run automation triage (TODO: Integrate Gemini)
        // For now, use placeholder automation metadata
        const automationResult = await runTriagePipeline(issueReport.id, title, description, category_id);

        // Step 3: Aggregate issue (find or create parent issue)
        const aggregationResult = await aggregateIssue(
            issueReport.id,
            category_id,
            location_id
        );

        // Step 4: Update frequency metrics
        const frequencyMetric = await updateFrequencyMetrics(aggregationResult.aggregated_issue_id);

        // Step 5: Get category environmental flag
        const { data: category } = await supabaseAdmin
            .from(Tables.ISSUE_CATEGORIES)
            .select('is_environmental')
            .eq('id', category_id)
            .single();

        // Step 6: Calculate and store priority
        const priorityBreakdown = calculatePriority({
            urgency_score: automationResult?.urgency_score ?? 0.5,
            is_environmental: category?.is_environmental ?? false,
            report_count: frequencyMetric.report_count,
            reports_last_30_min: frequencyMetric.report_count,
        });

        // Store priority snapshot
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

        // Return success response
        return NextResponse.json({
            success: true,
            data: {
                issue_id: issueReport.id,
                aggregated_issue_id: aggregationResult.aggregated_issue_id,
                aggregation_status: aggregationResult.is_new ? 'new' : 'linked',
                initial_priority: priorityBreakdown.total_score,
            },
        }, { status: 201 });

    } catch (error) {
        console.error('Unexpected error in issue creation:', error);
        return NextResponse.json(
            { success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } },
            { status: 500 }
        );
    }
}

/**
 * Run the triage pipeline (placeholder until Gemini integration)
 * TODO: Replace with actual Gemini API call in automation phase
 */
async function runTriagePipeline(
    issueReportId: string,
    title: string,
    description: string,
    categoryId: string
): Promise<AutomationMetadata | null> {
    try {
        // Placeholder automation metadata
        // Will be replaced with actual Gemini integration
        const automationData = {
            issue_report_id: issueReportId,
            extracted_category: 'pending', // Will be extracted by Gemini
            urgency_score: 0.5, // Default medium urgency
            impact_scope: 'single' as const,
            environmental_flag: false,
            confidence_score: 0.0, // Zero confidence until Gemini runs
            raw_model_output: {
                placeholder: true,
                note: 'Awaiting Gemini integration',
            },
        };

        const { data, error } = await supabaseAdmin
            .from(Tables.AUTOMATION_METADATA)
            .insert(automationData)
            .select()
            .single();

        if (error) {
            console.error('Failed to store automation metadata:', error);
            return null;
        }

        return data as AutomationMetadata;
    } catch (error) {
        console.error('Triage pipeline error:', error);
        return null;
    }
}
