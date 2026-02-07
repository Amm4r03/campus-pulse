BACKEND FEATURES
Automated Triage Pipeline
Triggered on each submission:

Extract true issue category

Estimate urgency

Detect infrastructure/environment relevance

Assign confidence score

Spam/NSFW detection (rule-based + LLM): report_type and spam_confidence stored in automation_metadata.raw_model_output; reports classified as spam are still saved but can be reviewed in admin Spam tab

Aggregation Logic (No Suppression)

Each new report is checked against open issues

Similar reports are linked to a parent issue

Parent issue maintains:

total_reports

first_report_time

latest_report_time

Frequency Metric Logic
For each aggregated issue:

Track timestamps of linked reports

Compute rolling frequency window:

reports_last_10_minutes

reports_last_30_minutes

Example admin signal:
“10 reports in 18 minutes”

This frequency directly increases impact score.

Priority Calculation
Priority is recalculated dynamically using:

urgency score

impact scope (single vs multi-student)

report frequency

infrastructure/environment weight

Routing Recommendation (Jamia Hamdard-Specific)

Hostel issues → Provost

Water/Electricity (classrooms) → Administrative Office

Water/Electricity (hostels) → Provost

Sanitation → Administrative Office

Safety → Security In-Charge

Academic scheduling/results → Academic Affairs / Department Office

Admins can override routing.

Resolved Issues and Analytics
Resolved issues are never deleted; only status is set to resolved. Updated_at is set on status change. Resolved count and resolved-today count are served from the database (GET /api/stats/resolved) for dashboard and analytics.

Admin Spam Review
Admins can list reports classified as spam (GET /api/issues/admin/spam) and mark any as "not spam" (POST .../mark-not-spam). The correction is stored in raw_model_output (admin_marked_not_spam) for future spam-model training.

Streaming Create and Smart-Check
POST /api/issues/create/stream supports SSE progress during triage. POST /api/issues/smart-check provides a quick spam check before full submission.