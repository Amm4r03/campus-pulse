/**
 * Campus Pulse - Supabase Database Client
 * Server-side client for database operations
 */

import { createClient } from '@supabase/supabase-js';

// Environment variables (to be set in .env.local)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Public client for client-side operations
 * Uses anon key with RLS policies
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Service role client for server-side operations
 * Bypasses RLS - use only in API routes and server actions
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

/**
 * Create a Supabase client with user's auth context
 * For use in API routes to maintain RLS
 */
export function createServerClient(accessToken: string) {
    return createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
    });
}

/**
 * Database table names for type-safe queries
 */
export const Tables = {
    ROLES: 'roles',
    USERS: 'users',
    AUTHORITIES: 'authorities',
    ISSUE_CATEGORIES: 'issue_categories',
    LOCATIONS: 'locations',
    ISSUE_REPORTS: 'issue_reports',
    AGGREGATED_ISSUES: 'aggregated_issues',
    ISSUE_AGGREGATION_MAP: 'issue_aggregation_map',
    AUTOMATION_METADATA: 'automation_metadata',
    PRIORITY_SNAPSHOTS: 'priority_snapshots',
    FREQUENCY_METRICS: 'frequency_metrics',
    ADMIN_ACTIONS: 'admin_actions',
} as const;

/**
 * Database view names
 */
export const Views = {
    AGGREGATED_ISSUES_DASHBOARD: 'v_aggregated_issues_dashboard',
    STUDENT_REPORTS: 'v_student_reports',
} as const;

/**
 * Database function names
 */
export const Functions = {
    CALCULATE_FREQUENCY_METRICS: 'calculate_frequency_metrics',
    CALCULATE_PRIORITY_SCORE: 'calculate_priority_score',
    FIND_OR_CREATE_AGGREGATED_ISSUE: 'find_or_create_aggregated_issue',
} as const;
