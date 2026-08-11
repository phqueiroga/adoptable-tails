create policy "Public cannot read pipeline evidence"
  on public.pipeline_runs
  for select
  to anon, authenticated
  using (false);

comment on policy "Public cannot read pipeline evidence" on public.pipeline_runs is
  'Explicit deny policy. Evidence is accessible only to trusted server-side roles that bypass RLS.';
