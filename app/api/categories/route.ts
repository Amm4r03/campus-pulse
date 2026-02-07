/**
 * GET /api/categories
 * Fetch all issue categories
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin, Tables } from '@/lib/db';
import type { ApiResponse } from '@/domain/types';
import { logResponse } from '@/lib/api-logger';

const PATH = '/api/categories';

interface CategoryWithAuthority {
    id: string;
    name: string;
    is_environmental: boolean;
    default_authority: {
        id: string;
        name: string;
    } | null;
}

// Supabase returns joins as arrays, so we need to handle that
interface CategoryFromDB {
    id: string;
    name: string;
    is_environmental: boolean;
    default_authority: { id: string; name: string }[] | null;
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<CategoryWithAuthority[]>>> {
    try {
        // Authenticate (any role)
        const user = await getCurrentUser();
        if (!user) {
            const res = { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } };
            logResponse('GET', PATH, 401, res);
            return NextResponse.json(res, { status: 401 });
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
            const res = { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch categories' } };
            logResponse('GET', PATH, 500, res);
            return NextResponse.json(res, { status: 500 });
        }

        // Map the data to flatten the authority relationship
        const categories: CategoryWithAuthority[] = ((data || []) as CategoryFromDB[]).map(cat => ({
            id: cat.id,
            name: cat.name,
            is_environmental: cat.is_environmental,
            default_authority: cat.default_authority?.[0] || null,
        }));

        const res = { success: true, data: categories };
        logResponse('GET', PATH, 200, res);
        return NextResponse.json(res);

    } catch (error) {
        console.error('Unexpected error in categories:', error);
        const res = { success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error' } };
        logResponse('GET', PATH, 500, res);
        return NextResponse.json(res, { status: 500 });
    }
}
