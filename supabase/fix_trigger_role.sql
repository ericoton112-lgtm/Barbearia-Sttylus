-- Atualizar o trigger para ler role, phone e is_accepting_appointments dos metadados do usuário
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, role, is_accepting_appointments)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'role', 'client'),
    (new.raw_user_meta_data->>'role') = 'barber'
  );
  return new;
end;
$$;
