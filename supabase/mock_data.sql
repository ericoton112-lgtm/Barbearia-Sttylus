-- ==========================================
-- 1. Inserir Serviços Falsos
-- ==========================================
insert into public.services (id, name, description, price, duration_minutes)
values 
  ('11111111-1111-1111-1111-111111111111', 'Signature Fade + Barba', 'Corte completo e alinhamento.', 85.00, 60),
  ('22222222-2222-2222-2222-222222222222', 'Corte Moderno', 'Corte degradê ou social.', 45.00, 30),
  ('33333333-3333-3333-3333-333333333333', 'Navalhado & Ritual', 'Barboterapia completa.', 55.00, 45)
on conflict (id) do nothing;

-- ==========================================
-- 2. Inserir Agendamentos Falsos (Para Hoje)
-- ==========================================
do $$
declare
  v_barber_id uuid;
begin
  -- Pega o ID do barbeiro (o seu ID, Eric)
  select id into v_barber_id from public.profiles where role = 'barber' limit 1;

  if v_barber_id is not null then
    -- Agendamento 1 (já aconteceu - concluído)
    insert into public.appointments (client_id, barber_id, service_id, appointment_date, status)
    values (v_barber_id, v_barber_id, '11111111-1111-1111-1111-111111111111', current_date + interval '10 hours', 'concluído');

    -- Agendamento 2 (próximo - pendente)
    insert into public.appointments (client_id, barber_id, service_id, appointment_date, status)
    values (v_barber_id, v_barber_id, '22222222-2222-2222-2222-222222222222', current_date + interval '14 hours', 'pendente');

    -- Agendamento 3 (mais tarde - confirmado)
    insert into public.appointments (client_id, barber_id, service_id, appointment_date, status)
    values (v_barber_id, v_barber_id, '33333333-3333-3333-3333-333333333333', current_date + interval '16 hours', 'confirmado');
  end if;
end;
$$;
