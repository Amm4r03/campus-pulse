FRONTEND FEATURES
Student Issue Submission

Mandatory structured form:

Title

Detailed description (min length enforced)

Issue category

Location (selectable Jamia Hamdard campus map zones)

Formatting guidance shown to discourage low-effort reports

Location Selection (MVP)

Hardcoded campus areas:

Hostels (individual hostel names)

Academic blocks

Library

Sports complex

Hospital

Canteens

Map-based selection (visual aid, not geolocation)

Student Issue Tracking

View submitted issues

See whether issue is:

Standalone

Aggregated with others

See status updates

Admin Dashboard

Aggregated issue cards sorted by priority

Each card shows:

Issue type

Location

Automated priority

Number of reports

Frequency metric (e.g., “10 reports in 30 minutes”)

Environmental / infrastructure flag

Suggested authority

Admin Issue Detail View

List of all linked student reports

Automation breakdown (urgency, impact, frequency)

Manual override options

Admin Dashboard (Overview) – Recent Additions

Resolve modal: mark issue resolved with optional resolution notes (calls issue action API).

Assign authority modal: select authority from API list and assign to issue.

Stats grid: responsive grid (grid-cols-1 sm:grid-cols-2 lg:grid-cols-4); "High Volume Area" uses most-reported location from stats API; "Resolved Today" uses DB-backed resolved count (no hardcoded rate).

Active Issues vs Recently Resolved tabs: Active shows open + in_progress; Recently Resolved shows resolved issues (kept for analytics). Priority badge in table shows label and score (e.g. "High Priority (85/100)").

Spam tab: muted Spam nav item with muted badge count; dedicated Spam page lists flagged reports with "Mark as not spam" for training feedback.

Student Submit – Recent Additions

Smart questions modal and submission progress bar during create flow.

Crisis resources modal where appropriate.

Streaming create (SSE) for progress; spam rejection surfaced without full submit.