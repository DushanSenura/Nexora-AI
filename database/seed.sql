insert into users (id, name, email, password_hash, role)
values
  ('00000000-0000-0000-0000-000000000001', 'Admin User', 'admin@nexora.local', '$2a$12$KIX4nDO9gm25k7SqbkMmKOkG5er28IO8p5O7I2VNivg.R0Ti85.IW', 'admin'),
  ('00000000-0000-0000-0000-000000000002', 'Demo User', 'demo@nexora.local', '$2a$12$KIX4nDO9gm25k7SqbkMmKOkG5er28IO8p5O7I2VNivg.R0Ti85.IW', 'user')
on conflict (email) do nothing;

insert into chats (id, user_id, title)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Welcome chat')
on conflict (id) do nothing;

insert into messages (chat_id, role, content, model)
values
  ('10000000-0000-0000-0000-000000000001', 'user', 'What can Nexora AI do?', 'llama3.1'),
  ('10000000-0000-0000-0000-000000000001', 'assistant', 'Nexora AI can chat, search documents, and run focused agent workflows.', 'llama3.1');

insert into documents (user_id, file_name, file_type, file_url, status)
values
  ('00000000-0000-0000-0000-000000000002', 'Nexora overview.pdf', 'application/pdf', 'https://example.com/nexora-overview.pdf', 'ready');

insert into agent_tasks (user_id, agent_type, input, output, status)
values
  ('00000000-0000-0000-0000-000000000002', 'research', 'Summarize local model deployment options.', 'Use Ollama for local serving and Qdrant for vector search.', 'complete');

insert into usage_logs (user_id, action, tokens_used)
values
  ('00000000-0000-0000-0000-000000000002', 'chat.message', 420),
  ('00000000-0000-0000-0000-000000000002', 'agent.research', 1300);

