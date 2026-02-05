DOMAIN MODEL AND STATES
Purpose
Stops the agent from inventing states, flows, or lifecycle steps.

Content

Core domain entities:

Issue Report (immutable, per-student submission)

Aggregated Issue (represents a real-world problem)

Location (predefined campus zones)

Authority (provost, admin office, security, academic affairs)

Issue states (aggregated issues only):

open

in_progress

resolved

State rules:

Issue reports have no state

Aggregated issues change state only via admin action

Resolved issues are never reopened automatically

Location handling:

Locations are predefined

Each location has latitude and longitude

Locations represent campus zones, not user GPS data