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
import { logResponse } from '@/lib/api-logger';

const PATH = '/api/issues/admin';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<PaginatedResponse<AggregatedIssueDashboard>>>> {
    try {
        // Authenticate and authorize
        const { user, error: authError } = await requireAdmin();
        if (authError) {
            const res = { success: false, error: { code: authError.code, message: authError.message } };
            logResponse('GET', PATH, authError.status, res);
            return NextResponse.json(res, { status: authError.status });
        }

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const params: AdminIssuesQueryParams = {
            status: (searchParams.get('status') as AdminIssuesQueryParams['status']) || 'open',
            authority_name: searchParams.get('authority_name') || undefined,
            category_name: searchParams.get('category_name') || undefined,
            location_name: searchParams.get('location_name') || undefined,
            sort_by: (searchParams.get('sort_by') as AdminIssuesQueryParams['sort_by']) || 'priority',
            order: (searchParams.get('order') as AdminIssuesQueryParams['order']) || 'desc',
            page: parseInt(searchParams.get('page') || '1', 10),
            limit: Math.min(parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10), MAX_LIMIT),
        };

        // Build query using the dashboard view (prevents N+1)
        let query = supabaseAdmin
            .from(Views.AGGREGATED_ISSUES_DASHBOARD)
            .select('*', { count: 'exact' });

        // Apply filters (support comma-separated for "active" = open,in_progress)
        if (params.status && params.status !== 'all') {
            const statusParam = String(params.status);
            if (statusParam.includes(',')) {
                const statuses = statusParam.split(',').map((s) => s.trim()).filter(Boolean);
                if (statuses.length > 0) {
                    query = query.in('status', statuses);
                }
            } else {
                query = query.eq('status', params.status);
            }
        }

        if (params.authority_name) {
            query = query.eq('authority_name', params.authority_name);
        }

        if (params.category_name) {
            query = query.eq('category_name', params.category_name);
        }

        if (params.location_name) {
            query = query.eq('location_name', params.location_name);
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
            const res = { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch issues' } };
            logResponse('GET', PATH, 500, res);
            return NextResponse.json(res, { status: 500 });
        }

        const totalCount = count || 0;
        const totalPages = Math.ceil(totalCount / limit);
        const res = {
            success: true,
            data: {
                items: (data || []) as AggregatedIssueDashboard[],
                pagination: { page, limit, total: totalCount, total_pages: totalPages },
            },
        };
        logResponse('GET', PATH, 200, res);
        return NextResponse.json(res);

    } catch (error) {
        console.error('Unexpected error in admin issues:', error);
        const res = { success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } };
        logResponse('GET', PATH, 500, res);
        return NextResponse.json(res, { status: 500 });
    }
}

/**
 * Map sort_by parameter to actual column name
 */
function getSortColumn(sortBy: string): string {
    switch (sortBy) {
        case 'priority':
            return 'current_priority';
        case 'date':
        case 'created_at':
            return 'created_at';
        case 'frequency':
        case 'report_count':
            return 'total_reports';
        default:
            return 'current_priority';
    }
}
