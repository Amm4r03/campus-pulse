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

action_type

override_priority (optional)

notes