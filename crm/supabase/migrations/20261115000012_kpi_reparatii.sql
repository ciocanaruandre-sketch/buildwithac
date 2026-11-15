-- Reparațiile găsite cu istoricul demo.

-- 1. „Au răspuns” pe om: doar răspunsurile dintr-un apel (o mutare din nou, fără răspuns sau callback).
-- Altfel closerul primea răspunsuri pentru ofertă, client sau pierdut după discuție.

create or replace function public.kpi_apeluri(de timestamptz, pana timestamptz)
returns table (om_id uuid, luate int, apeluri int, au_raspuns int, programate int,
               minute_primul_apel numeric, nesunate_24h int, incercari_pana_raspunde numeric)
language sql stable security definer set search_path = ''
as $$
  with
  rol as (select public.kpi_rol() as r, auth.uid() as eu),
  ap as (select * from public.kpi_apel_ev()),
  -- primul apel după fiecare intrare din perioadă
  primul as (
    select i.lead_id, i.la as intrat, p.autor_id, p.la
      from public.kpi_intrari(de, pana) i
      left join lateral (
        select a.autor_id, a.la from ap a
         where a.lead_id = i.lead_id and a.la >= i.la and (i.pana_la is null or a.la < i.pana_la)
         order by a.la limit 1
      ) p on true
  ),
  -- primul răspuns al fiecărei intrări, dacă a venit în perioadă, cu „Nu răspunde”-urile dinainte
  raspuns as (
    select i.lead_id, rs.autor_id,
           (select count(*) from public.evenimente e
             where e.lead_id = i.lead_id and e.tip = 'incercare' and e.la >= i.la and e.la < rs.la)::numeric as n
      from public.kpi_intrari('-infinity', pana) i
      join lateral (
        select e.autor_id, e.la from public.evenimente e
         where e.lead_id = i.lead_id and e.tip = 'stare'
           and e.detalii->>'in' in ('a_raspuns', 'callback', 'programat', 'oferta_trimisa', 'client', 'pierdut')
           and e.la >= i.la and (i.pana_la is null or e.la < i.pana_la)
         order by e.la, e.id limit 1
      ) rs on true
     where rs.la >= de and rs.la < pana
  ),
  fapte as (
    select 'luat'::text as k, (e.detalii->>'in')::uuid as om, e.lead_id as obj, null::numeric as v
      from public.evenimente e
     where e.tip = 'caller' and e.detalii->>'in' is not null and e.la >= de and e.la < pana
    union all
    select 'apel', a.autor_id, a.lead_id, null from ap a where a.apel_nou and a.la >= de and a.la < pana
    union all
    select 'raspuns', e.autor_id, e.lead_id, null
      from public.evenimente e
     where e.tip = 'stare' and e.autor_id is not null and e.la >= de and e.la < pana
       and e.detalii->>'de' in ('nou', 'fara_raspuns', 'callback')
       and e.detalii->>'in' in ('a_raspuns', 'callback', 'programat', 'oferta_trimisa', 'client', 'pierdut')
    union all
    select 'programat', e.autor_id, e.lead_id, null
      from public.evenimente e
     where e.tip = 'programat' and e.autor_id is not null and e.la >= de and e.la < pana
    union all
    select 'primul', p.autor_id, p.lead_id, (extract(epoch from p.la - p.intrat) / 60)::numeric from primul p where p.la is not null
    union all
    select 'nesunat', l.caller_id, p.lead_id, null
      from primul p join public.lead_uri l on l.id = p.lead_id
     where p.intrat < now() - interval '24 hours' and (p.la is null or p.la > p.intrat + interval '24 hours')
    union all
    select 'incercari', x.autor_id, x.lead_id, x.n from raspuns x
  ),
  rez as (
    select f.om, grouping(f.om) as g,
           (count(distinct f.obj) filter (where f.k = 'luat'))::int as luate,
           (count(*) filter (where f.k = 'apel'))::int as apeluri,
           (count(distinct f.obj) filter (where f.k = 'raspuns'))::int as au_raspuns,
           (count(distinct f.obj) filter (where f.k = 'programat'))::int as programate,
           round((percentile_cont(0.5) within group (order by f.v) filter (where f.k = 'primul'))::numeric, 1) as minute_primul_apel,
           (count(*) filter (where f.k = 'nesunat'))::int as nesunate_24h,
           round(avg(f.v) filter (where f.k = 'incercari'), 1) as incercari_pana_raspunde
      from fapte f
     group by grouping sets ((f.om), ())
  )
  select z.om, z.luate, z.apeluri, z.au_raspuns, z.programate, z.minute_primul_apel, z.nesunate_24h, z.incercari_pana_raspunde
    from rez z, rol
   where (rol.r = 'admin' and (z.g = 1 or z.om is not null))
      or (rol.r <> 'admin' and z.g = 0 and z.om = rol.eu)
  union all
  -- cine nu e Admin primește mereu rândul lui, chiar fără activitate
  select rol.eu, 0, 0, 0, 0, null, 0, null
    from rol
   where rol.r <> 'admin' and not exists (select 1 from rez z where z.g = 0 and z.om = rol.eu)
$$;

-- 2. Task-ul bifat: ora o pune baza (acum). Doar cheia de serviciu (scripturile de date, firma demo)
--    poate da o oră din trecut, ca task-urile vechi să nu pară toate întârziate.
create or replace function public.inainte_de_task() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null then
      new.creat_de := auth.uid();
    end if;
  else
    if new.proiect_id is distinct from old.proiect_id then
      raise exception 'Task-ul nu se mută pe alt proiect.';
    end if;
    new.creat_de := old.creat_de;
    new.creat_la := old.creat_la;
  end if;

  if new.om_id is not null and (tg_op = 'INSERT' or new.om_id is distinct from old.om_id)
     and not exists (
       select 1 from public.profiluri p
        where p.id = new.om_id and p.activ
          and (p.rol = 'admin'
               or exists (select 1 from public.proiect_oameni o where o.proiect_id = new.proiect_id and o.om_id = p.id))
     ) then
    raise exception 'Task-ul se dă doar cuiva din proiect.';
  end if;

  if not new.gata then
    new.gata_la := null;
  elsif auth.uid() is null and tg_op = 'INSERT' and new.gata_la is not null then
    null; -- cheia de serviciu și-a pus singură ora
  elsif tg_op = 'INSERT' or not old.gata then
    new.gata_la := now();
  else
    new.gata_la := old.gata_la;
  end if;
  return new;
end $$;
