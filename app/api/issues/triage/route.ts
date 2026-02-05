/**
 * POST /api/issues/triage
 * Internal endpoint - runs automation pipeline on a report
 * This will be called by the create endpoint or can be triggered manually
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, Tables } from '@/lib/db';
import type {
    TriageRequest,
    TriageResponse,
    ApiResponse,
    ImpactScope
} from '@/domain/types';

/**
 * Gemini prompt template for issue triage
 * TODO: Replace with actual Gemini API call
 */
const TRIAGE_PROMPT = `You are an issue triage assistant for Jamia Hamdard University campus.

Analyze this student-reported issue:
Title: {title}
Description: {description}

Respond in JSON format:
{
  "extracted_category": "one of: wifi, water, sanitation, electricity, hostel, academics, safety, food, infrastructure",
  "urgency_score": "number between 0 and 1",
  "impact_scope": "single or multi",
  "environmental_flag": "true or false",
  "confidence_score": "number between 0 and 1",
  "reasoning": "brief explanation"
}`;

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
        const triageResult = await runGeminiTriage(title, description);

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
                raw_model_output: triageResult.raw_model_output,
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
            data: triageResult,
        });

    } catch (error) {
        console.error('Triage endpoint error:', error);
        return NextResponse.json(
            { success: false, error: { code: 'AUTOMATION_ERROR', message: 'Triage pipeline failed' } },
            { status: 503 }
        );
    }
}

/**
 * Run Gemini triage on issue text
 * TODO: Implement actual Gemini API integration
 * 
 * SCAFFOLDING: This is a placeholder that returns mock data.
 * Will be replaced with actual Gemini integration in the automation phase.
 */
async function runGeminiTriage(
    title: string,
    description: string
): Promise<TriageResponse> {
    // TODO: Replace with actual Gemini API call
    // import { GoogleGenerativeAI } from '@google/generative-ai';
    // const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    // const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // const prompt = TRIAGE_PROMPT
    //   .replace('{title}', title)
    //   .replace('{description}', description);

    // const result = await model.generateContent(prompt);
    // const response = result.response.text();
    // return JSON.parse(response);

    // Placeholder: Analyze text for keywords to simulate triage
    const textLower = (title + ' ' + description).toLowerCase();

    // Detect category from keywords
    let extracted_category = 'infrastructure';
    if (textLower.includes('wifi') || textLower.includes('internet') || textLower.includes('network')) {
        extracted_category = 'wifi';
    } else if (textLower.includes('water') || textLower.includes('tap') || textLower.includes('leak')) {
        extracted_category = 'water';
    } else if (textLower.includes('toilet') || textLower.includes('bathroom') || textLower.includes('sanitation') || textLower.includes('dirty')) {
        extracted_category = 'sanitation';
    } else if (textLower.includes('electric') || textLower.includes('power') || textLower.includes('light') || textLower.includes('ac') || textLower.includes('fan')) {
        extracted_category = 'electricity';
    } else if (textLower.includes('hostel') || textLower.includes('room') || textLower.includes('bed')) {
        extracted_category = 'hostel';
    } else if (textLower.includes('exam') || textLower.includes('result') || textLower.includes('class') || textLower.includes('professor') || textLower.includes('schedule')) {
        extracted_category = 'academics';
    } else if (textLower.includes('safe') || textLower.includes('theft') || textLower.includes('danger') || textLower.includes('security')) {
        extracted_category = 'safety';
    } else if (textLower.includes('food') || textLower.includes('canteen') || textLower.includes('mess') || textLower.includes('meal')) {
        extracted_category = 'food';
    }

    // Detect urgency from keywords
    let urgency_score = 0.5;
    if (textLower.includes('urgent') || textLower.includes('emergency') || textLower.includes('immediately') || textLower.includes('critical')) {
        urgency_score = 0.9;
    } else if (textLower.includes('asap') || textLower.includes('soon') || textLower.includes('important')) {
        urgency_score = 0.7;
    } else if (textLower.includes('minor') || textLower.includes('small') || textLower.includes('when possible')) {
        urgency_score = 0.3;
    }

    // Detect impact scope
    let impact_scope: ImpactScope = 'single';
    if (textLower.includes('everyone') || textLower.includes('all students') || textLower.includes('whole') || textLower.includes('entire') || textLower.includes('many')) {
        impact_scope = 'multi';
    }

    // Environmental flag
    const environmental_flag = ['water', 'electricity', 'sanitation', 'infrastructure'].includes(extracted_category);

    return {
        extracted_category,
        urgency_score,
        impact_scope,
        environmental_flag,
        confidence_score: 0.6, // Lower confidence for keyword-based detection
        raw_model_output: {
            method: 'keyword_analysis',
            note: 'Placeholder until Gemini integration',
            detected_keywords: {
                category: extracted_category,
                urgency_indicators: urgency_score > 0.5 ? 'high' : 'normal',
                impact_indicators: impact_scope,
            },
        },
    };
}
