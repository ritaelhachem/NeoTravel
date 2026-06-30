alter table public.devis
add column if not exists peage decimal default 0,
add column if not exists details_peage jsonb;
