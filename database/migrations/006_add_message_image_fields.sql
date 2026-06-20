alter table messages
add column if not exists content_type text not null default 'text';

alter table messages
add column if not exists image_url text;
