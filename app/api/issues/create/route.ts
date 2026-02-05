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

        // Validate category exists
        const { data: category, error: categoryError } = await supabaseAdmin
            .from(Tables.ISSUE_CATEGORIES)
            .select('id')
            .eq('id', category_id)
            .single();

        if (categoryError || !category) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid category' } },
                { status: 400 }
            );
        }

        // Validate location exists
        const { data: location, error: locationError } = await supabaseAdmin
            .from(Tables.LOCATIONS)
            .select('id')
            .eq('id', location_id)
            .single();

        if (locationError || !location) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid location' } },
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

        // Step 2: Run complete automation pipeline (with Gemini AI)
        const automationResult = await runAutomationPipeline(
            issueReport.id,
            title,
            description,
            category_id,
            location_id
        );

        // Step 3: Return response
        if (!automationResult.success) {
            // Automation failed but issue was created - return partial success
            console.warn('Automation pipeline failed but issue created:', automationResult.error);
            return NextResponse.json({
                success: true,
                data: {
                    issue_id: issueReport.id,
                    aggregated_issue_id: automationResult.aggregated_issue_id || 'pending',
                    aggregation_status: 'new',
                    initial_priority: automationResult.priority.total_score,
                },
            }, { status: 201 });
        }

        return NextResponse.json({
            success: true,
            data: {
                issue_id: issueReport.id,
                aggregated_issue_id: automationResult.aggregated_issue_id,
                aggregation_status: automationResult.aggregation_status,
                initial_priority: automationResult.priority.total_score,
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
