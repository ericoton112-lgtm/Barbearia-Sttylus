-- Adicionar created_at na tabela services (estava faltando no schema original)
alter table public.services 
add column if not exists created_at timestamp with time zone default timezone('utc'::text, now()) not null;
