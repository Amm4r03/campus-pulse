this is the ideal filetree in mind for the app, this may change with future changes
campus-pulse/
├─ app/                      // Next.js App Router
│  ├─ (student)/
│  │   ├─ submit/
│  │   ├─ issues/
│  ├─ (admin)/
│  │   ├─ dashboard/
│  │   ├─ issues/[id]/
│  ├─ api/
│  │   ├─ issues/
│  │   │   ├─ create/route.ts
│  │   │   ├─ triage/route.ts
│  │   │   └─ admin/route.ts
│
├─ lib/
│  ├─ db.ts                  // Supabase client
│  ├─ auth.ts
│
├─ domain/                   // THIS IS THE IMPORTANT PART
│  ├─ priority.ts            // scoring logic
│  ├─ aggregation.ts         // similarity logic
│  ├─ frequency.ts           // 30-min window logic
│  ├─ routing.ts             // authority mapping
│  ├─ types.ts               // shared domain types
│
├─ components/               // shadcn components
├─ public/
│  └─ manifest.json
└─ package.json