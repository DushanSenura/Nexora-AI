alter table users
add column if not exists disabled_at timestamptz;

