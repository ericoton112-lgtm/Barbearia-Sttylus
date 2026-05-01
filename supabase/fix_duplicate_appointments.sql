-- ==========================================
-- 1. VER agendamentos com nomes (leitura fácil)
-- ==========================================
select 
  a.id,
  a.appointment_date at time zone 'America/Sao_Paulo' as "Data/Hora",
  a.status,
  p.full_name as "Cliente",
  p.phone as "Telefone",
  s.name as "Serviço",
  s.price as "Preço"
from appointments a
left join profiles p on p.id = a.client_id
left join services s on s.id = a.service_id
order by a.appointment_date desc;

-- ==========================================
-- 2. DELETAR agendamentos duplicados
-- (mantém apenas o mais recente de cada grupo)
-- ==========================================
delete from appointments
where id in (
  select id from (
    select 
      id,
      row_number() over (
        partition by client_id, barber_id, appointment_date 
        order by created_at asc
      ) as rn
    from appointments
  ) t
  where rn > 1
);
