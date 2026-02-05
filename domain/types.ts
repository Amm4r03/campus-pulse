/**
 * Campus Pulse - Domain Types
 * Shared type definitions for frontend and backend
 */

// =============================================================================
// ENUMS
// =============================================================================

export type IssueStatus = 'open' | 'in_progress' | 'resolved';

export type ImpactScope = 'single' | 'multi';

export type LocationType = 'hostel' | 'academic_block' | 'common_area' | 'hospital' | 'sports' | 'canteen';

export type ActionType = 'assign' | 'override_priority' | 'resolve' | 'reopen' | 'change_status';

export type UserRole = 'student' | 'admin';

// =============================================================================
// DATABASE ENTITIES
// =============================================================================

export interface Role {
    id: string;
    name: UserRole;
    created_at: string;
}

export interface User {
    id: string;
    role_id: string;
    created_at: string;
}

export interface Authority {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
}

export interface IssueCategory {
    id: string;
    name: string;
    default_authority_id: string;
    is_environmental: boolean;
    created_at: string;
}

export interface Location {
    id: string;
    name: string;
    type: LocationType;
    latitude: number | null;
    longitude: number | null;
    radius_meters: number;
    is_active: boolean;
    created_at: string;
}

export interface IssueReport {
    id: string;
    reporter_id: string;
    title: string;
    description: string;
    category_id: string;
    location_id: string;
    created_at: string;
}

export interface AggregatedIssue {
    id: string;
    canonical_category_id: string;
    location_id: string;
    authority_id: string;
    status: IssueStatus;
    created_at: string;
    updated_at: string;
}

export interface IssueAggregationMap {
    id: string;
    issue_report_id: string;
    aggregated_issue_id: string;
    created_at: string;
}

export interface AutomationMetadata {
    id: string;
    issue_report_id: string;
    extracted_category: string;
    urgency_score: number;
    impact_scope: ImpactScope;
    environmental_flag: boolean;
    confidence_score: number;
    raw_model_output: Record<string, unknown> | null;
    created_at: string;
}

export interface PrioritySnapshot {
    id: string;
    aggregated_issue_id: string;
    priority_score: number;
    urgency_component: number | null;
    impact_component: number | null;
    frequency_component: number | null;
    environmental_component: number | null;
    calculated_at: string;
}

export interface FrequencyMetric {
    id: string;
    aggregated_issue_id: string;
    window_minutes: number;
    report_count: number;
    calculated_at: string;
}

export interface AdminAction {
    id: string;
    admin_id: string;
    aggregated_issue_id: string;
    action_type: ActionType;
    previous_value: Record<string, unknown> | null;
    new_value: Record<string, unknown> | null;
    notes: string | null;
    created_at: string;
}

// =============================================================================
// VIEW TYPES (For dashboard queries)
// =============================================================================

export interface AggregatedIssueDashboard {
    id: string;
    status: IssueStatus;
    created_at: string;
    updated_at: string;
    category_name: string;
    is_environmental: boolean;
    location_name: string;
    location_type: LocationType;
    authority_name: string;
    total_reports: number;
    first_report_time: string;
    latest_report_time: string;
    current_priority: number | null;
    reports_last_30_min: number | null;
}

export interface StudentReportView {
    id: string;
    reporter_id: string;
    title: string;
    description: string;
    created_at: string;
    category_name: string;
    location_name: string;
    issue_status: IssueStatus | null;
    is_aggregated: boolean;
}

// =============================================================================
// API REQUEST TYPES
// =============================================================================

export interface CreateIssueRequest {
    title: string;
    description: string;
    category_id: string;
    location_id: string;
}

export interface TriageRequest {
    issue_report_id: string;
    title: string;
    description: string;
}

export interface AdminActionRequest {
    action_type: ActionType;
    new_value?: {
        authority_id?: string;
        priority_score?: number;
        status?: IssueStatus;
    };
    notes?: string;
}

export interface AdminIssuesQueryParams {
    status?: IssueStatus | 'all';
    authority_id?: string;
    category_id?: string;
    sort_by?: 'priority' | 'created_at' | 'report_count';
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
}

export interface CreateIssueResponse {
    issue_id: string;
    aggregated_issue_id: string;
    aggregation_status: 'new' | 'linked';
    initial_priority: number;
}

export interface TriageResponse {
    extracted_category: string;
    urgency_score: number;
    impact_scope: ImpactScope;
    environmental_flag: boolean;
    confidence_score: number;
    raw_model_output: Record<string, unknown>;
}

export interface AdminIssueDetailResponse {
    issue: {
        id: string;
        status: IssueStatus;
        category: {
            id: string;
            name: string;
            is_environmental: boolean;
        };
        location: {
            id: string;
            name: string;
            type: LocationType;
            latitude: number | null;
            longitude: number | null;
        };
        authority: {
            id: string;
            name: string;
            description: string | null;
        };
        metrics: {
            total_reports: number;
            first_report_time: string;
            latest_report_time: string;
            current_priority: number;
            priority_breakdown: {
                urgency_component: number;
                impact_component: number;
                frequency_component: number;
                environmental_component: number;
            };
            reports_last_30_min: number;
        };
        created_at: string;
        updated_at: string;
    };
    linked_reports: Array<{
        id: string;
        title: string;
        description: string;
        created_at: string;
        automation: {
            urgency_score: number;
            impact_scope: ImpactScope;
            confidence_score: number;
        } | null;
    }>;
    admin_actions: Array<{
        id: string;
        action_type: ActionType;
        notes: string | null;
        created_at: string;
    }>;
}

export interface PaginatedResponse<T> {
    items: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
    };
}

// =============================================================================
// AUTOMATION TYPES (For Gemini integration)
// =============================================================================

export interface AutomationInput {
    title: string;
    description: string;
}

export interface AutomationOutput {
    extracted_category: string;
    urgency_score: number;
    impact_scope: ImpactScope;
    environmental_flag: boolean;
    confidence_score: number;
    reasoning: string;
}

// =============================================================================
// PRIORITY CALCULATION TYPES
// =============================================================================

export interface PriorityInput {
    urgency_score: number;
    is_environmental: boolean;
    report_count: number;
    reports_last_30_min: number;
}

export interface PriorityBreakdown {
    urgency_component: number;
    impact_component: number;
    frequency_component: number;
    environmental_component: number;
    total_score: number;
}

// =============================================================================
// ROUTING TYPES
// =============================================================================

export interface RoutingInput {
    category_name: string;
    location_type: LocationType;
}

export interface RoutingResult {
    authority_id: string;
    authority_name: string;
    reason: string;
}

// =============================================================================
// ERROR CODES
// =============================================================================

export const ErrorCodes = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    SERVER_ERROR: 'SERVER_ERROR',
    AUTOMATION_ERROR: 'AUTOMATION_ERROR',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];
