USER_ROLES_ANDBEHAVIOR
Purpose
Prevents the agent from assuming extra roles, permissions, or identities.

Content

There are only two roles in the system:

Student

Authenticated

Anonymous to administrators

Can submit and track issues

Cannot see automation logic or priorities

Admin

Single unified admin role

Can view all aggregated issues

Sees automated priority ordering

Can override priority and routing manually

All admin actions are logged

Admins can review reports classified as spam and mark them "not spam"; this feedback is stored for future spam-model training.

Students may submit low-effort or vague reports.
The system should encourage structured reporting but never block submission aggressively.

Multiple students often report the same issue independently.