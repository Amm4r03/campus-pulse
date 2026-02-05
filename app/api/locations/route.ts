/**
 * GET /api/locations
 * Fetch all active campus locations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin, Tables } from '@/lib/db';
import type { Location, ApiResponse } from '@/domain/types';

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<Location[]>>> {
    try {
        // Authenticate (any role)
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json(
                { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
                { status: 401 }
            );
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
            return NextResponse.json(
                { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch locations' } },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: (data || []) as Location[],
        });

    } catch (error) {
        console.error('Unexpected error in locations:', error);
        return NextResponse.json(
            { success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } },
            { status: 500 }
        );
    }
}
