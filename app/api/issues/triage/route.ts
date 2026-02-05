/**
 * POST /api/issues/triage
 * Internal endpoint - runs automation pipeline on a report
 * Requires admin (or service) authentication to prevent abuse and control LLM costs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin, Tables } from '@/lib/db';
import { analyzeIssue, checkGeminiHealth, MODEL_NAME } from '@/lib/gemini';
import type {
    TriageRequest,
    TriageResponse,
    ApiResponse
} from '@/domain/types';
import { logResponse } from '@/lib/api-logger';

const PATH = '/api/issues/triage';

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<TriageResponse>>> {
    try {
        const { user, error: authError } = await requireAdmin();
        if (authError) {
            const res = { success: false, error: { code: authError.code, message: authError.message } };
            logResponse('POST', PATH, authError.status, res);
            return NextResponse.json(res, { status: authError.status });
        }

        const body: TriageRequest = await request.json();
        const { issue_report_id, title, description } = body;

        if (!issue_report_id || !title || !description) {
            const res = { success: false, error: { code: 'VALIDATION_ERROR', message: 'issue_report_id, title, and description are required' } };
            logResponse('POST', PATH, 400, res);
            return NextResponse.json(res, { status: 400 });
        }

        // Run Gemini triage
        const triageResult = await analyzeIssue(title, description);

        // Store automation metadata
        const { error: insertError } = await supabaseAdmin
            .from(Tables.AUTOMATION_METADATA)
            .upsert({
                issue_report_id,
                extracted_category: triageResult.extracted_category,
                urgency_score: triageResult.urgency_score,
                impact_scope: triageResult.impact_scope,
                environmental_flag: triageResult.environmental_flag,
                confidence_score: triageResult.confidence_score,
                raw_model_output: {
                    reasoning: triageResult.reasoning,
                    model: MODEL_NAME,
                    timestamp: new Date().toISOString(),
                },
            }, {
                onConflict: 'issue_report_id',
            });

        if (insertError) {
            console.error('Failed to store automation metadata:', insertError);
            const res = { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to store triage results' } };
            logResponse('POST', PATH, 500, res);
            return NextResponse.json(res, { status: 500 });
        }

        const res = {
            success: true,
            data: {
                extracted_category: triageResult.extracted_category,
                urgency_score: triageResult.urgency_score,
                impact_scope: triageResult.impact_scope,
                environmental_flag: triageResult.environmental_flag,
                confidence_score: triageResult.confidence_score,
                raw_model_output: { reasoning: triageResult.reasoning },
            },
        };
        logResponse('POST', PATH, 200, res);
        return NextResponse.json(res);

    } catch (error) {
        console.error('Triage endpoint error:', error);
        const errRes = {
            success: false,
            error: {
                code: 'AUTOMATION_ERROR',
                message: error instanceof Error ? error.message : 'Triage pipeline failed'
            }
        };
        logResponse('POST', PATH, 500, errRes);
        return NextResponse.json(
            errRes,
            { status: 503 }
        );
    }
}

/**
 * GET /api/issues/triage
 * Health check for Gemini integration
 */
export async function GET(): Promise<NextResponse<ApiResponse<{ available: boolean; error?: string }>>> {
    try {
        const health = await checkGeminiHealth();
        const status = health.available ? 200 : 503;
        const res = { success: health.available, data: health };
        logResponse('GET', PATH, status, res);
        return NextResponse.json(res, { status });
    } catch (error) {
        const res = { success: false, data: { available: false, error: error instanceof Error ? error.message : 'Health check failed' } };
        logResponse('GET', PATH, 503, res);
        return NextResponse.json(res, { status: 503 });
    }
}
