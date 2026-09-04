create table if not exists public.checkins (
  id text primary key,
  victim_id text not null,
  scores jsonb not null,
  message text,
  timestamp timestamptz not null,
  score numeric not null,
  created_at timestamptz not null default now()
);

create table if not exists public.support_requests (
  id text primary key,
  victim_id text not null,
  request_type text not null,
  message text,
  status text not null,
  routed_roles jsonb not null default '[]'::jsonb,
  created_at timestamptz not null,
  source text,
  checkin_id text
);

alter table public.checkins enable row level security;
alter table public.support_requests enable row level security;

create index if not exists checkins_victim_timestamp_idx
  on public.checkins (victim_id, timestamp desc);

create index if not exists support_requests_created_at_idx
  on public.support_requests (created_at desc);
