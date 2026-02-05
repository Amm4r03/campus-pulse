BACKEND FEATURES
Automated Triage Pipeline
Triggered on each submission:

Extract true issue category

Estimate urgency

Detect infrastructure/environment relevance

Assign confidence score

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