/**
 * POST /api/issues/[id]/action
 * Admin performs action on an aggregated issue
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin, Tables } from '@/lib/db';
import type { AdminActionRequest, ApiResponse, AdminAction } from '@/domain/types';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function POST(
    request: NextRequest,
    { params }: RouteParams
): Promise<NextResponse<ApiResponse<AdminAction>>> {
    try {
        // Authenticate and authorize
        const { user, error: authError } = await requireAdmin();
        if (authError) {
            return NextResponse.json(
                { success: false, error: { code: authError.code, message: authError.message } },
                { status: authError.status }
            );
        }

        const { id: aggregatedIssueId } = await params;
        const body: AdminActionRequest = await request.json();
        const { action_type, new_value, notes } = body;

        if (!aggregatedIssueId) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', message: 'Issue ID is required' } },
                { status: 400 }
            );
        }

        if (!action_type) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', message: 'action_type is required' } },
                { status: 400 }
            );
        }

        // Validate action_type
        const validActions = ['assign', 'override_priority', 'resolve', 'reopen', 'change_status'];
        if (!validActions.includes(action_type)) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid action_type' } },
                { status: 400 }
            );
        }

        // Fetch current issue state
        const { data: currentIssue, error: fetchError } = await supabaseAdmin
            .from(Tables.AGGREGATED_ISSUES)
            .select('*')
            .eq('id', aggregatedIssueId)
            .single();

        if (fetchError || !currentIssue) {
            return NextResponse.json(
                { success: false, error: { code: 'NOT_FOUND', message: 'Issue not found' } },
                { status: 404 }
            );
        }

        // Build previous_value and determine updates
        let previousValue: Record<string, unknown> = {};
        let updates: Record<string, unknown> = {};

        switch (action_type) {
            case 'assign':
                if (!new_value?.authority_id) {
                    return NextResponse.json(
                        { success: false, error: { code: 'VALIDATION_ERROR', message: 'authority_id required for assign action' } },
                        { status: 400 }
                    );
                }
                previousValue = { authority_id: currentIssue.authority_id };
                updates = { authority_id: new_value.authority_id };
                break;

            case 'change_status':
            case 'resolve':
            case 'reopen':
                const targetStatus =
                    action_type === 'resolve' ? 'resolved' :
                        action_type === 'reopen' ? 'open' :
                            new_value?.status;

                if (!targetStatus) {
                    return NextResponse.json(
                        { success: false, error: { code: 'VALIDATION_ERROR', message: 'status required for change_status action' } },
                        { status: 400 }
                    );
                }

                previousValue = { status: currentIssue.status };
                updates = { status: targetStatus };
                break;

            case 'override_priority':
                // Priority overrides are logged but don't actually change the calculated priority
                // The new priority_score is stored as a manual snapshot
                if (new_value?.priority_score === undefined) {
                    return NextResponse.json(
                        { success: false, error: { code: 'VALIDATION_ERROR', message: 'priority_score required for override_priority action' } },
                        { status: 400 }
                    );
                }

                // Get current priority
                const { data: currentPriority } = await supabaseAdmin
                    .from(Tables.PRIORITY_SNAPSHOTS)
                    .select('priority_score')
                    .eq('aggregated_issue_id', aggregatedIssueId)
                    .order('calculated_at', { ascending: false })
                    .limit(1)
                    .single();

                previousValue = { priority_score: currentPriority?.priority_score ?? 0 };

                // Insert manual priority snapshot
                await supabaseAdmin
                    .from(Tables.PRIORITY_SNAPSHOTS)
                    .insert({
                        aggregated_issue_id: aggregatedIssueId,
                        priority_score: new_value.priority_score,
                        urgency_component: null,
                        impact_component: null,
                        frequency_component: null,
                        environmental_component: null,
                    });
                break;
        }

        // Apply updates to aggregated issue if any
        if (Object.keys(updates).length > 0) {
            const { error: updateError } = await supabaseAdmin
                .from(Tables.AGGREGATED_ISSUES)
                .update(updates)
                .eq('id', aggregatedIssueId);

            if (updateError) {
                console.error('Failed to update issue:', updateError);
                return NextResponse.json(
                    { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update issue' } },
                    { status: 500 }
                );
            }
        }

        // Log admin action
        const { data: adminAction, error: actionError } = await supabaseAdmin
            .from(Tables.ADMIN_ACTIONS)
            .insert({
                admin_id: user.id,
                aggregated_issue_id: aggregatedIssueId,
                action_type,
                previous_value: previousValue,
                new_value: new_value || updates,
                notes: notes || null,
            })
            .select()
            .single();

        if (actionError) {
            console.error('Failed to log admin action:', actionError);
            return NextResponse.json(
                { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to log action' } },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: adminAction as AdminAction,
        });

    } catch (error) {
        console.error('Unexpected error in admin action:', error);
        return NextResponse.json(
            { success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } },
            { status: 500 }
        );
    }
}
