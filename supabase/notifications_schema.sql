-- ==========================================
-- 1. Criar Tabela de Notificações
-- ==========================================
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  message text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 2. Segurança (RLS)
-- ==========================================
alter table public.notifications enable row level security;

create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- ==========================================
-- 3. Inserir Notificações de Teste
-- ==========================================
do $$
declare
  v_barber_id uuid;
begin
  select id into v_barber_id from public.profiles where role = 'barber' limit 1;

  if v_barber_id is not null then
    insert into public.notifications (user_id, title, message)
    values 
      (v_barber_id, 'Novo Agendamento!', 'Lucas Ferreira agendou um Signature Fade + Barba para hoje às 14h.'),
      (v_barber_id, 'Atualização de Sistema', 'A nova versão do Sttylus já está disponível com melhorias de velocidade.');
  end if;
end;
$$;
