-- ============================================================================
-- CAMPUS PULSE DATABASE SCHEMA
-- Jamia Hamdard Issue Triage & Automation Portal
-- ============================================================================
-- Design Principles:
-- 1. Every student submission is immutable
-- 2. Aggregation is explicit, not inferred
-- 3. State transitions are auditable
-- 4. Priority is derived, not manually overwritten
-- 5. All writes affecting aggregation happen atomically
-- 6. Student identity is abstracted (authenticated, not identifiable to admins)
-- 7. Prevents N+1 queries by design with proper indexing
-- 8. ACID compliant with transaction support
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ROLES TABLE
-- ============================================================================
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE CHECK (name IN ('student', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default roles
INSERT INTO roles (name) VALUES ('student'), ('admin');

-- ============================================================================
-- USERS TABLE
-- Links to Supabase Auth (auth.users)
-- Students are anonymous beyond authentication - no PII stored
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_role ON users(role_id);

-- ============================================================================
-- AUTHORITIES TABLE
-- Jamia Hamdard specific departments/authorities for issue routing
-- ============================================================================
CREATE TABLE authorities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Jamia Hamdard authorities
INSERT INTO authorities (name, description) VALUES
    ('Provost', 'Handles hostel issues, hostel water/electricity issues'),
    ('Administrative Office', 'Handles classroom water/electricity, sanitation issues'),
    ('Security In-Charge', 'Handles safety and security issues'),
    ('Academic Affairs', 'Handles academic scheduling, results, department issues');

-- ============================================================================
-- ISSUE CATEGORIES TABLE
-- Categories with default routing and environmental flags
-- ============================================================================
CREATE TABLE issue_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    default_authority_id UUID NOT NULL REFERENCES authorities(id),
    is_environmental BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_issue_categories_authority ON issue_categories(default_authority_id);

-- Seed categories (authority IDs will be populated after authorities are created)
-- This is done via a separate insert using subqueries

INSERT INTO issue_categories (name, default_authority_id, is_environmental) VALUES
    ('wifi', (SELECT id FROM authorities WHERE name = 'Administrative Office'), FALSE),
    ('water', (SELECT id FROM authorities WHERE name = 'Administrative Office'), TRUE),
    ('sanitation', (SELECT id FROM authorities WHERE name = 'Administrative Office'), TRUE),
    ('electricity', (SELECT id FROM authorities WHERE name = 'Administrative Office'), TRUE),
    ('hostel', (SELECT id FROM authorities WHERE name = 'Provost'), FALSE),
    ('academics', (SELECT id FROM authorities WHERE name = 'Academic Affairs'), FALSE),
    ('safety', (SELECT id FROM authorities WHERE name = 'Security In-Charge'), FALSE),
    ('food', (SELECT id FROM authorities WHERE name = 'Provost'), FALSE),
    ('infrastructure', (SELECT id FROM authorities WHERE name = 'Administrative Office'), TRUE);

-- ============================================================================
-- LOCATIONS TABLE
-- Hardcoded Jamia Hamdard campus zones
-- ============================================================================
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('hostel', 'academic_block', 'common_area', 'hospital', 'sports', 'canteen')),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    radius_meters NUMERIC(8, 2) DEFAULT 50,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_locations_type ON locations(type);
CREATE INDEX idx_locations_active ON locations(is_active) WHERE is_active = TRUE;

-- Seed Jamia Hamdard locations (approximate coordinates)
INSERT INTO locations (name, type, latitude, longitude) VALUES
    -- Hostels
    ('Boys Hostel A', 'hostel', 28.5494, 77.2805),
    ('Boys Hostel B', 'hostel', 28.5496, 77.2808),
    ('Boys Hostel C', 'hostel', 28.5498, 77.2810),
    ('Girls Hostel A', 'hostel', 28.5500, 77.2815),
    ('Girls Hostel B', 'hostel', 28.5502, 77.2818),
    -- Academic Blocks
    ('Faculty of Pharmacy', 'academic_block', 28.5485, 77.2800),
    ('Faculty of Medicine', 'academic_block', 28.5480, 77.2795),
    ('Faculty of Nursing', 'academic_block', 28.5475, 77.2790),
    ('Faculty of Science', 'academic_block', 28.5470, 77.2785),
    ('Faculty of Management', 'academic_block', 28.5465, 77.2780),
    ('Faculty of Engineering', 'academic_block', 28.5460, 77.2775),
    -- Common Areas
    ('Central Library', 'common_area', 28.5490, 77.2800),
    ('Administration Block', 'common_area', 28.5488, 77.2798),
    ('Examination Hall', 'common_area', 28.5486, 77.2796),
    -- Hospital
    ('HAH Centenary Hospital', 'hospital', 28.5510, 77.2820),
    -- Sports
    ('Sports Complex', 'sports', 28.5520, 77.2830),
    ('Cricket Ground', 'sports', 28.5525, 77.2835),
    -- Canteens
    ('Main Canteen', 'canteen', 28.5492, 77.2802),
    ('Hostel Canteen', 'canteen', 28.5494, 77.2804);

-- ============================================================================
-- ISSUE REPORTS TABLE (IMMUTABLE)
-- Raw student submissions - write-once, never updated or deleted
-- ============================================================================
CREATE TABLE issue_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES users(id),
    title TEXT NOT NULL CHECK (char_length(title) >= 5),
    description TEXT NOT NULL CHECK (char_length(description) >= 20),
    category_id UUID NOT NULL REFERENCES issue_categories(id),
    location_id UUID NOT NULL REFERENCES locations(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX idx_issue_reports_reporter ON issue_reports(reporter_id);
CREATE INDEX idx_issue_reports_category ON issue_reports(category_id);
CREATE INDEX idx_issue_reports_location ON issue_reports(location_id);
CREATE INDEX idx_issue_reports_created_at ON issue_reports(created_at DESC);
-- Composite index for aggregation lookups
CREATE INDEX idx_issue_reports_cat_loc_time ON issue_reports(category_id, location_id, created_at DESC);

-- ============================================================================
-- AGGREGATED ISSUES TABLE
-- Parent entity representing a real-world problem
-- ============================================================================
CREATE TABLE aggregated_issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    canonical_category_id UUID NOT NULL REFERENCES issue_categories(id),
    location_id UUID NOT NULL REFERENCES locations(id),
    authority_id UUID NOT NULL REFERENCES authorities(id),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for admin dashboard queries
CREATE INDEX idx_aggregated_issues_status ON aggregated_issues(status);
CREATE INDEX idx_aggregated_issues_authority ON aggregated_issues(authority_id);
CREATE INDEX idx_aggregated_issues_category ON aggregated_issues(canonical_category_id);
CREATE INDEX idx_aggregated_issues_location ON aggregated_issues(location_id);
-- Composite index for finding open issues by category and location (for aggregation)
CREATE INDEX idx_aggregated_issues_open_cat_loc ON aggregated_issues(canonical_category_id, location_id) 
    WHERE status = 'open';

-- ============================================================================
-- ISSUE AGGREGATION MAP TABLE
-- Links individual reports to their parent aggregated issue
-- ============================================================================
CREATE TABLE issue_aggregation_map (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    issue_report_id UUID NOT NULL UNIQUE REFERENCES issue_reports(id),
    aggregated_issue_id UUID NOT NULL REFERENCES aggregated_issues(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_aggregation_map_report ON issue_aggregation_map(issue_report_id);
CREATE INDEX idx_aggregation_map_aggregated ON issue_aggregation_map(aggregated_issue_id);

-- ============================================================================
-- AUTOMATION METADATA TABLE
-- Stores LLM/automation outputs per report for auditability
-- ============================================================================
CREATE TABLE automation_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    issue_report_id UUID NOT NULL UNIQUE REFERENCES issue_reports(id),
    extracted_category TEXT NOT NULL,
    urgency_score NUMERIC(3, 2) CHECK (urgency_score >= 0 AND urgency_score <= 1),
    impact_scope TEXT NOT NULL CHECK (impact_scope IN ('single', 'multi')),
    environmental_flag BOOLEAN DEFAULT FALSE,
    confidence_score NUMERIC(3, 2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    raw_model_output JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_automation_metadata_report ON automation_metadata(issue_report_id);

-- ============================================================================
-- PRIORITY SNAPSHOTS TABLE
-- Priority is recalculated on each write, historical snapshots preserved
-- ============================================================================
CREATE TABLE priority_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aggregated_issue_id UUID NOT NULL REFERENCES aggregated_issues(id),
    priority_score NUMERIC(5, 2) NOT NULL,
    urgency_component NUMERIC(3, 2),
    impact_component NUMERIC(3, 2),
    frequency_component NUMERIC(3, 2),
    environmental_component NUMERIC(3, 2),
    calculated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_priority_snapshots_aggregated ON priority_snapshots(aggregated_issue_id);
CREATE INDEX idx_priority_snapshots_calculated ON priority_snapshots(calculated_at DESC);
-- Index for getting latest priority per aggregated issue
CREATE INDEX idx_priority_snapshots_latest ON priority_snapshots(aggregated_issue_id, calculated_at DESC);

-- ============================================================================
-- FREQUENCY METRICS TABLE
-- Tracks "X reports in last 30 minutes" for escalation
-- ============================================================================
CREATE TABLE frequency_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aggregated_issue_id UUID NOT NULL REFERENCES aggregated_issues(id),
    window_minutes INTEGER NOT NULL DEFAULT 30,
    report_count INTEGER NOT NULL DEFAULT 0,
    calculated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_frequency_metrics_aggregated ON frequency_metrics(aggregated_issue_id);
CREATE INDEX idx_frequency_metrics_calculated ON frequency_metrics(calculated_at DESC);

-- ============================================================================
-- ADMIN ACTIONS LOG TABLE
-- Full audit trail of admin decisions
-- ============================================================================
CREATE TABLE admin_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES users(id),
    aggregated_issue_id UUID NOT NULL REFERENCES aggregated_issues(id),
    action_type TEXT NOT NULL CHECK (action_type IN ('assign', 'override_priority', 'resolve', 'reopen', 'change_status')),
    previous_value JSONB,
    new_value JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_actions_admin ON admin_actions(admin_id);
CREATE INDEX idx_admin_actions_aggregated ON admin_actions(aggregated_issue_id);
CREATE INDEX idx_admin_actions_created ON admin_actions(created_at DESC);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES (Prevents N+1 queries)
-- ============================================================================

-- View: Aggregated issues with report counts and latest priority
-- View: Aggregated issues with report counts and latest priority.
-- Uses only joined names (category_name, location_name, authority_name) for display and filtering; no schema change required.
CREATE OR REPLACE VIEW v_aggregated_issues_dashboard AS
SELECT 
    ai.id,
    ai.status,
    ai.created_at,
    ai.updated_at,
    ic.name AS category_name,
    ic.is_environmental,
    l.name AS location_name,
    l.type AS location_type,
    a.name AS authority_name,
    COUNT(DISTINCT iam.id) AS total_reports,
    MIN(ir.created_at) AS first_report_time,
    MAX(ir.created_at) AS latest_report_time,
    ps.priority_score AS current_priority,
    fm.report_count AS reports_last_30_min
FROM aggregated_issues ai
LEFT JOIN issue_categories ic ON ai.canonical_category_id = ic.id
LEFT JOIN locations l ON ai.location_id = l.id
LEFT JOIN authorities a ON ai.authority_id = a.id
LEFT JOIN issue_aggregation_map iam ON ai.id = iam.aggregated_issue_id
LEFT JOIN issue_reports ir ON iam.issue_report_id = ir.id
LEFT JOIN LATERAL (
    SELECT priority_score 
    FROM priority_snapshots 
    WHERE aggregated_issue_id = ai.id 
    ORDER BY calculated_at DESC 
    LIMIT 1
) ps ON TRUE
LEFT JOIN LATERAL (
    SELECT report_count 
    FROM frequency_metrics 
    WHERE aggregated_issue_id = ai.id 
    ORDER BY calculated_at DESC 
    LIMIT 1
) fm ON TRUE
GROUP BY ai.id, ai.status, ai.created_at, ai.updated_at, 
         ic.name, ic.is_environmental, l.name, l.type, a.name,
         ps.priority_score, fm.report_count;

-- View: Student's own reports (without exposing to admin)
CREATE OR REPLACE VIEW v_student_reports AS
SELECT 
    ir.id,
    ir.reporter_id,
    ir.title,
    ir.description,
    ir.created_at,
    ic.name AS category_name,
    l.name AS location_name,
    ai.status AS issue_status,
    CASE WHEN COUNT(*) OVER (PARTITION BY ai.id) > 1 THEN TRUE ELSE FALSE END AS is_aggregated
FROM issue_reports ir
LEFT JOIN issue_categories ic ON ir.category_id = ic.id
LEFT JOIN locations l ON ir.location_id = l.id
LEFT JOIN issue_aggregation_map iam ON ir.id = iam.issue_report_id
LEFT JOIN aggregated_issues ai ON iam.aggregated_issue_id = ai.id;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE aggregated_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_aggregation_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE priority_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE frequency_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Issue reports policies (students can only see their own)
CREATE POLICY "Students can view own reports" ON issue_reports
    FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Students can create reports" ON issue_reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Admin can view all issue reports but NOT the reporter_id (handled in API layer)
CREATE POLICY "Admins can view all reports" ON issue_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.id = auth.uid() AND r.name = 'admin'
        )
    );

-- Aggregated issues policies
CREATE POLICY "Anyone authenticated can view aggregated issues" ON aggregated_issues
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can update aggregated issues" ON aggregated_issues
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.id = auth.uid() AND r.name = 'admin'
        )
    );

-- Service role can insert aggregated issues (for automation pipeline)
CREATE POLICY "Service role can insert aggregated issues" ON aggregated_issues
    FOR INSERT WITH CHECK (TRUE);

-- Issue aggregation map policies
CREATE POLICY "Anyone authenticated can view aggregation map" ON issue_aggregation_map
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Service role can insert aggregation map" ON issue_aggregation_map
    FOR INSERT WITH CHECK (TRUE);

-- Automation metadata policies
CREATE POLICY "Admins can view automation metadata" ON automation_metadata
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.id = auth.uid() AND r.name = 'admin'
        )
    );

CREATE POLICY "Service role can insert automation metadata" ON automation_metadata
    FOR INSERT WITH CHECK (TRUE);

-- Priority snapshots policies
CREATE POLICY "Anyone authenticated can view priority snapshots" ON priority_snapshots
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Service role can insert priority snapshots" ON priority_snapshots
    FOR INSERT WITH CHECK (TRUE);

-- Frequency metrics policies
CREATE POLICY "Anyone authenticated can view frequency metrics" ON frequency_metrics
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Service role can insert frequency metrics" ON frequency_metrics
    FOR INSERT WITH CHECK (TRUE);

-- Admin actions policies
CREATE POLICY "Admins can view admin actions" ON admin_actions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.id = auth.uid() AND r.name = 'admin'
        )
    );

CREATE POLICY "Admins can create admin actions" ON admin_actions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.id = auth.uid() AND r.name = 'admin'
        )
    );

-- ============================================================================
-- FUNCTIONS FOR ATOMIC OPERATIONS
-- ============================================================================

-- Function to calculate frequency metrics for an aggregated issue
CREATE OR REPLACE FUNCTION calculate_frequency_metrics(p_aggregated_issue_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_report_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO v_report_count
    FROM issue_aggregation_map iam
    JOIN issue_reports ir ON iam.issue_report_id = ir.id
    WHERE iam.aggregated_issue_id = p_aggregated_issue_id
    AND ir.created_at >= NOW() - INTERVAL '30 minutes';
    
    INSERT INTO frequency_metrics (aggregated_issue_id, window_minutes, report_count)
    VALUES (p_aggregated_issue_id, 30, v_report_count);
    
    RETURN v_report_count;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate priority score
CREATE OR REPLACE FUNCTION calculate_priority_score(
    p_aggregated_issue_id UUID,
    p_urgency NUMERIC,
    p_is_environmental BOOLEAN,
    p_report_count INTEGER
)
RETURNS NUMERIC AS $$
DECLARE
    v_urgency_component NUMERIC;
    v_impact_component NUMERIC;
    v_frequency_component NUMERIC;
    v_environmental_component NUMERIC;
    v_priority_score NUMERIC;
BEGIN
    -- Urgency component (0-1 scaled to 0-25)
    v_urgency_component := COALESCE(p_urgency, 0.5) * 25;
    
    -- Impact component based on report count (logarithmic scaling, max 25)
    v_impact_component := LEAST(LN(GREATEST(p_report_count, 1) + 1) * 10, 25);
    
    -- Frequency component (reports in last 30 min, max 25)
    v_frequency_component := LEAST(p_report_count * 2.5, 25);
    
    -- Environmental bonus (0 or 25)
    v_environmental_component := CASE WHEN p_is_environmental THEN 25 ELSE 0 END;
    
    -- Total priority score (0-100 scale)
    v_priority_score := v_urgency_component + v_impact_component + v_frequency_component + v_environmental_component;
    
    -- Insert priority snapshot
    INSERT INTO priority_snapshots (
        aggregated_issue_id, 
        priority_score,
        urgency_component,
        impact_component,
        frequency_component,
        environmental_component
    ) VALUES (
        p_aggregated_issue_id,
        v_priority_score,
        v_urgency_component,
        v_impact_component,
        v_frequency_component,
        v_environmental_component
    );
    
    RETURN v_priority_score;
END;
$$ LANGUAGE plpgsql;

-- Function to find or create aggregated issue (for atomic aggregation)
CREATE OR REPLACE FUNCTION find_or_create_aggregated_issue(
    p_category_id UUID,
    p_location_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_aggregated_issue_id UUID;
    v_authority_id UUID;
BEGIN
    -- Try to find existing open aggregated issue
    SELECT id INTO v_aggregated_issue_id
    FROM aggregated_issues
    WHERE canonical_category_id = p_category_id
    AND location_id = p_location_id
    AND status = 'open'
    LIMIT 1;
    
    -- If no open issue exists, create new one
    IF v_aggregated_issue_id IS NULL THEN
        -- Get default authority for category
        SELECT default_authority_id INTO v_authority_id
        FROM issue_categories
        WHERE id = p_category_id;
        
        INSERT INTO aggregated_issues (canonical_category_id, location_id, authority_id)
        VALUES (p_category_id, p_location_id, v_authority_id)
        RETURNING id INTO v_aggregated_issue_id;
    END IF;
    
    RETURN v_aggregated_issue_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER TO UPDATE updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_aggregated_issues_updated_at
    BEFORE UPDATE ON aggregated_issues
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
