/**
 * GET /api/locations
 * Fetch all active campus locations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin, Tables } from '@/lib/db';
import type { Location, ApiResponse } from '@/domain/types';
import { logResponse } from '@/lib/api-logger';

const PATH = '/api/locations';

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<Location[]>>> {
    try {
        // Authenticate (any role)
        const user = await getCurrentUser();
        if (!user) {
            const res = { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } };
            logResponse('GET', PATH, 401, res);
            return NextResponse.json(res, { status: 401 });
        }

        // Fetch active locations
        const { data, error } = await supabaseAdmin
            .from(Tables.LOCATIONS)
            .select('*')
            .eq('is_active', true)
            .order('type')
            .order('name');

        if (error) {
            console.error('Failed to fetch locations:', error);
            const res = { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch locations' } };
            logResponse('GET', PATH, 500, res);
            return NextResponse.json(res, { status: 500 });
        }

        const res = { success: true, data: (data || []) as Location[] };
        logResponse('GET', PATH, 200, res);
        return NextResponse.json(res);

    } catch (error) {
        console.error('Unexpected error in locations:', error);
        const res = { success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } };
        logResponse('GET', PATH, 500, res);
        return NextResponse.json(res, { status: 500 });
    }
}
