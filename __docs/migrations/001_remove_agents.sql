-- Migrates a database created with the old agents-based schema to the
-- current one: documents and chunks belong directly to a user.
-- Keeps every document and chunk; only the agents table goes away.

begin;

-- chunks: agent_id -> user_id (taken from the owning document)
alter table public.chunks add column if not exists user_id uuid
  references public.users(id) on delete cascade;
update public.chunks c
   set user_id = d.user_id
  from public.documents d
 where c.document_id = d.id
   and c.user_id is null;
delete from public.chunks where user_id is null or document_id is null;
alter table public.chunks alter column user_id set not null;
alter table public.chunks alter column document_id set not null;
alter table public.chunks drop column if exists agent_id;

-- documents: drop agent_id (user_id already exists)
alter table public.documents drop column if exists agent_id;
alter table public.documents
  add constraint documents_s3_key_key unique (s3_key);

-- agents table and its trigger
drop trigger if exists trg_set_modified_at_agents on public.agents;
drop table if exists public.agents;

-- indexes
drop index if exists public.idx_docs_agent;
drop index if exists public.idx_docs_user;
drop index if exists public.idx_chunks_agent;
drop index if exists public.idx_chunks_ivfflat;
create index if not exists idx_docs_user on public.documents(user_id, created_at desc);
create index if not exists idx_chunks_user on public.chunks(user_id);
create index if not exists idx_chunks_document on public.chunks(document_id);
create index if not exists idx_chunks_embedding
  on public.chunks using hnsw (embedding vector_cosine_ops);

commit;
