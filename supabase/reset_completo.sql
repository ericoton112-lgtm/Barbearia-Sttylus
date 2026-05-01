-- ==========================================
-- RESET COMPLETO — Limpar dados de teste
-- Execute no SQL Editor do Supabase
-- ==========================================

-- 1. Limpar notificações
delete from public.notifications;

-- 2. Limpar agendamentos
delete from public.appointments;

-- 3. Limpar serviços de teste
delete from public.services;

-- 4. Limpar perfis (exceto o seu próprio, se quiser manter)
-- ATENÇÃO: isso remove os perfis mas NÃO remove as contas de autenticação
delete from public.profiles;

-- ==========================================
-- 5. Remover contas de autenticação (auth.users)
-- Isso deleta TODOS os usuários cadastrados,
-- incluindo os logins. Use com cuidado!
-- ==========================================
delete from auth.users;

-- ==========================================
-- Verificar se ficou limpo:
-- ==========================================
select 'profiles' as tabela, count(*) as registros from public.profiles
union all
select 'services', count(*) from public.services
union all
select 'appointments', count(*) from public.appointments
union all
select 'notifications', count(*) from public.notifications
union all
select 'auth.users', count(*) from auth.users;
