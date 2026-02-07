/**
 * GET /api/student/issues
 * Student views their own submitted issues
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireStudent } from '@/lib/auth';
import { supabaseAdmin, Tables, Views } from '@/lib/db';
import type { StudentReportView, ApiResponse, PaginatedResponse } from '@/domain/types';
import { logResponse } from '@/lib/api-logger';

const PATH = '/api/student/issues';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<PaginatedResponse<StudentReportView>>>> {
    try {
        // Authenticate
        const { user, error: authError } = await requireStudent();
        if (authError) {
            const res = { success: false, error: { code: authError.code, message: authError.message } };
            logResponse('GET', PATH, authError.status, res);
            return NextResponse.json(res, { status: authError.status });
        }

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = Math.min(
            parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10),
            MAX_LIMIT
        );

        // Calculate pagination
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        // Fetch student's own reports using the view
        const { data, error, count } = await supabaseAdmin
            .from(Views.STUDENT_REPORTS)
            .select('*', { count: 'exact' })
            .eq('reporter_id', user.id)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) {
            console.error('Failed to fetch student issues:', error);
            const res = { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch issues' } };
            logResponse('GET', PATH, 500, res);
            return NextResponse.json(res, { status: 500 });
        }

        const totalCount = count || 0;
        const totalPages = Math.ceil(totalCount / limit);
        const res = {
            success: true,
            data: {
                items: (data || []) as StudentReportView[],
                pagination: { page, limit, total: totalCount, total_pages: totalPages },
            },
        };
        logResponse('GET', PATH, 200, res);
        return NextResponse.json(res);

    } catch (error) {
        console.error('Unexpected error in student issues:', error);
        const res = { success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } };
        logResponse('GET', PATH, 500, res);
        return NextResponse.json(res, { status: 500 });
    }
}
