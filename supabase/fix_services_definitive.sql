-- ==========================================
-- Fix DEFINITIVO: Coluna barber_id na tabela services
-- ==========================================

-- Adiciona a coluna barber_id caso não exista (nome em inglês que o código usa)
alter table public.services 
add column if not exists barber_id uuid references public.profiles(id) on delete cascade;

-- Se existir a coluna barbeiro_id (nome em português), copiar os valores para barber_id
do $$
begin
  if exists (
    select 1 from information_schema.columns 
    where table_name = 'services' and column_name = 'barbeiro_id'
  ) then
    update public.services set barber_id = barbeiro_id where barber_id is null and barbeiro_id is not null;
  end if;
end;
$$;

-- Recriar políticas RLS limpas
drop policy if exists "Barbers can insert their own services" on public.services;
drop policy if exists "Barbers can update their own services" on public.services;
drop policy if exists "Barbers can delete their own services" on public.services;
drop policy if exists "Services are viewable by everyone" on public.services;
drop policy if exists "Services are viewable by everyone." on public.services;
drop policy if exists "Allow all for services" on public.services;

alter table public.services enable row level security;

-- Qualquer pessoa pode ler (clientes, barbeiros)
create policy "Services are viewable by everyone"
  on public.services for select
  using (true);

-- Barbeiro só insere serviço com o próprio ID
create policy "Barbers can insert their own services"
  on public.services for insert
  with check (auth.uid() = barber_id);

-- Barbeiro só edita os próprios serviços
create policy "Barbers can update their own services"
  on public.services for update
  using (auth.uid() = barber_id);

-- Barbeiro só deleta os próprios serviços
create policy "Barbers can delete their own services"
  on public.services for delete
  using (auth.uid() = barber_id);
