create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_message text not null,
  ai_response text,
  extracted_data jsonb,
  context jsonb,
  date_creation timestamptz not null default now()
);

create index if not exists chat_messages_date_creation_idx
  on public.chat_messages(date_creation desc);
