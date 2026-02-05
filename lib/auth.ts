/**
 * Campus Pulse - Authentication Utilities
 * Server-side auth helpers for API routes
 */

import { cookies } from 'next/headers';
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { supabaseAdmin, Tables } from './db';
import type { User, UserRole } from '@/domain/types';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Create a Supabase client for server components/API routes
 * Uses cookies for session management
 */
export async function createServerClient() {
    const cookieStore = await cookies();

    return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    );
                } catch {
                    // Ignore errors in server components
                }
            },
        },
    });
}

/**
 * Get the current authenticated user
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<{
    id: string;
    email: string | undefined;
    role: UserRole;
} | null> {
    const supabase = await createServerClient();

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return null;
    }

    // Get user's role from database
    const { data: dbUser, error: dbError } = await supabaseAdmin
        .from(Tables.USERS)
        .select(`
      id,
      role:roles(name)
    `)
        .eq('id', user.id)
        .single();

    if (dbError || !dbUser) {
        return null;
    }

    return {
        id: user.id,
        email: user.email,
        role: (dbUser.role as { name: UserRole }).name,
    };
}

/**
 * Check if user has required role
 */
export async function requireRole(requiredRole: UserRole): Promise<{
    user: { id: string; email: string | undefined; role: UserRole };
    error: null;
} | {
    user: null;
    error: { code: string; message: string; status: number };
}> {
    const user = await getCurrentUser();

    if (!user) {
        return {
            user: null,
            error: {
                code: 'UNAUTHORIZED',
                message: 'Authentication required',
                status: 401,
            },
        };
    }

    if (user.role !== requiredRole && requiredRole !== 'student') {
        // Admin role includes student permissions
        if (!(user.role === 'admin' && requiredRole === 'student')) {
            return {
                user: null,
                error: {
                    code: 'FORBIDDEN',
                    message: `Role '${requiredRole}' required`,
                    status: 403,
                },
            };
        }
    }

    return { user, error: null };
}

/**
 * Require student role (or admin, since admin has all permissions)
 */
export async function requireStudent() {
    return requireRole('student');
}

/**
 * Require admin role
 */
export async function requireAdmin() {
    return requireRole('admin');
}

/**
 * Create a new user in the database after Supabase Auth signup
 * This should be called via a trigger or during onboarding
 */
export async function createUserProfile(
    userId: string,
    role: UserRole = 'student'
): Promise<{ success: boolean; error?: string }> {
    // Get role ID
    const { data: roleData, error: roleError } = await supabaseAdmin
        .from(Tables.ROLES)
        .select('id')
        .eq('name', role)
        .single();

    if (roleError || !roleData) {
        return { success: false, error: 'Invalid role' };
    }

    // Create user profile
    const { error } = await supabaseAdmin
        .from(Tables.USERS)
        .insert({
            id: userId,
            role_id: roleData.id,
        });

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * Check if a user profile exists
 */
export async function userProfileExists(userId: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin
        .from(Tables.USERS)
        .select('id')
        .eq('id', userId)
        .single();

    return !error && !!data;
}
