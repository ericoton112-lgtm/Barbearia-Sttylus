-- =================================================
-- Fix RLS Policies para a tabela services
-- =================================================

-- Remover políticas antigas que possam estar conflitando
drop policy if exists "Barbers can insert their own services" on public.services;
drop policy if exists "Barbers can update their own services" on public.services;
drop policy if exists "Barbers can delete their own services" on public.services;
drop policy if exists "Services are viewable by everyone" on public.services;
drop policy if exists "Allow all for services" on public.services;

-- Garantir que RLS está ativo na tabela
alter table public.services enable row level security;

-- Qualquer pessoa pode ver serviços (clientes precisam listar)
create policy "Services are viewable by everyone"
  on public.services for select
  using (true);

-- Barbeiros podem inserir seus próprios serviços
create policy "Barbers can insert their own services"
  on public.services for insert
  with check (auth.uid() = barber_id);

-- Barbeiros podem atualizar seus próprios serviços
create policy "Barbers can update their own services"
  on public.services for update
  using (auth.uid() = barber_id);

-- Barbeiros podem deletar seus próprios serviços
create policy "Barbers can delete their own services"
  on public.services for delete
  using (auth.uid() = barber_id);
