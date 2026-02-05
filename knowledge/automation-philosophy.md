AUTOMATION
Purpose
This is the most important file. It defines “automation” precisely.

Content

Automation in Campus Pulse refers to automatic execution of operational decision steps that would otherwise be performed manually.

Automation includes:

Issue understanding from free-text

Urgency estimation

Impact detection (single vs multi-student)

Aggregation of similar reports

Frequency-based escalation

Priority calculation

Routing recommendation

Automation does NOT:

Resolve issues

Communicate with students

Make irreversible decisions

Aggregation rules:

Every report creates a new issue record

Aggregation is applied only against open issues

Resolved issues never accept new reports

Aggregation increases impact, not suppress reports

Priority rules:

Priority is recalculated on every write

Priority is derived, never overwritten

Manual overrides are logged, not destructive

Frequency rules:

Fixed 30-minute window

Admin-facing metric: “X reports in last 30 minutes”