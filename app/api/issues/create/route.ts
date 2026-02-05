/**
 * POST /api/issues/create
 * Student submits a new issue report
 * Uses complete automation pipeline with Gemini AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireStudent } from '@/lib/auth';
import { supabaseAdmin, Tables } from '@/lib/db';
import { runAutomationPipeline } from '@/domain/automation';
import type {
    CreateIssueRequest,
    CreateIssueResponse,
    ApiResponse
} from '@/domain/types';
import { logResponse } from '@/lib/api-logger';

// Validation constants
const MIN_TITLE_LENGTH = 5;
const MIN_DESCRIPTION_LENGTH = 20;

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<CreateIssueResponse>>> {
    try {
        // Authenticate and authorize
        const { user, error: authError } = await requireStudent();
        if (authError) {
            const res = { success: false, error: { code: authError.code, message: authError.message } };
            logResponse('POST', '/api/issues/create', authError.status, res);
            return NextResponse.json(res, { status: authError.status });
        }

        // Parse request body
        const body: CreateIssueRequest = await request.json();
        const { title, description, category_id, location_id } = body;

        // Validate input
        if (!title || title.length < MIN_TITLE_LENGTH) {
            const res = { success: false, error: { code: 'VALIDATION_ERROR', message: `Title must be at least ${MIN_TITLE_LENGTH} characters` } };
            logResponse('POST', '/api/issues/create', 400, res);
            return NextResponse.json(res, { status: 400 });
        }

        if (!description || description.length < MIN_DESCRIPTION_LENGTH) {
            const res = { success: false, error: { code: 'VALIDATION_ERROR', message: `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters` } };
            logResponse('POST', '/api/issues/create', 400, res);
            return NextResponse.json(res, { status: 400 });
        }

        if (!category_id || !location_id) {
            const res = { success: false, error: { code: 'VALIDATION_ERROR', message: 'Category and location are required' } };
            logResponse('POST', '/api/issues/create', 400, res);
            return NextResponse.json(res, { status: 400 });
        }

        // Validate category exists
        const { data: category, error: categoryError } = await supabaseAdmin
            .from(Tables.ISSUE_CATEGORIES)
            .select('id')
            .eq('id', category_id)
            .single();

        if (categoryError || !category) {
            const res = { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid category' } };
            logResponse('POST', '/api/issues/create', 400, res);
            return NextResponse.json(res, { status: 400 });
        }

        // Validate location exists
        const { data: location, error: locationError } = await supabaseAdmin
            .from(Tables.LOCATIONS)
            .select('id')
            .eq('id', location_id)
            .single();

        if (locationError || !location) {
            const res = { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid location' } };
            logResponse('POST', '/api/issues/create', 400, res);
            return NextResponse.json(res, { status: 400 });
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
            const res = { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to create issue report' } };
            logResponse('POST', '/api/issues/create', 500, res);
            return NextResponse.json(res, { status: 500 });
        }

        // Step 2: Run complete automation pipeline (with Gemini AI)
        const automationResult = await runAutomationPipeline(
            issueReport.id,
            title,
            description,
            category_id,
            location_id
        );

        // Step 3: Return response (include urgency_level and requires_immediate_action for crisis resources)
        const meta = automationResult.automation_metadata;
        const urgencyLevel = meta?.urgency_level as CreateIssueResponse['urgency_level'];
        const requiresImmediateAction = meta?.requires_immediate_action;

        if (!automationResult.success) {
            console.warn('Automation pipeline failed but issue created:', automationResult.error);
            const res = {
                success: true,
                data: {
                    issue_id: issueReport.id,
                    aggregated_issue_id: automationResult.aggregated_issue_id || 'pending',
                    aggregation_status: 'new',
                    initial_priority: automationResult.priority.total_score,
                    urgency_level: urgencyLevel,
                    requires_immediate_action: requiresImmediateAction,
                },
            };
            logResponse('POST', '/api/issues/create', 201, res);
            return NextResponse.json(res, { status: 201 });
        }

        const res = {
            success: true,
            data: {
                issue_id: issueReport.id,
                aggregated_issue_id: automationResult.aggregated_issue_id,
                aggregation_status: automationResult.aggregation_status,
                initial_priority: automationResult.priority.total_score,
                urgency_level: urgencyLevel,
                requires_immediate_action: requiresImmediateAction,
            },
        };
        logResponse('POST', '/api/issues/create', 201, res);
        return NextResponse.json(res, { status: 201 });

    } catch (error) {
        console.error('Unexpected error in issue creation:', error);
        const res = { success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } };
        logResponse('POST', '/api/issues/create', 500, res);
        return NextResponse.json(res, { status: 500 });
    }
}
