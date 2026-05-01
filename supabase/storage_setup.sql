-- ==========================================
-- 1. Coluna para Foto de Perfil
-- ==========================================
alter table public.profiles 
add column if not exists avatar_url text;

-- ==========================================
-- 2. Criar Bucket do Storage
-- ==========================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- ==========================================
-- 3. Políticas de Segurança (RLS) para Avatares
-- ==========================================
-- Permitir que qualquer pessoa veja os avatares (público)
create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

-- Permitir que usuários autenticados enviem fotos
create policy "Anyone can upload an avatar."
  on storage.objects for insert
  with check ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- Permitir que o dono atualize sua própria foto
create policy "Users can update their own avatars."
  on storage.objects for update
  using ( bucket_id = 'avatars' AND auth.uid() = owner );

-- Permitir que o dono delete sua própria foto
create policy "Users can delete their own avatars."
  on storage.objects for delete
  using ( bucket_id = 'avatars' AND auth.uid() = owner );
