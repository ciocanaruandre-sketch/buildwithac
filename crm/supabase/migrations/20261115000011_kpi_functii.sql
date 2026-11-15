-- KPI: cifrele paginii /kpi, numărate în baza de date (spec: docs/superpowers/specs/2026-11-15-crm-kpi-design.md).
-- Fiecare funcție primește perioada [de, pana) și verifică rolul înăuntru. Adminul primește câte un rând pe om
-- plus totalul (om_id null); ceilalți doar rândul lor. Lead-urile fără nume rămân în cifre.

-- ───────────── ajutoare ─────────────

-- rolul celui conectat; fără cont activ → eroare
create function public.kpi_rol() returns public.rol
language plpgsql stable security definer set search_path = ''
as $$
declare
  r public.rol := public.rol_curent();
begin
  if r is null then
    raise exception 'Nu ai acces la cifre.' using errcode = '42501';
  end if;
  return r;
end $$;
revoke execute on function public.kpi_rol() from public, anon;
grant execute on function public.kpi_rol() to authenticated;

-- intrările cu `la` în [de, pana): `creat` sau `redeschis`. Fiecare se termină la următoarea intrare a lead-ului (pana_la).
-- Sursa = cererea cea mai apropiată (±1 oră), altfel sursa din eveniment, altfel a lead-ului.
create function public.kpi_intrari(de timestamptz, pana timestamptz)
returns table (lead_id uuid, la timestamptz, pana_la timestamptz, sursa text)
language sql stable security definer set search_path = ''
as $$
  with toate as (
    select e.lead_id, e.la, e.detalii,
           lead(e.la) over (partition by e.lead_id order by e.la, e.id) as urm
      from public.evenimente e
     where e.tip in ('creat', 'redeschis')
  )
  select t.lead_id, t.la, t.urm,
         coalesce(
           (select c.sursa::text from public.cereri c
             where c.lead_id = t.lead_id and c.primita_la between t.la - interval '1 hour' and t.la + interval '1 hour'
             order by abs(extract(epoch from c.primita_la - t.la)) limit 1),
           t.detalii->>'sursa',
           (select l.sursa::text from public.lead_uri l where l.id = t.lead_id))
    from toate t
   where t.la >= de and t.la < pana
$$;

-- apelurile: „Nu răspunde” sau o schimbare de stare din nou / fara_raspuns / callback, făcute de un om.
-- Ale aceluiași om pe același lead la mai puțin de 10 minute una de alta sunt un singur apel (apel_nou = false).
create function public.kpi_apel_ev()
returns table (lead_id uuid, autor_id uuid, la timestamptz, apel_nou boolean)
language sql stable security definer set search_path = ''
as $$
  select x.lead_id, x.autor_id, x.la, x.prec is null or x.la - x.prec >= interval '10 minutes'
    from (
      select e.lead_id, e.autor_id, e.la,
             lag(e.la) over (partition by e.lead_id, e.autor_id order by e.la, e.id) as prec
        from public.evenimente e
       where e.autor_id is not null
         and (e.tip = 'incercare' or (e.tip = 'stare' and e.detalii->>'de' in ('nou', 'fara_raspuns', 'callback')))
    ) x
$$;

revoke execute on function public.kpi_intrari(timestamptz, timestamptz), public.kpi_apel_ev() from public, anon, authenticated;

-- ───────────── Apeluri ─────────────

create function public.kpi_apeluri(de timestamptz, pana timestamptz)
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

-- ───────────── Închideri ─────────────

create function public.kpi_inchideri(de timestamptz, pana timestamptz)
returns table (om_id uuid, programate int, au_venit int, clienti int, vandut_lei bigint, fara_pret int, zile_pana_la_client numeric)
language sql stable security definer set search_path = ''
as $$
  with
  rol as (select public.kpi_rol() as r, auth.uid() as eu),
  devenit_client as (
    select e.lead_id, e.la, l.closer_id
      from public.evenimente e join public.lead_uri l on l.id = e.lead_id
     where e.tip = 'stare' and e.detalii->>'in' = 'client' and e.la >= de and e.la < pana
  ),
  proiecte_noi as (
    select p.id, p.pret_lei from public.proiecte p where p.creat_la >= de and p.creat_la < pana
  ),
  fapte as (
    select 'programata'::text as k, d.closer_id as om, d.id as obj, null::numeric as v
      from public.discutii d
     where d.incepe_la >= de and d.incepe_la < pana and d.incepe_la <= now()
    union all
    select 'venit', d.closer_id, d.id, null
      from public.discutii d
     where d.incepe_la >= de and d.incepe_la < pana and d.incepe_la <= now() and d.neprezentat_la is null
    union all
    select 'client', c.closer_id, c.lead_id, null from devenit_client c
    union all
    select 'zile', c.closer_id, c.lead_id, (extract(epoch from c.la - prima.la) / 86400)::numeric
      from devenit_client c
      join lateral (
        select min(d.incepe_la) as la from public.discutii d
         where d.lead_id = c.lead_id and d.neprezentat_la is null and d.incepe_la <= c.la
      ) prima on prima.la is not null
    -- vândut: pe fiecare om din proiect_vanzari; totalul o dată pe proiect
    union all
    select 'vandut', v.om_id, p.id, p.pret_lei::numeric
      from proiecte_noi p join public.proiect_vanzari v on v.proiect_id = p.id
     where p.pret_lei is not null
    union all
    select 'vandut_total', null, p.id, p.pret_lei::numeric from proiecte_noi p where p.pret_lei is not null
    union all
    select 'fara_pret', v.om_id, p.id, null
      from proiecte_noi p join public.proiect_vanzari v on v.proiect_id = p.id
     where p.pret_lei is null
    union all
    select 'fara_pret_total', null, p.id, null from proiecte_noi p where p.pret_lei is null
  ),
  rez as (
    select f.om, grouping(f.om) as g,
           (count(*) filter (where f.k = 'programata'))::int as programate,
           (count(*) filter (where f.k = 'venit'))::int as au_venit,
           (count(distinct f.obj) filter (where f.k = 'client'))::int as clienti,
           (case when grouping(f.om) = 1 then coalesce(sum(f.v) filter (where f.k = 'vandut_total'), 0)
                 else coalesce(sum(f.v) filter (where f.k = 'vandut'), 0) end)::bigint as vandut_lei,
           (case when grouping(f.om) = 1 then count(*) filter (where f.k = 'fara_pret_total')
                 else count(*) filter (where f.k = 'fara_pret') end)::int as fara_pret,
           round((percentile_cont(0.5) within group (order by f.v) filter (where f.k = 'zile'))::numeric, 1) as zile_pana_la_client
      from fapte f
     group by grouping sets ((f.om), ())
  )
  select z.om, z.programate, z.au_venit, z.clienti,
         case when rol.r = 'admin' then z.vandut_lei end,
         case when rol.r = 'admin' then z.fara_pret end,
         z.zile_pana_la_client
    from rez z, rol
   where (rol.r = 'admin' and (z.g = 1 or z.om is not null))
      or (rol.r <> 'admin' and z.g = 0 and z.om = rol.eu)
  union all
  select rol.eu, 0, 0, 0, null, null, null
    from rol
   where rol.r <> 'admin' and not exists (select 1 from rez z where z.g = 0 and z.om = rol.eu)
$$;

-- ───────────── De la lead la client (doar Admin) ─────────────

-- intrările din perioadă și cât de departe a ajuns fiecare, numărând doar ce s-a întâmplat după intrarea ei
create function public.kpi_palnie(de timestamptz, pana timestamptz)
returns table (intrari int, sunate int, au_raspuns int, programate int, au_venit int, oferta int, clienti int)
language sql stable security definer set search_path = ''
as $$
  with i as (
    select x.lead_id, x.la, coalesce(x.pana_la, 'infinity') as pana_la from public.kpi_intrari(de, pana) x
  )
  select count(*)::int,
         (count(*) filter (where exists (
            select 1 from public.evenimente e
             where e.lead_id = i.lead_id and e.la >= i.la and e.la < i.pana_la
               and e.autor_id is not null and e.tip in ('incercare', 'stare'))))::int,
         (count(*) filter (where exists (
            select 1 from public.evenimente e
             where e.lead_id = i.lead_id and e.la >= i.la and e.la < i.pana_la and e.tip = 'stare'
               and e.detalii->>'in' in ('a_raspuns', 'callback', 'programat', 'oferta_trimisa', 'client', 'pierdut'))))::int,
         (count(*) filter (where exists (
            select 1 from public.evenimente e
             where e.lead_id = i.lead_id and e.la >= i.la and e.la < i.pana_la
               and (e.tip = 'programat' or (e.tip = 'stare' and e.detalii->>'in' = 'programat')))
            or exists (
            select 1 from public.discutii d
             where d.lead_id = i.lead_id and d.incepe_la >= i.la and d.incepe_la < i.pana_la)))::int,
         (count(*) filter (where exists (
            select 1 from public.discutii d
             where d.lead_id = i.lead_id and d.incepe_la >= i.la and d.incepe_la < i.pana_la
               and d.incepe_la <= now() and d.neprezentat_la is null)))::int,
         (count(*) filter (where exists (
            select 1 from public.evenimente e
             where e.lead_id = i.lead_id and e.la >= i.la and e.la < i.pana_la and e.tip = 'stare'
               and e.detalii->>'in' in ('oferta_trimisa', 'client'))))::int,
         (count(*) filter (where exists (
            select 1 from public.evenimente e
             where e.lead_id = i.lead_id and e.la >= i.la and e.la < i.pana_la and e.tip = 'stare'
               and e.detalii->>'in' = 'client')))::int
    from i
  having public.kpi_rol() = 'admin'
$$;

-- ───────────── De ce pierzi ─────────────

-- Adminul: toate; closerul: lead-urile lui; ceilalți: nimic. Evenimentele vechi, fără categorie, sunt „altceva”.
create function public.kpi_pierderi(de timestamptz, pana timestamptz)
returns table (stare text, categorie text, nr int)
language sql stable security definer set search_path = ''
as $$
  with rol as (select public.kpi_rol() as r, auth.uid() as eu)
  select e.detalii->>'in', coalesce(e.detalii->>'categorie', 'altceva'), count(*)::int
    from public.evenimente e
    join public.lead_uri l on l.id = e.lead_id
    cross join rol
   where e.tip = 'stare' and e.detalii->>'in' in ('pierdut', 'descalificat') and e.la >= de and e.la < pana
     and (rol.r = 'admin' or (rol.r = 'closer' and l.closer_id = rol.eu))
   group by 1, 2
   order by 3 desc, 1, 2
$$;

-- ───────────── De unde vin (doar Admin) ─────────────

create function public.kpi_surse(de timestamptz, pana timestamptz)
returns table (sursa text, intrari int, clienti int)
language sql stable security definer set search_path = ''
as $$
  select i.sursa, count(*)::int,
         (count(*) filter (where exists (
            select 1 from public.evenimente e
             where e.lead_id = i.lead_id and e.la >= i.la and (i.pana_la is null or e.la < i.pana_la)
               and e.tip = 'stare' and e.detalii->>'in' = 'client')))::int
    from public.kpi_intrari(de, pana) i
   where public.kpi_rol() = 'admin'
   group by i.sursa
   order by 2 desc, 1
$$;

revoke execute on function public.kpi_apeluri(timestamptz, timestamptz), public.kpi_inchideri(timestamptz, timestamptz),
  public.kpi_palnie(timestamptz, timestamptz), public.kpi_pierderi(timestamptz, timestamptz), public.kpi_surse(timestamptz, timestamptz)
  from public, anon;
grant execute on function public.kpi_apeluri(timestamptz, timestamptz), public.kpi_inchideri(timestamptz, timestamptz),
  public.kpi_palnie(timestamptz, timestamptz), public.kpi_pierderi(timestamptz, timestamptz), public.kpi_surse(timestamptz, timestamptz)
  to authenticated;

-- ───────────── Proiecte ─────────────

-- o zi (data, ora României) ca moment: începutul ei
create function public.kpi_zi(z date) returns timestamptz
language sql immutable set search_path = ''
as $$ select z::timestamp at time zone 'Europe/Bucharest' $$;
revoke execute on function public.kpi_zi(date) from public, anon, authenticated;

-- Pe om = proiect_oameni (task-urile: om_id). Livrat = prima trecere în `livrat`.
-- Task-urile: cu termenul în perioadă, deja trecut sau deja gata; la termen = gata cel târziu în ziua termenului.
create function public.kpi_proiecte(de timestamptz, pana timestamptz)
returns table (om_id uuid, livrate int, zile_durata numeric, livrari_trimise int, livrari_refacute int,
               taskuri_cu_termen int, taskuri_la_termen int)
language sql stable security definer set search_path = ''
as $$
  with
  rol as (select public.kpi_rol() as r, auth.uid() as eu),
  azi as (select (now() at time zone 'Europe/Bucharest')::date as z),
  prima_livrare as (
    select x.proiect_id, x.la
      from (select e.proiect_id, min(e.la) as la
              from public.evenimente_proiect e
             where e.tip = 'stadiu' and e.detalii->>'in' = 'livrat'
             group by e.proiect_id) x
     where x.la >= de and x.la < pana
  ),
  livrari as (
    select v.id, v.proiect_id,
           v.stare = 'de_refacut' or exists (
             select 1 from public.evenimente_proiect e
              where e.proiect_id = v.proiect_id and e.tip = 'livrare_stare'
                and e.detalii->>'titlu' = v.titlu and e.detalii->>'in' = 'de_refacut') as refacut
      from public.livrari v
     where v.adaugat_la >= de and v.adaugat_la < pana
  ),
  taskuri as (
    select t.id, t.om_id, t.gata_la is not null and t.gata_la < public.kpi_zi(t.termen + 1) as la_termen
      from public.taskuri t, azi
     where t.termen is not null
       and public.kpi_zi(t.termen) >= de and public.kpi_zi(t.termen) < pana
       and (t.termen < azi.z or t.gata)
  ),
  fapte as (
    select 'livrat'::text as k, o.om_id as om, l.proiect_id as obj,
           (extract(epoch from l.la - p.creat_la) / 86400)::numeric as v
      from prima_livrare l
      join public.proiecte p on p.id = l.proiect_id
      left join public.proiect_oameni o on o.proiect_id = l.proiect_id
    union all
    select 'trimisa', o.om_id, v.id, null
      from livrari v left join public.proiect_oameni o on o.proiect_id = v.proiect_id
    union all
    select 'refacuta', o.om_id, v.id, null
      from livrari v left join public.proiect_oameni o on o.proiect_id = v.proiect_id
     where v.refacut
    union all
    select 'task', t.om_id, t.id, null from taskuri t
    union all
    select 'task_ok', t.om_id, t.id, null from taskuri t where t.la_termen
  ),
  -- o livrare pe un proiect cu doi oameni apare de două ori: numărăm obiecte distincte
  rez as (
    select f.om, grouping(f.om) as g,
           (count(distinct f.obj) filter (where f.k = 'livrat'))::int as livrate,
           round((percentile_cont(0.5) within group (order by f.v) filter (where f.k = 'livrat'))::numeric, 1) as zile_durata,
           (count(distinct f.obj) filter (where f.k = 'trimisa'))::int as livrari_trimise,
           (count(distinct f.obj) filter (where f.k = 'refacuta'))::int as livrari_refacute,
           (count(distinct f.obj) filter (where f.k = 'task'))::int as taskuri_cu_termen,
           (count(distinct f.obj) filter (where f.k = 'task_ok'))::int as taskuri_la_termen
      from fapte f
     group by grouping sets ((f.om), ())
  )
  select z.om, z.livrate, z.zile_durata, z.livrari_trimise, z.livrari_refacute, z.taskuri_cu_termen, z.taskuri_la_termen
    from rez z, rol
   where (rol.r = 'admin' and (z.g = 1 or z.om is not null))
      or (rol.r <> 'admin' and z.g = 0 and z.om = rol.eu)
  union all
  select rol.eu, 0, null, 0, 0, 0, 0
    from rol
   where rol.r <> 'admin' and not exists (select 1 from rez z where z.g = 0 and z.om = rol.eu)
$$;

-- ───────────── Bani (doar Admin) ─────────────

-- Încasat = încasat minus returnat în perioadă. Mentenanța = abonamentele pornite și neoprite la `pana`.
-- Întârzierile sunt „acum”, ca pe /finante: scadența trecută, neîncasată.
create function public.kpi_bani(de timestamptz, pana timestamptz)
returns table (incasat_lei bigint, valoare_medie_lei numeric, mentenanta_lei bigint, transe_intarziate int, intarziat_lei bigint)
language sql stable security definer set search_path = ''
as $$
  with azi as (select (now() at time zone 'Europe/Bucharest')::date as z)
  select
    (coalesce((select sum(t.incasat_lei) from public.transe t
                where t.incasata_la is not null and public.kpi_zi(t.incasata_la) >= de and public.kpi_zi(t.incasata_la) < pana), 0)
     - coalesce((select sum(t.returnat_lei) from public.transe t
                  where t.returnata_la is not null and public.kpi_zi(t.returnata_la) >= de and public.kpi_zi(t.returnata_la) < pana), 0))::bigint,
    (select round(avg(p.pret_lei)) from public.proiecte p
      where p.pret_lei is not null and p.creat_la >= de and p.creat_la < pana),
    coalesce((select sum(a.suma_lei) from public.abonamente a
               where public.kpi_zi(a.porneste) <= pana and (a.oprit_la is null or public.kpi_zi(a.oprit_la) > pana)), 0)::bigint,
    (select count(*) from public.transe t, azi where t.incasata_la is null and t.scadenta < azi.z)::int,
    coalesce((select sum(t.suma_lei) from public.transe t, azi where t.incasata_la is null and t.scadenta < azi.z), 0)::bigint
  where public.kpi_rol() = 'admin'
$$;

-- ultimele `luni` luni calendaristice (ora României), inclusiv cea curentă, câte un rând pe lună, și cu 0
create function public.kpi_luni(luni int)
returns table (luna date, clienti_noi int, incasat_lei bigint)
language sql stable security definer set search_path = ''
as $$
  with l as (
    select (date_trunc('month', (now() at time zone 'Europe/Bucharest')::date) - make_interval(months => n))::date as luna
      from generate_series(0, greatest(luni, 1) - 1) n
  )
  select l.luna,
         (select count(distinct e.lead_id) from public.evenimente e
           where e.tip = 'stare' and e.detalii->>'in' = 'client'
             and e.la >= public.kpi_zi(l.luna) and e.la < public.kpi_zi((l.luna + interval '1 month')::date))::int,
         (coalesce((select sum(t.incasat_lei) from public.transe t
                     where t.incasata_la >= l.luna and t.incasata_la < (l.luna + interval '1 month')::date), 0)
          - coalesce((select sum(t.returnat_lei) from public.transe t
                       where t.returnata_la >= l.luna and t.returnata_la < (l.luna + interval '1 month')::date), 0))::bigint
    from l
   where public.kpi_rol() = 'admin'
   order by l.luna
$$;

revoke execute on function public.kpi_proiecte(timestamptz, timestamptz), public.kpi_bani(timestamptz, timestamptz), public.kpi_luni(int)
  from public, anon;
grant execute on function public.kpi_proiecte(timestamptz, timestamptz), public.kpi_bani(timestamptz, timestamptz), public.kpi_luni(int)
  to authenticated;
