API CONTRACTS
API CONTRACTS (INTERNAL)

POST /api/issues/create
Input:

title

description

category

location_id

Output:

issue_id

aggregation_status

initial_priority

POST /api/issues/triage
Internal

Runs automation pipeline

Handles aggregation and frequency update

GET /api/issues/admin
Output:

aggregated issues

priority-sorted

includes frequency metrics

GET /api/issues/{id}
Output:

parent issue metadata

linked reports

automation signals

POST /api/issues/{id}/action
Input:

action_type (assign | resolve | override_priority | reopen | change_status)

new_value (e.g. authority_id for assign, status for change_status)

notes (optional; used for resolution notes on resolve)

GET /api/authorities — Admin. List authorities for assign dropdown.
GET /api/stats/locations/most-reported — Admin. Most-reported location for dashboard.
GET /api/stats/resolved — Admin. resolved_count, resolved_today_count from DB.
GET /api/issues/admin/spam — Admin. List spam reports; count for nav badge.
POST /api/issues/admin/spam/{reportId}/mark-not-spam — Admin. Mark not spam (training feedback).
GET /api/issues/admin/reports — Admin. Paginated list of all reports.
POST /api/issues/smart-check — Quick spam check (title + description).
POST /api/issues/create/stream — Student. Create with SSE progress.