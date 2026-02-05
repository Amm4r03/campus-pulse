/**
 * POST /api/issues/create/stream
 * Submit a new issue report with Server-Sent Events progress.
 * Same validation and pipeline as POST /api/issues/create, with streaming progress.
 */

import { NextRequest } from 'next/server';
import { requireStudent } from '@/lib/auth';
import { supabaseAdmin, Tables } from '@/lib/db';
import { runAutomationPipeline } from '@/domain/automation';
import { logResponse } from '@/lib/api-logger';

const PATH = '/api/issues/create/stream';
const MIN_TITLE_LENGTH = 5;
const MIN_DESCRIPTION_LENGTH = 20;

export async function POST(request: NextRequest): Promise<Response> {
    const encoder = new TextEncoder();

    const send = (data: object) =>
        encoder.encode(`data: ${JSON.stringify(data)}\n\n`);

    const stream = new ReadableStream({
        async start(controller) {
            console.log('[API] POST', PATH, 'stream started');
            try {
                controller.enqueue(send({ stage: 'validating', progress: 5, message: 'Validating report...' }));

                const { user, error: authError } = await requireStudent();
                if (authError) {
                    logResponse('POST', PATH, authError.status, { stage: 'error', message: authError.message });
                    controller.enqueue(send({ stage: 'error', progress: 0, message: authError.message }));
                    controller.close();
                    return;
                }

                const body = await request.json();
                const { title, description, category_id, location_id } = body;

                if (!title || title.length < MIN_TITLE_LENGTH) {
                    controller.enqueue(send({ stage: 'error', progress: 0, message: `Title must be at least ${MIN_TITLE_LENGTH} characters` }));
                    controller.close();
                    return;
                }
                if (!description || description.length < MIN_DESCRIPTION_LENGTH) {
                    controller.enqueue(send({ stage: 'error', progress: 0, message: `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters` }));
                    controller.close();
                    return;
                }
                if (!category_id || !location_id) {
                    controller.enqueue(send({ stage: 'error', progress: 0, message: 'Category and location are required' }));
                    controller.close();
                    return;
                }

                const { data: category, error: categoryError } = await supabaseAdmin
                    .from(Tables.ISSUE_CATEGORIES)
                    .select('id')
                    .eq('id', category_id)
                    .single();
                if (categoryError || !category) {
                    controller.enqueue(send({ stage: 'error', progress: 0, message: 'Invalid category' }));
                    controller.close();
                    return;
                }

                const { data: location, error: locationError } = await supabaseAdmin
                    .from(Tables.LOCATIONS)
                    .select('id')
                    .eq('id', location_id)
                    .single();
                if (locationError || !location) {
                    controller.enqueue(send({ stage: 'error', progress: 0, message: 'Invalid location' }));
                    controller.close();
                    return;
                }

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

                if (insertError || !issueReport) {
                    controller.enqueue(send({ stage: 'error', progress: 0, message: 'Failed to create issue report' }));
                    controller.close();
                    return;
                }

                const automationResult = await runAutomationPipeline(
                    issueReport.id,
                    title,
                    description,
                    category_id,
                    location_id,
                    {
                        onProgress: (event) => {
                            controller.enqueue(send(event));
                        },
                    }
                );

                const meta = automationResult.automation_metadata;
                const isSpam = meta?.report_type === 'SPAM' || (typeof meta?.spam_confidence === 'number' && meta.spam_confidence >= 0.8);

                if (isSpam) {
                    const message = 'This looks like a test or spam. Please submit a real campus issue with a clear description.';
                    logResponse('POST', PATH, 200, { stage: 'error', message, saved_as_spam: true });
                    controller.enqueue(send({ stage: 'error', progress: 0, message }));
                } else {
                    const completeData = {
                        stage: 'complete',
                        progress: 100,
                        message: 'Report submitted successfully',
                        data: {
                            issue_id: issueReport.id,
                            aggregated_issue_id: automationResult.aggregated_issue_id || 'pending',
                            aggregation_status: automationResult.aggregation_status,
                            initial_priority: automationResult.priority.total_score,
                            urgency_level: meta?.urgency_level,
                            requires_immediate_action: meta?.requires_immediate_action,
                        },
                    };
                    logResponse('POST', PATH, 200, completeData);
                    controller.enqueue(send(completeData));
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to process report';
                logResponse('POST', PATH, 500, { stage: 'error', message });
                controller.enqueue(send({ stage: 'error', progress: 0, message }));
            }
            controller.close();
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
        },
    });
}
