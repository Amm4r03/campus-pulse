# Campus Pulse API Contracts

## Overview

This document defines the API contracts for Campus Pulse backend. All endpoints are implemented as Next.js API routes or Server Actions using Supabase as the database layer.

**Base Path:** `/api`  
**Authentication:** Supabase Auth (JWT tokens)  
**Authorization:** Role-based (student, admin)

---

## Database Schema Reference

### Core Tables

| Table | Purpose |
|-------|---------|
| `roles` | User roles (student, admin) |
| `users` | User profiles linked to Supabase Auth |
| `authorities` | Jamia Hamdard departments for routing |
| `issue_categories` | Issue types with default routing |
| `locations` | Hardcoded campus zones |
| `issue_reports` | Immutable student submissions |
| `aggregated_issues` | Parent issues (real-world problems) |
| `issue_aggregation_map` | Links reports to aggregated issues |
| `automation_metadata` | LLM/automation outputs per report |
| `priority_snapshots` | Historical priority calculations |
| `frequency_metrics` | Reports-per-30-minutes metrics |
| `admin_actions` | Audit log of admin decisions |

---

## Endpoints

### 1. POST /api/issues/create

**Purpose:** Student submits a new issue report

**Authentication:** Required (Student role)

**Request Body:**
```json
{
  "title": "string (min 5 chars)",
  "description": "string (min 20 chars)",
  "category_id": "uuid",
  "location_id": "uuid"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "issue_id": "uuid",
    "aggregated_issue_id": "uuid",
    "aggregation_status": "new" | "linked",
    "initial_priority": "number (0-100)"
  }
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Description must be at least 20 characters"
  }
}
```

**Backend Flow (Atomic Transaction):**
1. Insert into `issue_reports`
2. Call automation triage (Gemini)
3. Insert into `automation_metadata`
4. Find or create `aggregated_issues`
5. Insert into `issue_aggregation_map`
6. Calculate and insert `frequency_metrics`
7. Calculate and insert `priority_snapshots`

---

### 2. POST /api/issues/triage (Internal)

**Purpose:** Runs automation pipeline on a report (called internally)

**Authentication:** Service role only

**Request Body:**
```json
{
  "issue_report_id": "uuid",
  "title": "string",
  "description": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "extracted_category": "string",
    "urgency_score": "number (0-1)",
    "impact_scope": "single" | "multi",
    "environmental_flag": "boolean",
    "confidence_score": "number (0-1)",
    "raw_model_output": "object"
  }
}
```

**Automation Logic (Gemini Integration):**
- Extract true issue category from free-text
- Estimate urgency (0-1 scale)
- Detect impact scope (single vs multi-student)
- Flag environmental/infrastructure issues
- Return confidence score

---

### 3. GET /api/issues/admin

**Purpose:** Fetch aggregated issues for admin dashboard

**Authentication:** Required (Admin role)

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | "open" | Filter by status (open, in_progress, resolved, all) |
| `authority_id` | uuid | - | Filter by authority |
| `category_id` | uuid | - | Filter by category |
| `sort_by` | string | "priority" | Sort field (priority, created_at, report_count) |
| `order` | string | "desc" | Sort order (asc, desc) |
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "issues": [
      {
        "id": "uuid",
        "status": "open",
        "category_name": "water",
        "location_name": "Boys Hostel A",
        "location_type": "hostel",
        "authority_name": "Provost",
        "is_environmental": true,
        "total_reports": 15,
        "first_report_time": "ISO8601",
        "latest_report_time": "ISO8601",
        "current_priority": 78.5,
        "reports_last_30_min": 8,
        "created_at": "ISO8601",
        "updated_at": "ISO8601"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "total_pages": 3
    }
  }
}
```

**Note:** Uses `v_aggregated_issues_dashboard` view to prevent N+1 queries.

---

### 4. GET /api/issues/{id}

**Purpose:** Get detailed view of an aggregated issue

**Authentication:** Required (Admin role)

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uuid | Aggregated issue ID |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "issue": {
      "id": "uuid",
      "status": "open",
      "category": {
        "id": "uuid",
        "name": "water",
        "is_environmental": true
      },
      "location": {
        "id": "uuid",
        "name": "Boys Hostel A",
        "type": "hostel",
        "latitude": 28.5494,
        "longitude": 77.2805
      },
      "authority": {
        "id": "uuid",
        "name": "Provost",
        "description": "Handles hostel issues"
      },
      "metrics": {
        "total_reports": 15,
        "first_report_time": "ISO8601",
        "latest_report_time": "ISO8601",
        "current_priority": 78.5,
        "priority_breakdown": {
          "urgency_component": 20.0,
          "impact_component": 18.5,
          "frequency_component": 20.0,
          "environmental_component": 25.0
        },
        "reports_last_30_min": 8
      },
      "created_at": "ISO8601",
      "updated_at": "ISO8601"
    },
    "linked_reports": [
      {
        "id": "uuid",
        "title": "No water in hostel",
        "description": "Water supply has been cut off since morning...",
        "created_at": "ISO8601",
        "automation": {
          "urgency_score": 0.85,
          "impact_scope": "multi",
          "confidence_score": 0.92
        }
      }
    ],
    "admin_actions": [
      {
        "id": "uuid",
        "action_type": "assign",
        "notes": "Escalated to provost",
        "created_at": "ISO8601"
      }
    ]
  }
}
```

**Note:** `reporter_id` is NOT included in `linked_reports` to maintain student anonymity.

---

### 5. POST /api/issues/{id}/action

**Purpose:** Admin performs action on an aggregated issue

**Authentication:** Required (Admin role)

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uuid | Aggregated issue ID |

**Request Body:**
```json
{
  "action_type": "assign" | "override_priority" | "resolve" | "reopen" | "change_status",
  "new_value": {
    "authority_id": "uuid",
    "priority_score": "number",
    "status": "in_progress" | "resolved"
  },
  "notes": "string (optional)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "action_id": "uuid",
    "aggregated_issue_id": "uuid",
    "action_type": "resolve",
    "previous_value": { "status": "in_progress" },
    "new_value": { "status": "resolved" },
    "created_at": "ISO8601"
  }
}
```

---

### 6. GET /api/student/issues

**Purpose:** Student views their own submitted issues

**Authentication:** Required (Student role)

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "issues": [
      {
        "id": "uuid",
        "title": "WiFi not working",
        "description": "WiFi has been down in library...",
        "category_name": "wifi",
        "location_name": "Central Library",
        "issue_status": "in_progress",
        "is_aggregated": true,
        "created_at": "ISO8601"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "total_pages": 1
    }
  }
}
```

---

### 7. GET /api/locations

**Purpose:** Fetch all active campus locations

**Authentication:** Required (Any role)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Boys Hostel A",
      "type": "hostel",
      "latitude": 28.5494,
      "longitude": 77.2805,
      "radius_meters": 50
    }
  ]
}
```

---

### 8. GET /api/categories

**Purpose:** Fetch all issue categories

**Authentication:** Required (Any role)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "water",
      "is_environmental": true,
      "default_authority": {
        "id": "uuid",
        "name": "Administrative Office"
      }
    }
  ]
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request body validation failed |
| `UNAUTHORIZED` | 401 | Missing or invalid auth token |
| `FORBIDDEN` | 403 | User lacks required role |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict (e.g., duplicate) |
| `SERVER_ERROR` | 500 | Internal server error |
| `AUTOMATION_ERROR` | 503 | Automation pipeline failed |

---

## Type Definitions

```typescript
// Domain Types (shared between frontend and backend)

type IssueStatus = 'open' | 'in_progress' | 'resolved';

type ImpactScope = 'single' | 'multi';

type LocationType = 'hostel' | 'academic_block' | 'common_area' | 'hospital' | 'sports' | 'canteen';

type ActionType = 'assign' | 'override_priority' | 'resolve' | 'reopen' | 'change_status';

interface IssueReport {
  id: string;
  reporter_id: string;
  title: string;
  description: string;
  category_id: string;
  location_id: string;
  created_at: string;
}

interface AggregatedIssue {
  id: string;
  canonical_category_id: string;
  location_id: string;
  authority_id: string;
  status: IssueStatus;
  created_at: string;
  updated_at: string;
}

interface AutomationMetadata {
  id: string;
  issue_report_id: string;
  extracted_category: string;
  urgency_score: number;
  impact_scope: ImpactScope;
  environmental_flag: boolean;
  confidence_score: number;
  raw_model_output: object;
  created_at: string;
}

interface PrioritySnapshot {
  id: string;
  aggregated_issue_id: string;
  priority_score: number;
  urgency_component: number;
  impact_component: number;
  frequency_component: number;
  environmental_component: number;
  calculated_at: string;
}

interface FrequencyMetric {
  id: string;
  aggregated_issue_id: string;
  window_minutes: number;
  report_count: number;
  calculated_at: string;
}

interface AdminAction {
  id: string;
  admin_id: string;
  aggregated_issue_id: string;
  action_type: ActionType;
  previous_value: object | null;
  new_value: object | null;
  notes: string | null;
  created_at: string;
}
```

---

## Automation Pipeline (Scaffolding)

The automation pipeline uses Gemini for issue understanding. The pipeline is triggered on each new issue submission.

### Pipeline Steps:

1. **Issue Understanding**
   - Input: title, description
   - Output: extracted_category

2. **Urgency Estimation**
   - Input: title, description, category
   - Output: urgency_score (0-1)

3. **Impact Detection**
   - Input: description
   - Output: impact_scope (single/multi)

4. **Environmental Flag**
   - Input: category, description
   - Output: environmental_flag (boolean)

5. **Confidence Scoring**
   - Input: all outputs
   - Output: confidence_score (0-1)

### Prompt Template (Gemini):

```
You are an issue triage assistant for Jamia Hamdard University campus.

Analyze this student-reported issue:
Title: {title}
Description: {description}

Respond in JSON format:
{
  "extracted_category": "one of: wifi, water, sanitation, electricity, hostel, academics, safety, food, infrastructure",
  "urgency_score": "number between 0 and 1",
  "impact_scope": "single or multi",
  "environmental_flag": "true or false",
  "confidence_score": "number between 0 and 1",
  "reasoning": "brief explanation"
}
```

---

## Routing Logic

| Issue Category | Location Type | Routed To |
|----------------|---------------|-----------|
| hostel, food | hostel | Provost |
| water, electricity | hostel | Provost |
| water, electricity | academic_block | Administrative Office |
| sanitation | any | Administrative Office |
| safety | any | Security In-Charge |
| academics | any | Academic Affairs |
| wifi, infrastructure | any | Administrative Office |

---

## Priority Calculation Formula

```
Priority Score = Urgency + Impact + Frequency + Environmental

Where:
- Urgency Component = urgency_score × 25
- Impact Component = min(ln(report_count + 1) × 10, 25)
- Frequency Component = min(reports_last_30_min × 2.5, 25)
- Environmental Component = is_environmental ? 25 : 0

Total: 0-100 scale
```
