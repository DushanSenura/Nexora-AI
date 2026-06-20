create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('user', 'admin');
  end if;
  if not exists (select 1 from pg_type where typname = 'message_role') then
    create type message_role as enum ('system', 'user', 'assistant');
  end if;
  if not exists (select 1 from pg_type where typname = 'document_status') then
    create type document_status as enum ('uploaded', 'processing', 'ready', 'failed');
  end if;
  if not exists (select 1 from pg_type where typname = 'agent_status') then
    create type agent_status as enum ('queued', 'running', 'complete', 'failed');
  end if;
end $$;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  avatar_url text,
  password_hash text not null,
  role user_role not null default 'user',
  disabled_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references chats(id) on delete cascade,
  role message_role not null,
  content text not null,
  model text,
  content_type text not null default 'text',
  image_url text,
  sources jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  file_name text not null,
  file_type text not null,
  file_url text not null,
  status document_status not null default 'uploaded',
  created_at timestamptz not null default now()
);

create table if not exists document_messages (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role message_role not null,
  content text not null,
  chunk_references jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists agent_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  agent_type text not null,
  input text not null,
  output text,
  status agent_status not null default 'queued',
  created_at timestamptz not null default now()
);

create table if not exists usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  action text not null,
  tokens_used integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_chats_user_id on chats(user_id);
create index if not exists idx_messages_chat_id on messages(chat_id);
create index if not exists idx_documents_user_id on documents(user_id);
create index if not exists idx_document_messages_document_id on document_messages(document_id);
create index if not exists idx_agent_tasks_user_id on agent_tasks(user_id);
create index if not exists idx_usage_logs_user_id on usage_logs(user_id);

create or replace function touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists chats_touch_updated_at on chats;
create trigger chats_touch_updated_at
before update on chats
for each row execute function touch_updated_at();
