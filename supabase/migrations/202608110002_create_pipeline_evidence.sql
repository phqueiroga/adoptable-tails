create table public.pipeline_runs (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'started'
    check (status in ('started', 'completed', 'rejected', 'failed')),
  model text not null,
  profile jsonb not null,
  live_query jsonb,
  researcher_output jsonb,
  designer_output jsonb,
  maker_output jsonb,
  communicator_output jsonb,
  manager_output jsonb,
  error_code text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.pipeline_runs enable row level security;

-- No public policies or grants: evidence is written only by the Edge Function
-- with the project secret key and reviewed through the protected dashboard.
revoke all on table public.pipeline_runs from anon, authenticated;

create index pipeline_runs_started_at_idx
  on public.pipeline_runs (started_at desc);

comment on table public.pipeline_runs is
  'Evidence of cumulative five-agent runs. Contains questionnaire data but no name, email, account, IP address, or other direct identifier.';
