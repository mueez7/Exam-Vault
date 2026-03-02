# ExamVault — Supabase Backend

This folder contains all server-side infrastructure for ExamVault:
SQL migrations, RLS policies, and storage configuration.

## Structure

```
backend/
├── migrations/
│   └── 20240101000000_init_schema.sql   # Full schema + indexes + RLS + storage
├── functions/
│   └── increment_view_count.sql         # Atomic view-count RPC function
└── README.md
```

## Applying Migrations

1. Install Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Link your project: `supabase link --project-ref <YOUR_PROJECT_REF>`
4. Push schema: `supabase db push`

Or paste the SQL directly into the **Supabase Studio → SQL Editor**.

## Environment Variables (frontend)

Copy `frontend/.env.example` → `frontend/.env.local` and fill in your values.
