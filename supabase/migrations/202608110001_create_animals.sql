create extension if not exists pgcrypto;

create table public.animals (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  species text not null check (species in ('cat', 'dog')),
  breed text,
  age_group text check (age_group in ('baby', 'young', 'adult', 'senior')),
  sex text check (sex in ('female', 'male', 'unknown')),
  size text check (size in ('small', 'medium', 'large')),
  activity_level text check (activity_level in ('low', 'medium', 'high')),
  apartment_suitable boolean,
  garden_required boolean,
  good_with_children boolean,
  good_with_dogs boolean,
  good_with_cats boolean,
  max_alone_hours smallint check (max_alone_hours between 0 and 12),
  experience_required text check (experience_required in ('first_time', 'some', 'experienced')),
  special_needs boolean,
  status text not null default 'available'
    check (status in ('available', 'reserved', 'adopted')),
  location text not null,
  description text not null,
  image_url text,
  source_url text,
  source_name text not null default 'Adoptable Tails Ireland',
  available_since date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index animals_available_species_idx
  on public.animals (status, species);

alter table public.animals enable row level security;

create policy "Public may read available animals"
  on public.animals
  for select
  to anon, authenticated
  using (status = 'available');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger animals_set_updated_at
before update on public.animals
for each row execute function public.set_updated_at();

comment on table public.animals is
  'Dynamically queried fictional animal inventory for the Adoptable Tails student prototype.';
