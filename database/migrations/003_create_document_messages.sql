create table if not exists document_messages (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role message_role not null,
  content text not null,
  chunk_references jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_document_messages_document_id on document_messages(document_id);
