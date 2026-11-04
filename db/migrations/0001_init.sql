-- Initial schema: users, their uploaded documents, and the embedded chunks
-- used for retrieval (RAG).

-- ========== EXTENSIONS ==========
create extension if not exists "uuid-ossp";
create extension if not exists vector;

-- ========== TABLES ==========
create table public.users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  name text,
  created_at timestamptz not null default now(),
  modified_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text,
  mime text,
  bytes bigint,
  s3_key text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'processed', 'failed')),
  created_at timestamptz not null default now(),
  modified_at timestamptz not null default now()
);

create table public.chunks (
  id bigserial primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  content text not null,
  -- text-embedding-ada-002 (see src/lib/embeddings.ts)
  embedding vector(1536) not null,
  created_at timestamptz not null default now(),
  modified_at timestamptz not null default now()
);

-- ========== INDEXES ==========
create index idx_documents_user on public.documents(user_id, created_at desc);
create index idx_chunks_user on public.chunks(user_id);
create index idx_chunks_document on public.chunks(document_id);
create index idx_chunks_embedding on public.chunks using hnsw (embedding vector_cosine_ops);

-- ========== modified_at TRIGGERS ==========
create function public.set_modified_at()
returns trigger
language plpgsql
as $$
begin
  new.modified_at := now();
  return new;
end;
$$;

create trigger trg_set_modified_at_users
before update on public.users
for each row execute function public.set_modified_at();

create trigger trg_set_modified_at_documents
before update on public.documents
for each row execute function public.set_modified_at();

create trigger trg_set_modified_at_chunks
before update on public.chunks
for each row execute function public.set_modified_at();
