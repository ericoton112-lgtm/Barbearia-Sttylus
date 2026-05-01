-- 1. Transforma o Eric em barbeiro (muda o 'client' para 'barber')
update public.profiles 
set role = 'barber' 
where full_name = 'Eric Farias';

-- 2. Conserta a função para salvar o telefone dos próximos cadastros
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$;
