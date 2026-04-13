-- Create api_keys table for storing hashed API keys
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  name text,
  hashed_key text not null,
  revoked boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_api_keys_hashed_key on public.api_keys(hashed_key);
