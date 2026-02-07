/**
 * GET /api/issues/admin/reports
 * List all individual issue reports (no aggregation) for admin Issues page.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin, Tables } from '@/lib/db';
import type { ApiResponse, PaginatedResponse } from '@/domain/types';
import { logResponse } from '@/lib/api-logger';

const PATH = '/api/issues/admin/reports';

export interface AdminReportItem {
    id: string;
    title: string;
    description: string;
    created_at: string;
    category_id: string;
    location_id: string;
    category_name: string;
    location_name: string;
    aggregated_issue_id: string | null;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function GET(
    request: NextRequest
): Promise<NextResponse<ApiResponse<PaginatedResponse<AdminReportItem>>>> {
    try {
        const { error: authError } = await requireAdmin();
        if (authError) {
            const res = { success: false, error: { code: authError.code, message: authError.message } };
            logResponse('GET', PATH, authError.status, res);
            return NextResponse.json(res, { status: authError.status });
        }

        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limit = Math.min(
            MAX_LIMIT,
            Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10))
        );
        const category_id = searchParams.get('category_id') || undefined;
        const location_id = searchParams.get('location_id') || undefined;
        const sort = searchParams.get('sort') || 'created_at';
        const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = supabaseAdmin
            .from(Tables.ISSUE_REPORTS)
            .select(
                `
                id,
                title,
                description,
                created_at,
                category_id,
                location_id,
                issue_categories(name),
                locations(name),
                issue_aggregation_map(aggregated_issue_id)
            `,
                { count: 'exact' }
            );

        if (category_id) {
            query = query.eq('category_id', category_id);
        }
        if (location_id) {
            query = query.eq('location_id', location_id);
        }

        const sortColumn = sort === 'title' ? 'title' : 'created_at';
        query = query.order(sortColumn, { ascending: order === 'asc', nullsFirst: false });
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) {
            console.error('Failed to fetch admin reports:', error);
            const res = { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch reports' } };
            logResponse('GET', PATH, 500, res);
            return NextResponse.json(res, { status: 500 });
        }

        const raw = (data || []) as Array<{
            id: string;
            title: string;
            description: string;
            created_at: string;
            category_id: string;
            location_id: string;
            issue_categories: { name: string } | { name: string }[] | null;
            locations: { name: string } | { name: string }[] | null;
            issue_aggregation_map: Array<{ aggregated_issue_id: string }> | { aggregated_issue_id: string } | null;
        }>;

        const first = <T>(v: T | T[] | null): T | null =>
            v == null ? null : Array.isArray(v) ? v[0] ?? null : v;
        const getAggregatedId = (map: { aggregated_issue_id: string } | Array<{ aggregated_issue_id: string }> | null): string | null => {
            const one = first(map);
            return one?.aggregated_issue_id ?? null;
        };

        const items: AdminReportItem[] = raw.map((row) => ({
            id: row.id,
            title: row.title,
            description: row.description,
            created_at: row.created_at,
            category_id: row.category_id,
            location_id: row.location_id,
            category_name: first(row.issue_categories)?.name ?? 'Unknown',
            location_name: first(row.locations)?.name ?? 'Unknown',
            aggregated_issue_id: getAggregatedId(row.issue_aggregation_map),
        }));

        const totalCount = count ?? 0;
        const totalPages = Math.ceil(totalCount / limit);
        const res = {
            success: true,
            data: { items, pagination: { page, limit, total: totalCount, total_pages: totalPages } },
        };
        logResponse('GET', PATH, 200, res);
        return NextResponse.json(res);
    } catch (err) {
        console.error('Unexpected error in admin reports:', err);
        const res = { success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } };
        logResponse('GET', PATH, 500, res);
        return NextResponse.json(res, { status: 500 });
    }
}
