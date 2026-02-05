# API Contracts

Complete API specification for Campus Pulse backend.

---

## Authentication

All endpoints require Supabase Auth. Include the JWT token in the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

---

## Endpoints

### POST /api/issues/create

**Role:** Student

Create a new issue report. Triggers the full automation pipeline (Gemini analysis → aggregation → priority calculation → routing).

**Request:**
```json
{
  "title": "string (min 5 chars)",
  "description": "string (min 20 chars)",
  "category_id": "uuid",
  "location_id": "uuid"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "issue_id": "uuid",
    "aggregated_issue_id": "uuid",
    "aggregation_status": "new | linked",
    "initial_priority": 52.5
  }
}
```

---

### POST /api/issues/triage

**Role:** Internal (service role)

Run Gemini analysis on issue text. Returns structured triage data.

**Request:**
```json
{
  "issue_report_id": "uuid",
  "title": "string",
  "description": "string"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "extracted_category": "wifi | water | sanitation | electricity | hostel | academics | safety | food | infrastructure",
    "urgency_score": 0.7,
    "impact_scope": "single | multi",
    "environmental_flag": true,
    "confidence_score": 0.85,
    "raw_model_output": {
      "reasoning": "string"
    }
  }
}
```

### GET /api/issues/triage

**Role:** Any authenticated

Health check for Gemini integration.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "available": true
  }
}
```

---

### GET /api/issues/admin

**Role:** Admin

Fetch aggregated issues for dashboard. Returns priority-sorted list.

**Query Parameters:**
- `status`: `open | in_progress | resolved | all` (default: `open`)
- `authority_id`: Filter by authority
- `category_id`: Filter by category
- `sort_by`: `priority | created_at | report_count` (default: `priority`)
- `order`: `asc | desc` (default: `desc`)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "status": "open",
        "category_name": "wifi",
        "is_environmental": false,
        "location_name": "Boys Hostel Block A",
        "location_type": "hostel",
        "authority_name": "IT Department",
        "total_reports": 5,
        "first_report_time": "2026-02-05T10:00:00Z",
        "latest_report_time": "2026-02-05T10:30:00Z",
        "current_priority": 65.2,
        "reports_last_30_min": 3
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "total_pages": 8
    }
  }
}
```

---

### GET /api/issues/{id}

**Role:** Admin

Detailed view of an aggregated issue with linked reports (anonymized).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "issue": {
      "id": "uuid",
      "status": "open",
      "category": { "id": "uuid", "name": "wifi", "is_environmental": false },
      "location": { "id": "uuid", "name": "Boys Hostel", "type": "hostel" },
      "authority": { "id": "uuid", "name": "IT Department" },
      "metrics": {
        "total_reports": 5,
        "first_report_time": "2026-02-05T10:00:00Z",
        "latest_report_time": "2026-02-05T10:30:00Z",
        "current_priority": 65.2,
        "priority_breakdown": {
          "urgency_component": 24.5,
          "impact_component": 21.0,
          "frequency_component": 12.5,
          "environmental_component": 0,
          "raw_score": 58.0,
          "confidence_multiplier": 0.85,
          "total_score": 65.2
        },
        "reports_last_30_min": 3
      }
    },
    "linked_reports": [
      {
        "id": "uuid",
        "title": "WiFi not working",
        "description": "Cannot connect to internet since morning...",
        "created_at": "2026-02-05T10:00:00Z",
        "automation": {
          "urgency_score": 0.7,
          "impact_scope": "multi",
          "confidence_score": 0.85
        }
      }
    ],
    "admin_actions": [
      {
        "id": "uuid",
        "action_type": "assign",
        "notes": "Assigned to IT for investigation",
        "created_at": "2026-02-05T10:15:00Z"
      }
    ]
  }
}
```

> **Note:** `reporter_id` is NEVER included to maintain student anonymity.

---

### POST /api/issues/{id}/action

**Role:** Admin

Perform admin action on an aggregated issue.

**Request:**
```json
{
  "action_type": "assign | override_priority | resolve | reopen | change_status",
  "new_value": {
    "authority_id": "uuid",
    "priority_score": 80,
    "status": "in_progress"
  },
  "notes": "Optional notes for audit log"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "admin_id": "uuid",
    "aggregated_issue_id": "uuid",
    "action_type": "assign",
    "previous_value": { "authority_id": "old-uuid" },
    "new_value": { "authority_id": "new-uuid" },
    "notes": "Reassigned to maintenance",
    "created_at": "2026-02-05T10:20:00Z"
  }
}
```

---

### GET /api/student/issues

**Role:** Student

Fetch student's own submitted issues with status.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 50)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "WiFi not working",
        "description": "Cannot connect...",
        "created_at": "2026-02-05T10:00:00Z",
        "category_name": "wifi",
        "location_name": "Boys Hostel",
        "issue_status": "open",
        "is_aggregated": true
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 5, "total_pages": 1 }
  }
}
```

---

### GET /api/locations

**Role:** Any authenticated

Fetch all active campus locations.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Boys Hostel Block A",
      "type": "hostel",
      "latitude": 28.5432,
      "longitude": 77.2893,
      "radius_meters": 50,
      "is_active": true
    }
  ]
}
```

---

### GET /api/categories

**Role:** Any authenticated

Fetch all issue categories with default authority.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "wifi",
      "is_environmental": false,
      "default_authority": {
        "id": "uuid",
        "name": "IT Department"
      }
    }
  ]
}
```

---

## Priority Formula

### Final Locked Formula

```
Final Priority = R × C × 100
```

Where:
```
R = (U × 0.35) + (I × 0.30) + (F × 0.25) + (E × 0.10)
```

### Components

| Variable | Description | Range | Weight |
|----------|-------------|-------|--------|
| U | Urgency Score (from Gemini) | 0.0 – 1.0 | 35% |
| I | Impact Score | 0.0 – 1.0 | 30% |
| F | Frequency Score | 0.0 – 1.0 | 25% |
| E | Environmental Flag | 0 or 1 | 10% |
| C | Confidence Score | 0.0 – 1.0 | Multiplier |

### Impact Score Calculation

```
Base = 0.4 (single) or 0.7 (multi)
Boost = (report_count - 1) × 0.03
I = min(Base + Boost, 1.0)
```

### Frequency Score Calculation

```
F = min(reports_last_30_minutes / 10, 1.0)
```

### Example Calculations

| Case | U | Scope | Reports | Env | C | Priority |
|------|---|-------|---------|-----|---|----------|
| Serious single report | 0.8 | single | 1 | no | 0.9 | ~38 |
| Viral multi-issue | 0.5 | multi | 10 | yes | 0.8 | ~65 |
| Vague spam | 0.3 | single | 1 | no | 0.2 | ~5 |

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Invalid input data |
| UNAUTHORIZED | 401 | Missing or invalid token |
| FORBIDDEN | 403 | Insufficient role permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource state conflict |
| SERVER_ERROR | 500 | Internal server error |
| AUTOMATION_ERROR | 503 | Gemini API unavailable |

---

## Admin Override Rule

- Admins may override priority via `POST /api/issues/{id}/action`
- Override is logged but does NOT mutate the formula
- Automated priority continues to update in background
- UI should show both system and override priorities