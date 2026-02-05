/**
 * Campus Pulse - Routing Logic
 * Routes issues to appropriate Jamia Hamdard authorities
 */

import { supabaseAdmin, Tables } from '@/lib/db';
import type { LocationType, RoutingInput, RoutingResult, Authority } from './types';

/**
 * Routing rules for Jamia Hamdard (from BACKENDFEATURES.md)
 * 
 * Hostel issues → Provost
 * Water/Electricity (classrooms) → Administrative Office
 * Water/Electricity (hostels) → Provost
 * Sanitation → Administrative Office
 * Safety → Security In-Charge
 * Academic scheduling/results → Academic Affairs / Department Office
 * Food → Provost
 * WiFi/Infrastructure → Administrative Office
 */

/**
 * Authority name constants matching database seeds
 */
const Authorities = {
    PROVOST: 'Provost',
    ADMIN_OFFICE: 'Administrative Office',
    SECURITY: 'Security In-Charge',
    ACADEMIC_AFFAIRS: 'Academic Affairs',
} as const;

/**
 * Categories that route to Provost when in hostel locations
 */
const PROVOST_HOSTEL_CATEGORIES = ['water', 'electricity', 'hostel', 'food'];

/**
 * Categories that always route to specific authorities
 */
const FIXED_ROUTING: Record<string, string> = {
    safety: Authorities.SECURITY,
    academics: Authorities.ACADEMIC_AFFAIRS,
    sanitation: Authorities.ADMIN_OFFICE,
    wifi: Authorities.ADMIN_OFFICE,
    infrastructure: Authorities.ADMIN_OFFICE,
};

/**
 * Get authority by name from database
 */
export async function getAuthorityByName(name: string): Promise<Authority | null> {
    const { data, error } = await supabaseAdmin
        .from(Tables.AUTHORITIES)
        .select('*')
        .eq('name', name)
        .single();

    if (error || !data) {
        return null;
    }

    return data as Authority;
}

/**
 * Get all authorities
 */
export async function getAllAuthorities(): Promise<Authority[]> {
    const { data, error } = await supabaseAdmin
        .from(Tables.AUTHORITIES)
        .select('*')
        .order('name');

    if (error) {
        throw new Error(`Failed to get authorities: ${error.message}`);
    }

    return (data || []) as Authority[];
}

/**
 * Determine the appropriate authority for an issue based on category and location
 */
export function determineAuthority(input: RoutingInput): {
    authority_name: string;
    reason: string;
} {
    const { category_name, location_type } = input;
    const categoryLower = category_name.toLowerCase();

    // Check fixed routing first
    if (categoryLower in FIXED_ROUTING) {
        return {
            authority_name: FIXED_ROUTING[categoryLower],
            reason: getRoutingReason(categoryLower, location_type),
        };
    }

    // Check hostel-specific routing
    if (
        location_type === 'hostel' &&
        PROVOST_HOSTEL_CATEGORIES.includes(categoryLower)
    ) {
        return {
            authority_name: Authorities.PROVOST,
            reason: `${categoryLower} issue in hostel location routes to Provost`,
        };
    }

    // Default routing for categories without fixed rules
    if (['water', 'electricity'].includes(categoryLower)) {
        return {
            authority_name: Authorities.ADMIN_OFFICE,
            reason: `${categoryLower} issue in ${location_type} routes to Administrative Office`,
        };
    }

    // Fallback to Administrative Office
    return {
        authority_name: Authorities.ADMIN_OFFICE,
        reason: 'Default routing to Administrative Office',
    };
}

/**
 * Get routing reason for fixed routes
 */
function getRoutingReason(category: string, locationType: LocationType): string {
    switch (category) {
        case 'safety':
            return 'Safety issues always route to Security In-Charge';
        case 'academics':
            return 'Academic issues route to Academic Affairs';
        case 'sanitation':
            return 'Sanitation issues route to Administrative Office';
        case 'wifi':
            return 'WiFi issues route to Administrative Office';
        case 'infrastructure':
            return 'Infrastructure issues route to Administrative Office';
        default:
            return 'Routed based on category';
    }
}

/**
 * Route an issue and get full routing result with authority ID
 */
export async function routeIssue(input: RoutingInput): Promise<RoutingResult> {
    const { authority_name, reason } = determineAuthority(input);

    const authority = await getAuthorityByName(authority_name);

    if (!authority) {
        throw new Error(`Authority not found: ${authority_name}`);
    }

    return {
        authority_id: authority.id,
        authority_name: authority.name,
        reason,
    };
}

/**
 * Get routing suggestion for an issue (without persisting)
 * Used for display in admin dashboard
 */
export async function getRoutingSuggestion(
    categoryName: string,
    locationType: LocationType
): Promise<{
    suggested_authority: string;
    reason: string;
    confidence: 'high' | 'medium' | 'low';
}> {
    const { authority_name, reason } = determineAuthority({
        category_name: categoryName,
        location_type: locationType,
    });

    // Determine confidence based on routing type
    const categoryLower = categoryName.toLowerCase();
    let confidence: 'high' | 'medium' | 'low';

    if (categoryLower in FIXED_ROUTING) {
        confidence = 'high';
    } else if (locationType === 'hostel' && PROVOST_HOSTEL_CATEGORIES.includes(categoryLower)) {
        confidence = 'high';
    } else {
        confidence = 'medium';
    }

    return {
        suggested_authority: authority_name,
        reason,
        confidence,
    };
}
