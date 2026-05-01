-- ==========================================
-- 1. Adicionar Botão ON/OFF no Perfil
-- ==========================================
alter table public.profiles 
add column if not exists is_accepting_appointments boolean default true;

-- ==========================================
-- 2. Vincular Serviços ao Barbeiro
-- ==========================================
-- Como a barbearia pode ter mais de um barbeiro, precisamos que os serviços
-- tenham um 'dono' (barber_id).
alter table public.services
add column if not exists barber_id uuid references public.profiles(id) on delete cascade;

-- Dar a propriedade dos serviços de teste atuais para o barbeiro existente
do $$
declare
  v_barber_id uuid;
begin
  select id into v_barber_id from public.profiles where role = 'barber' limit 1;
  
  if v_barber_id is not null then
    update public.services set barber_id = v_barber_id where barber_id is null;
  end if;
end;
$$;
