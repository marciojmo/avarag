-- Required extensions
create extension if not exists "uuid-ossp";
create extension if not exists vector;

-- ========== TABLES ==========

create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  name text,
  created_at timestamptz not null default now(),
  modified_at timestamptz not null default now()
);

create table if not exists public.agents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  description text,
  model text default 'gpt-4o-mini',
  created_at timestamptz not null default now(),
  modified_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default uuid_generate_v4(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  title text,
  mime text,
  bytes bigint,
  s3_key text not null,
  status text not null check (status in ('pending','processed','failed')) default 'pending',
  created_at timestamptz not null default now(),
  modified_at timestamptz not null default now()
);

create table if not exists public.chunks (
  id bigserial primary key,
  agent_id uuid not null references public.agents(id) on delete cascade,
  document_id uuid references public.documents(id) on delete cascade,
  content text not null,
  embedding vector(1536) not null,
  created_at timestamptz not null default now(),
  modified_at timestamptz not null default now()
);

-- ========== INDEXES ==========
create index if not exists idx_agents_user on public.agents(user_id);
create index if not exists idx_docs_agent on public.documents(agent_id);
create index if not exists idx_docs_user on public.documents(user_id);
create index if not exists idx_chunks_agent on public.chunks(agent_id);
create index if not exists idx_chunks_ivfflat
  on public.chunks using ivfflat (embedding vector_l2_ops) with (lists = 100);

-- ========== TRIGGER FOR modified_at ==========
create or replace function public.set_modified_at()
returns trigger
language plpgsql
as $$
begin
  new.modified_at := now();
  return new;
end;
$$;

-- attach trigger to each table
drop trigger if exists trg_set_modified_at_users on public.users;
create trigger trg_set_modified_at_users
before update on public.users
for each row execute function public.set_modified_at();

drop trigger if exists trg_set_modified_at_agents on public.agents;
create trigger trg_set_modified_at_agents
before update on public.agents
for each row execute function public.set_modified_at();

drop trigger if exists trg_set_modified_at_documents on public.documents;
create trigger trg_set_modified_at_documents
before update on public.documents
for each row execute function public.set_modified_at();

drop trigger if exists trg_set_modified_at_chunks on public.chunks;
create trigger trg_set_modified_at_chunks
before update on public.chunks
for each row execute function public.set_modified_at();
