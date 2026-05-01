-- ==========================================
-- 1. Adicionar papel/cargo na tabela profiles
-- ==========================================
-- Por padrão, todos que se cadastram recebem o papel de 'client'
alter table public.profiles 
add column role text not null default 'client' 
check (role in ('client', 'barber', 'admin'));

-- ==========================================
-- 2. Adicionar barbeiro responsável no agendamento
-- ==========================================
-- Qual barbeiro foi escolhido para aquele horário
alter table public.appointments 
add column barber_id uuid references public.profiles(id);

-- ==========================================
-- 3. Políticas de Segurança (RLS) para Barbeiros
-- ==========================================
-- Barbeiros podem ver a lista de todos os agendamentos do salão
create policy "Barbers can view all appointments"
  on public.appointments for select
  using ( exists (select 1 from public.profiles where id = auth.uid() and role = 'barber') );

-- Barbeiros podem editar qualquer agendamento (ex: mudar para 'confirmado' ou 'concluído')
create policy "Barbers can update all appointments"
  on public.appointments for update
  using ( exists (select 1 from public.profiles where id = auth.uid() and role = 'barber') );

-- Barbeiros podem criar agendamentos (útil para encaixes manuais / por telefone)
create policy "Barbers can insert appointments"
  on public.appointments for insert
  with check ( exists (select 1 from public.profiles where id = auth.uid() and role = 'barber') );
