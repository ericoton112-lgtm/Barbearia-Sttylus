-- ==========================================
-- 1. Criação da Tabela de Perfis (Clientes)
-- ==========================================
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS (Segurança)
alter table public.profiles enable row level security;

-- Qualquer um pode ler os perfis (útil se tivermos profissionais)
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

-- O usuário só pode atualizar o próprio perfil
create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- ==========================================
-- 2. Criação da Tabela de Serviços
-- ==========================================
create table public.services (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  price numeric not null default 0,
  duration_minutes integer not null default 30
);

-- Habilitar RLS
alter table public.services enable row level security;

-- Serviços podem ser lidos por qualquer pessoa
create policy "Services are viewable by everyone."
  on services for select
  using ( true );
-- Obs: A inserção/edição de serviços será feita pelo painel do Supabase (Admin)

-- ==========================================
-- 3. Criação da Tabela de Agendamentos
-- ==========================================
create table public.appointments (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.profiles(id) on delete cascade not null,
  service_id uuid references public.services(id) on delete restrict not null,
  appointment_date timestamp with time zone not null,
  status text not null default 'pendente', -- pendente, confirmado, cancelado
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.appointments enable row level security;

-- O cliente só pode ver os próprios agendamentos
create policy "Clients can view their own appointments."
  on appointments for select
  using ( auth.uid() = client_id );

-- O cliente só pode criar agendamentos para si mesmo
create policy "Clients can create appointments for themselves."
  on appointments for insert
  with check ( auth.uid() = client_id );

-- O cliente pode atualizar seus próprios agendamentos (ex: cancelar)
create policy "Clients can update their own appointments."
  on appointments for update
  using ( auth.uid() = client_id );

-- ==========================================
-- 4. Função para Criar Perfil Automaticamente
-- ==========================================
-- Quando um usuário criar conta no app (Auth), o Supabase cria o Perfil dele aqui:
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

-- Gatilho (Trigger) que roda a função acima
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
