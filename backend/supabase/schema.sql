create extension if not exists pgcrypto;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  email text not null,
  telephone text,
  ville_depart text not null,
  ville_arrivee text not null,
  date_depart date not null,
  date_retour date,
  nombre_passagers integer not null,
  type_trajet text not null,
  distance_km integer not null,
  statut text not null default 'Devis généré',
  date_creation timestamptz not null default now()
);

create table if not exists public.devis (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  prix integer,
  peage decimal default 0,
  details_peage jsonb,
  pdf text,
  statut text not null default 'Envoyé',
  date_creation timestamptz not null default now()
);

create table if not exists public.relances (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  devis_id uuid references public.devis(id) on delete cascade,
  statut text not null default 'programmée',
  canal text not null default 'email',
  date_relance timestamptz,
  date_creation timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_message text not null,
  ai_response text,
  extracted_data jsonb,
  context jsonb,
  date_creation timestamptz not null default now()
);

create index if not exists clients_date_creation_idx on public.clients(date_creation desc);
create index if not exists devis_date_creation_idx on public.devis(date_creation desc);
create index if not exists devis_client_id_idx on public.devis(client_id);
create index if not exists relances_client_id_idx on public.relances(client_id);
create index if not exists relances_devis_id_idx on public.relances(devis_id);
create index if not exists chat_messages_date_creation_idx on public.chat_messages(date_creation desc);
