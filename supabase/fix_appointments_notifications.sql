-- ==========================================
-- Fix COMPLETO: Tabelas appointments e notifications
-- ==========================================

-- 1. Adicionar barber_id na tabela appointments
alter table public.appointments
add column if not exists barber_id uuid references public.profiles(id) on delete cascade;

-- 2. Adicionar coluna type na tabela notifications
alter table public.notifications
add column if not exists type text default 'general';

-- 3. Adicionar política de INSERT para notifications (estava faltando!)
drop policy if exists "Anyone can insert notifications" on public.notifications;
create policy "Anyone can insert notifications"
  on public.notifications for insert
  with check (true);

-- 4. Recriar políticas de appointments para incluir barber_id
drop policy if exists "Clients can view their own appointments." on public.appointments;
drop policy if exists "Clients can create appointments for themselves." on public.appointments;
drop policy if exists "Clients can update their own appointments." on public.appointments;
drop policy if exists "Barbers can view their appointments" on public.appointments;

-- Clientes veem os próprios agendamentos
create policy "Clients can view their own appointments."
  on public.appointments for select
  using (auth.uid() = client_id OR auth.uid() = barber_id);

-- Clientes podem criar agendamentos
create policy "Clients can create appointments for themselves."
  on public.appointments for insert
  with check (auth.uid() = client_id);

-- Barbeiros e clientes podem atualizar
create policy "Clients can update their own appointments."
  on public.appointments for update
  using (auth.uid() = client_id OR auth.uid() = barber_id);
