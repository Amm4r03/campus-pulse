/**
 * GET /api/categories
 * Fetch all issue categories
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin, Tables } from '@/lib/db';
import type { ApiResponse } from '@/domain/types';

interface CategoryWithAuthority {
    id: string;
    name: string;
    is_environmental: boolean;
    default_authority: {
        id: string;
        name: string;
    };
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<CategoryWithAuthority[]>>> {
    try {
        // Authenticate (any role)
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json(
                { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
                { status: 401 }
            );
        }

        // Fetch categories with default authority
        const { data, error } = await supabaseAdmin
            .from(Tables.ISSUE_CATEGORIES)
            .select(`
        id,
        name,
        is_environmental,
        default_authority:authorities(id, name)
      `)
            .order('name');

        if (error) {
            console.error('Failed to fetch categories:', error);
            return NextResponse.json(
                { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch categories' } },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: (data || []) as CategoryWithAuthority[],
        });

    } catch (error) {
        console.error('Unexpected error in categories:', error);
        return NextResponse.json(
            { success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } },
            { status: 500 }
        );
    }
}
