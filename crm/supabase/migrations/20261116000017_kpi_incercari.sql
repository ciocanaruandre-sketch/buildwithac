-- ───────────── 1. încercările până răspunde: apelul care a prins omul nu se mai lipește de cel ratat ─────────────
-- Încercările = apelurile începute înainte de răspuns (două „Nu răspunde” la sub 10 minute sunt tot un apel).
-- „Nu răspunde” la 9:00 și răspuns la 9:03 = 1 încercare, oricine ar fi sunat a doua oară (decizia lui Andrei).
create or replace function public.kpi_apeluri(de timestamptz, pana timestamptz)
returns table (om_id uuid, luate int, apeluri int, au_raspuns int, programate int,
               minute_primul_apel numeric, nesunate_24h int, incercari_pana_raspunde numeric,
               programate_din_raspuns int)
language sql stable security definer set search_path = ''
as $$
  with
  rol as (select public.kpi_rol() as r, auth.uid() as eu),
  ap as (select * from public.kpi_apel_ev()),
  primul as (
    select i.lead_id, i.la as intrat, p.autor_id, p.la
      from public.kpi_intrari(de, pana) i
      left join lateral (
        select a.autor_id, a.la from ap a
         where a.lead_id = i.lead_id and a.la >= i.la and (i.pana_la is null or a.la < i.pana_la)
         order by a.la limit 1
      ) p on true
  ),
  raspuns as (
    select i.lead_id, rs.autor_id,
           (select count(*) from ap a
             where a.lead_id = i.lead_id and a.apel_nou and a.la >= i.la and a.la < rs.la)::numeric as n
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
    select 'raspuns_programat', e.autor_id, e.lead_id, null
      from public.evenimente e
     where e.tip = 'stare' and e.autor_id is not null and e.la >= de and e.la < pana
       and e.detalii->>'de' in ('nou', 'fara_raspuns', 'callback')
       and e.detalii->>'in' in ('a_raspuns', 'callback', 'programat', 'oferta_trimisa', 'client', 'pierdut')
       and exists (select 1 from public.evenimente p
                    where p.lead_id = e.lead_id and p.la >= e.la
                      and (p.tip = 'programat' or (p.tip = 'stare' and p.detalii->>'in' = 'programat')))
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
           round(avg(f.v) filter (where f.k = 'incercari'), 1) as incercari_pana_raspunde,
           (count(distinct f.obj) filter (where f.k = 'raspuns_programat'))::int as programate_din_raspuns
      from fapte f
     group by grouping sets ((f.om), ())
  )
  select z.om, z.luate, z.apeluri, z.au_raspuns, z.programate, z.minute_primul_apel, z.nesunate_24h, z.incercari_pana_raspunde, z.programate_din_raspuns
    from rez z, rol
   where (rol.r = 'admin' and (z.g = 1 or z.om is not null))
      or (rol.r <> 'admin' and z.g = 0 and z.om = rol.eu)
  union all
  select rol.eu, 0, 0, 0, 0, null, 0, null, 0
    from rol
   where rol.r <> 'admin' and not exists (select 1 from rez z where z.g = 0 and z.om = rol.eu)
$$;

-- ───────────── 2. motivele rămase de dinainte de 000016 ─────────────
-- Lead-urile ieșite deja din Pierdut/Descalificat pe un drum care nu golea motivul. Fără schimbare de stare:
-- nu scrie în Parcurs și nu pornește calendarul.
update public.lead_uri set motiv = null, motiv_categorie = null
 where stare not in ('pierdut', 'descalificat') and (motiv is not null or motiv_categorie is not null);
