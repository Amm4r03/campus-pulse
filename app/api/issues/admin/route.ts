/**
 * GET /api/issues/admin
 * Fetch aggregated issues for admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin, Views } from '@/lib/db';
import type {
    AggregatedIssueDashboard,
    AdminIssuesQueryParams,
    ApiResponse,
    PaginatedResponse
} from '@/domain/types';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<PaginatedResponse<AggregatedIssueDashboard>>>> {
    try {
        // Authenticate and authorize
        const { user, error: authError } = await requireAdmin();
        if (authError) {
            return NextResponse.json(
                { success: false, error: { code: authError.code, message: authError.message } },
                { status: authError.status }
            );
        }

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const params: AdminIssuesQueryParams = {
            status: (searchParams.get('status') as AdminIssuesQueryParams['status']) || 'open',
            authority_id: searchParams.get('authority_id') || undefined,
            category_id: searchParams.get('category_id') || undefined,
            sort_by: (searchParams.get('sort_by') as AdminIssuesQueryParams['sort_by']) || 'priority',
            order: (searchParams.get('order') as AdminIssuesQueryParams['order']) || 'desc',
            page: parseInt(searchParams.get('page') || '1', 10),
            limit: Math.min(parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10), MAX_LIMIT),
        };

        // Build query using the dashboard view (prevents N+1)
        let query = supabaseAdmin
            .from(Views.AGGREGATED_ISSUES_DASHBOARD)
            .select('*', { count: 'exact' });

        // Apply filters
        if (params.status && params.status !== 'all') {
            query = query.eq('status', params.status);
        }

        if (params.authority_id) {
            // Need to join with aggregated_issues for authority filter
            // The view might not have authority_id directly, so we filter by name
            query = query.eq('authority_name', params.authority_id);
        }

        if (params.category_id) {
            // Similar issue - filter by category_name
            query = query.eq('category_name', params.category_id);
        }

        // Apply sorting
        const sortColumn = getSortColumn(params.sort_by || 'priority');
        query = query.order(sortColumn, { ascending: params.order === 'asc', nullsFirst: false });

        // Apply pagination
        const page = params.page || 1;
        const limit = params.limit || DEFAULT_LIMIT;
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to);

        // Execute query
        const { data, error, count } = await query;

        if (error) {
            console.error('Failed to fetch admin issues:', error);
            return NextResponse.json(
                { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch issues' } },
                { status: 500 }
            );
        }

        const totalCount = count || 0;
        const totalPages = Math.ceil(totalCount / limit);

        return NextResponse.json({
            success: true,
            data: {
                items: (data || []) as AggregatedIssueDashboard[],
                pagination: {
                    page,
                    limit,
                    total: totalCount,
                    total_pages: totalPages,
                },
            },
        });

    } catch (error) {
        console.error('Unexpected error in admin issues:', error);
        return NextResponse.json(
            { success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } },
            { status: 500 }
        );
    }
}

/**
 * Map sort_by parameter to actual column name
 */
function getSortColumn(sortBy: string): string {
    switch (sortBy) {
        case 'priority':
            return 'current_priority';
        case 'created_at':
            return 'created_at';
        case 'report_count':
            return 'total_reports';
        default:
            return 'current_priority';
    }
}
