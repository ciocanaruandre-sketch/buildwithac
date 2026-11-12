-- Finanțe: ce vede un om din echipă pe pagina lui. Doar rândurile lui, fără tranșele altora și fără starea plăților clienților.

-- Comisioanele omului conectat, cu clientul (null dacă a fost șters) și tranșa din care vin.
create function public.comisioanele_mele()
returns table (id uuid, tip text, client text, eticheta text, procent numeric, baza_lei int, suma_lei int, platit_la date, creat_la timestamptz)
language sql stable security definer set search_path = ''
as $$
  select k.id, k.tip, c.nume, tr.eticheta, k.procent, k.baza_lei, k.suma_lei, k.platit_la, k.creat_la
    from public.comisioane k
    left join public.proiecte p on p.id = k.proiect_id
    left join public.clienti c on c.id = p.client_id
    left join public.transe tr on tr.id = k.transa_id
   where k.om_id = auth.uid() and public.rol_curent() is not null
   order by k.creat_la desc
$$;

-- Comisioanele estimate din tranșele încă neîncasate de pe proiectele omului.
-- Data unei tranșe întârziate nu se dă (scadenta = null): omul nu vede dacă un client întârzie.
create function public.comisioane_viitoare()
returns table (client text, proiect text, eticheta text, suma_lei int, procent numeric, comision int, scadenta date)
language sql stable security definer set search_path = ''
as $$
  with liste as (
    select tr.id as transa_id, o.procent
      from public.transe tr join public.proiect_oameni o on o.proiect_id = tr.proiect_id and o.om_id = auth.uid()
     where tr.abonament_id is null and tr.incasata_la is null
    union all
    select tr.id, v.procent
      from public.transe tr join public.proiect_vanzari v on v.proiect_id = tr.proiect_id and v.om_id = auth.uid()
     where tr.abonament_id is null and tr.incasata_la is null
    union all
    select tr.id, ao.procent
      from public.transe tr join public.abonament_oameni ao on ao.abonament_id = tr.abonament_id and ao.om_id = auth.uid()
     where tr.incasata_la is null
  )
  select c.nume, p.titlu, tr.eticheta, tr.suma_lei, l.procent,
         case when l.procent is null then null else round(tr.suma_lei * l.procent / 100)::int end,
         case when tr.scadenta >= public.azi_ro() then tr.scadenta end
    from liste l
    join public.transe tr on tr.id = l.transa_id
    join public.proiecte p on p.id = tr.proiect_id
    join public.clienti c on c.id = p.client_id
   where l.procent is distinct from 0
     and public.rol_curent() in ('caller', 'closer', 'constructor')
   order by tr.scadenta, tr.eticheta
$$;

revoke execute on function public.comisioanele_mele(), public.comisioane_viitoare() from public, anon;
grant execute on function public.comisioanele_mele(), public.comisioane_viitoare() to authenticated;
