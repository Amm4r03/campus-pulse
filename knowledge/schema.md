## DATABASE SCHEMA – CAMPUS PULSE (JAMIA HAMDARD)

Design Principles

* Every student submission is immutable
* Aggregation is explicit, not inferred
* State transitions are auditable
* Priority is derived, not manually overwritten
* All writes affecting aggregation happen atomically
* Student identity is abstracted (authenticated, not identifiable)

---

## ROLES

roles

* id (uuid, pk)
* name (text)            // "student", "admin"

---

## USERS

users

* id (uuid, pk)
* role_id (uuid, fk → roles.id)
* created_at (timestamp)

Notes:

* Students are anonymous beyond authentication
* No PII fields stored
* Admins all share a single role

---

## LOCATIONS (HARDCODED FOR JAMIA HAMDARD)

locations

* id (uuid, pk)
* name (text)            // e.g. "Hostel A", "Library", "Sports Complex"
* type (text)            // hostel, academic_block, common_area
* ⁠latitude numeric
* ⁠longitude numeric
* is_active (boolean)
* ⁠radius_meters numeric

---

## DEPARTMENTS / AUTHORITIES

authorities

* id (uuid, pk)
* name (text)            // Provost, Admin Office, Security, Academic Affairs
* description (text)

---

## ISSUE CATEGORIES

issue_categories

* id (uuid, pk)
* name (text)            // wifi, water, sanitation, academics, safety
* default_authority_id (uuid, fk → authorities.id)
* is_environmental (boolean)

---

## RAW ISSUE REPORTS (IMMUTABLE)

issue_reports

* id (uuid, pk)
* reporter_id (uuid, fk → users.id)
* title (text)
* description (text)
* category_id (uuid, fk → issue_categories.id)
* location_id (uuid, fk → locations.id)
* created_at (timestamp)

Notes:

* This table is write-once
* Never updated or deleted
* Each row represents a single student report

---

## AGGREGATED ISSUES (PARENT ENTITY)

aggregated_issues

* id (uuid, pk)
* canonical_category_id (uuid, fk → issue_categories.id)
* location_id (uuid, fk → locations.id)
* authority_id (uuid, fk → authorities.id)
* status (text)          // open, in_progress, resolved
* created_at (timestamp)
* updated_at (timestamp)

Notes:

* One aggregated issue per real-world problem
* Can have many linked reports
* Status managed by admin actions

---

## REPORT → AGGREGATE MAPPING

issue_aggregation_map

* id (uuid, pk)
* issue_report_id (uuid, fk → issue_reports.id)
* aggregated_issue_id (uuid, fk → aggregated_issues.id)
* created_at (timestamp)

Notes:

* Enables atomic aggregation
* Supports re-aggregation if logic improves later

---

## AUTOMATION METADATA (AUDITABLE)

automation_metadata

* id (uuid, pk)
* issue_report_id (uuid, fk → issue_reports.id)
* extracted_category (text)
* urgency_score (numeric)
* impact_scope (text)     // single, multi
* environmental_flag (boolean)
* confidence_score (numeric)
* raw_model_output (jsonb)
* created_at (timestamp)

Notes:

* Stored per report for auditability
* Raw LLM output preserved

---

## PRIORITY SNAPSHOTS

priority_snapshots

* id (uuid, pk)
* aggregated_issue_id (uuid, fk → aggregated_issues.id)
* priority_score (numeric)
* calculated_at (timestamp)

Notes:

* Priority is recalculated, not overwritten
* Latest row represents current priority
* Historical priorities preserved

---

## FREQUENCY METRICS

frequency_metrics

* id (uuid, pk)
* aggregated_issue_id (uuid, fk → aggregated_issues.id)
* window_minutes (integer)    // e.g. 10, 30
* report_count (integer)
* calculated_at (timestamp)

Notes:

* Enables “X reports in Y minutes”
* Can be recomputed periodically or on write

---

## ADMIN ACTION LOG

admin_actions

* id (uuid, pk)
* admin_id (uuid, fk → users.id)
* aggregated_issue_id (uuid, fk → aggregated_issues.id)
* action_type (text)      // assign, override_priority, resolve
* notes (text)
* created_at (timestamp)

Notes:

* Full audit trail
* Critical for judge questions

---

## ATOMIC TRANSACTION FLOW (CRITICAL)

On Issue Submission:

1. Insert into issue_reports
2. Run automation extraction
3. Insert automation_metadata
4. Check for similar aggregated_issues
5. Either:

   * create new aggregated_issue
   * OR link to existing via issue_aggregation_map
6. Recalculate:

   * frequency_metrics
   * priority_snapshots
     All inside a single transaction block.

If any step fails, nothing is partially written.

---

## STATE MANAGEMENT SUMMARY

Issue States:

* issue_reports: immutable, no state
* aggregated_issues.status:

  * open
  * in_progress
  * resolved

Priority State:

* Derived from latest priority_snapshot
* Admin override recorded as admin_action, not mutation

User State:

* users.role determines access
* students anonymous, admins visible internally

---

## WHY THIS SCHEMA HOLDS UP

* Scales from hackathon to production
* No destructive updates
* Supports future ML improvements
* Supports frequency-based escalation
* Fully auditable automation decisions

---

## FINAL CONFIRMATION

Confirm these before implementation:

1. Do you want resolved aggregated issues to accept new reports or auto-create a new issue?
2. Should priority recalc happen on every write or on a timed job?
3. Should frequency windows be fixed (10/30 min) or configurable?

Answer these and the backend design is effectively locked.