# Campus Pulse

**Smart Issue Triage and Automation Portal for Jamia Hamdard**

Campus Pulse is a centralized, web-based system that automates the triage, aggregation, prioritization, and routing of student-reported issues across Jamia Hamdard campus. It enables administrators to act on high-impact, multi-student, and infrastructure-related problems faster.

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Demo Mode](#demo-mode)
- [API Contracts](#api-contracts)
- [Database Schema](#database-schema)
- [Contributing](#contributing)

---

## Overview

Jamia Hamdard is a large, integrated campus with approximately 5,000-6,000 students. The campus includes academic departments, gender-segregated hostels, canteens, a hospital, sports complex, and common facilities. Currently, all student issue reporting is offline and fragmented.

Campus Pulse introduces automated decision support that surfaces urgency, frequency, and impact before human action, transforming reactive administration into proactive problem resolution.

### Goals

- Centralize all student issue reporting across departments and hostels
- Automatically aggregate similar complaints into single high-impact issues
- Dynamically prioritize issues based on urgency and reporting frequency
- Route issues to correct Jamia Hamdard authorities
- Improve accountability and response transparency

### Non-Goals

- No automated resolutions (human-in-the-loop required)
- No chatbot-based grievance handling
- No off-campus civic issue handling
- No predictive analytics beyond current reports

---

## Problem Statement

**Current State:**
- No centralized grievance portal exists
- Students must physically visit offices to report issues
- Repetitive complaints go unnoticed as patterns
- Infrastructure and environmental issues escalate late
- Administrative response is reactive, not prioritized

**Campus Pulse Solution:**
- Web-based issue submission with structured forms
- Automatic issue categorization and aggregation
- Frequency-based priority escalation
- Direct routing to responsible authorities
- Complete transparency and audit trail

---

## Features

### Student Portal

| Feature | Description |
|---------|-------------|
| Issue Submission | Structured form with title, description, category, and location selection |
| Issue Tracking | View submitted issues with status updates (open, in progress, resolved) |
| Aggregation Visibility | See if your issue has been linked with similar reports |
| Campus Status | Real-time view of ongoing campus-wide issues |
| Profile Management | View account information and submission history |

### Admin Dashboard

| Feature | Description |
|---------|-------------|
| Aggregated View | Issues grouped by similarity with report counts |
| Priority Sorting | Dynamic prioritization based on urgency and frequency |
| Frequency Metrics | "X reports in Y minutes" indicators |
| AI Analysis | Automated urgency and impact assessment |
| Authority Routing | Suggested department assignments |
| Priority Override | Manual adjustment capability |
| Action Logging | Full audit trail of administrative actions |

### Automation Pipeline

- **Issue Understanding**: Extracts true category from student descriptions
- **Urgency Detection**: Estimates time-sensitivity
- **Impact Assessment**: Single vs. multi-student impact scope
- **Aggregation**: Links similar reports to parent issues
- **Frequency Tracking**: Rolling window metrics (10min, 30min)
- **Priority Calculation**: Composite score from multiple signals

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Components | shadcn/ui (New York style) |
| State Management | Zustand |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Charts | Recharts |
| Notifications | Sonner |
| Database | Supabase (PostgreSQL) |
| AI/ML | Google Generative AI |

---

## Project Structure

```
campus-pulse/
├── app/                          # Next.js App Router
│   ├── (public)/                 # Public routes (landing, login)
│   ├── (student)/                # Student authenticated routes
│   │   ├── submit/               # Issue submission
│   │   ├── issues/               # Issue list and detail
│   │   └── profile/              # Student profile
│   ├── (admin)/                  # Admin authenticated routes
│   │   ├── dashboard/            # Overview and issue management
│   │   └── settings/             # Admin settings
│   └── api/                      # API routes
│
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── layout/                   # Layout components (navbar, sidebar, footer)
│   └── feedback/                 # Loading, empty, error states
│
├── stores/                       # Zustand state management
│   ├── auth-store.ts             # Authentication state
│   ├── issue-store.ts            # Student issues
│   ├── admin-store.ts            # Admin aggregated issues
│   └── ui-store.ts               # UI state (sidebar, modals, theme)
│
├── lib/
│   ├── data/                     # Mock data and static datasets
│   │   ├── locations.ts          # Campus locations
│   │   ├── categories.ts         # Issue categories
│   │   └── mock-issues.ts        # Sample issue data
│   └── utils.ts                  # Utility functions
│
├── types/                        # TypeScript type definitions
│   ├── index.ts                  # Domain models
│   └── forms.ts                  # Zod schemas
│
├── knowledge/                    # Project documentation
│   ├── PRD.md                    # Product requirements
│   ├── CONTEXT.md                # Campus context
│   ├── schema.md                 # Database schema
│   ├── api-contracts.md          # API specifications
│   ├── frontend-features.md      # Frontend feature list
│   ├── backend-features.md       # Backend feature list
│   └── branding-guide.md         # Visual identity guide
│
└── public/                       # Static assets
```

---

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/campus-pulse.git
cd campus-pulse

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`.

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase (required for production)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google AI (for automation pipeline)
GOOGLE_AI_API_KEY=your_google_ai_key

# Demo Mode (enables mock authentication)
DEMO_MODE=true
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Demo Mode

The application includes a fully functional demo mode for showcasing features without backend integration.

### Quick Login

1. Navigate to `/login`
2. Click "Demo Student" or "Demo Admin" in the Demo Mode section
3. You will be redirected to the appropriate dashboard

### Demo Features

**Student Demo:**
- Submit new issues (stored in browser state)
- View pre-populated sample issues
- Track issue status and aggregation
- View campus status alerts

**Admin Demo:**
- View aggregated issues with priority scores
- See frequency metrics and report counts
- Access AI priority analysis
- Perform status updates (stored locally)

### Sample Data

The demo includes realistic sample issues:
- Water supply problems in Boys Hostel 1 (15 reports, high priority)
- WiFi connectivity in Academic Block A (8 reports, in progress)
- Food quality concerns in Main Canteen (12 reports)
- Electrical issues in Girls Hostel 1 (6 reports)
- Sanitation in Boys Hostel 2 (5 reports)
- Safety concerns at Parking area (4 reports)

---

## API Contracts

### Student Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/issues/create` | Submit a new issue |
| GET | `/api/student/issues` | Get student's issues |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/issues/admin` | Get aggregated issues (sorted by priority) |
| GET | `/api/issues/{id}` | Get issue detail with linked reports |
| POST | `/api/issues/{id}/action` | Perform admin action |

### Request/Response Examples

**Create Issue:**
```json
POST /api/issues/create
{
  "title": "No water supply in hostel",
  "description": "Water has been unavailable for 2 days...",
  "category_id": "water-supply",
  "location_id": "hostel-boys-1"
}

Response:
{
  "issue_id": "report-123",
  "aggregation_status": "aggregated",
  "aggregated_issue_id": "agg-1",
  "initial_priority": 85
}
```

**Admin Action:**
```json
POST /api/issues/{id}/action
{
  "action_type": "status_change",
  "new_value": "in_progress",
  "notes": "Maintenance team dispatched"
}
```

---

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `users` | User accounts (students, admins) |
| `roles` | Role definitions |
| `locations` | Campus locations (hardcoded for Jamia Hamdard) |
| `authorities` | Department/authority assignments |
| `issue_categories` | Issue type classifications |
| `issue_reports` | Individual student submissions (immutable) |
| `aggregated_issues` | Parent issues grouping similar reports |
| `issue_aggregation_map` | Links reports to aggregated issues |
| `automation_metadata` | AI/ML extraction results |
| `priority_snapshots` | Historical priority scores |
| `frequency_metrics` | Rolling frequency calculations |
| `admin_actions` | Audit log of admin operations |

### Key Design Principles

- Every student submission is immutable
- Aggregation is explicit, not inferred
- State transitions are auditable
- Priority is derived, not manually set
- All writes affecting aggregation happen atomically
- Student identity is abstracted (authenticated, not identifiable)

---

## Campus Locations

The system is customized for Jamia Hamdard with the following locations:

**Hostels:**
- Boys Hostel 1, 2, 3
- Girls Hostel 1, 2

**Academic Blocks:**
- Academic Block A, B, C

**Facilities:**
- Central Library
- Main Canteen
- Sports Complex
- Hospital
- Administrative Building
- Parking Area

---

## Issue Categories

| Category | Default Authority | Environmental |
|----------|-------------------|---------------|
| Water Supply | Provost / Admin Office | Yes |
| Electricity | Maintenance | Yes |
| WiFi/Network | IT Services | No |
| Sanitation | Admin Office | Yes |
| Food Quality | Admin Office | No |
| AC/Heating | Maintenance | Yes |
| Safety/Security | Security | No |
| Timetable | Academic Affairs | No |
| Furniture | Maintenance | No |

---

## Routing Logic

Issues are automatically routed based on category and location:

- **Hostel issues** -> Provost
- **Water/Electricity (classrooms)** -> Administrative Office
- **Water/Electricity (hostels)** -> Provost
- **Sanitation** -> Administrative Office
- **Safety** -> Security In-Charge
- **Academic scheduling/results** -> Academic Affairs / Department Office

Admins can override routing at any time.

---

## Priority Calculation

Priority scores (0-100) are calculated using:

| Factor | Weight | Description |
|--------|--------|-------------|
| Urgency | 30% | Time-sensitivity of the issue |
| Impact | 25% | Single vs. multi-student scope |
| Frequency | 25% | Report velocity (reports per time window) |
| Environmental | 20% | Infrastructure/sustainability flag |

Priority is recalculated on each new report, with historical snapshots preserved for audit.

---

## Contributing

### Branch Naming

- `feat/` - New features
- `fix/` - Bug fixes
- `chore/` - Maintenance tasks
- `docs/` - Documentation updates

### Commit Convention

Use semantic atomic commits:

```
feat(component): add new feature
fix(store): resolve state issue
chore(deps): update dependencies
docs(readme): update setup instructions
```

### Code Style

- TypeScript strict mode enabled
- ESLint for code quality
- Tailwind CSS for styling
- shadcn/ui component patterns

---

## License

This project is developed for Jamia Hamdard University. All rights reserved.

---

## Contact

For questions or support, contact the Campus Pulse development team.
