alter table messages
add column if not exists sources jsonb not null default '[]'::jsonb;

