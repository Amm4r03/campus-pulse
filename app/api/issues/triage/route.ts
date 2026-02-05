/**
 * POST /api/issues/triage
 * Internal endpoint - runs automation pipeline on a report
 * Now uses real Gemini AI integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, Tables } from '@/lib/db';
import { analyzeIssue, checkGeminiHealth } from '@/lib/gemini';
import type {
    TriageRequest,
    TriageResponse,
    ApiResponse
} from '@/domain/types';

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<TriageResponse>>> {
    try {
        // This endpoint is internal - should be called with service role
        // In production, add proper authentication for internal calls

        const body: TriageRequest = await request.json();
        const { issue_report_id, title, description } = body;

        if (!issue_report_id || !title || !description) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'issue_report_id, title, and description are required'
                    }
                },
                { status: 400 }
            );
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
                    model: 'gemini-1.5-flash',
                    timestamp: new Date().toISOString(),
                },
            }, {
                onConflict: 'issue_report_id',
            });

        if (insertError) {
            console.error('Failed to store automation metadata:', insertError);
            return NextResponse.json(
                { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to store triage results' } },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                extracted_category: triageResult.extracted_category,
                urgency_score: triageResult.urgency_score,
                impact_scope: triageResult.impact_scope,
                environmental_flag: triageResult.environmental_flag,
                confidence_score: triageResult.confidence_score,
                raw_model_output: {
                    reasoning: triageResult.reasoning,
                },
            },
        });

    } catch (error) {
        console.error('Triage endpoint error:', error);
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'AUTOMATION_ERROR',
                    message: error instanceof Error ? error.message : 'Triage pipeline failed'
                }
            },
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

        return NextResponse.json({
            success: health.available,
            data: health,
        }, { status: health.available ? 200 : 503 });
    } catch (error) {
        return NextResponse.json({
            success: false,
            data: {
                available: false,
                error: error instanceof Error ? error.message : 'Health check failed'
            },
        }, { status: 503 });
    }
}
