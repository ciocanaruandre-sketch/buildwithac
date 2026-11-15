-- Reparațiile de la verificarea finală (pagina nu arată niciodată peste 100% și nici trepte care cresc).

-- 1. Pâlnia: fiecare treaptă îi numără și pe cei care au ajuns mai departe (ca „au răspuns” din specificație).
--    Un lead trimis la ofertă direct de caller trece și pe la „programat” și „discuții ținute”.
create or replace function public.kpi_palnie(de timestamptz, pana timestamptz)
returns table (intrari int, sunate int, au_raspuns int, programate int, au_venit int, oferta int, clienti int)
language sql stable security definer set search_path = ''
as $$
  with i as (
    select x.lead_id, x.la, coalesce(x.pana_la, 'infinity') as pana_la from public.kpi_intrari(de, pana) x
  ),
  -- treapta cea mai departe atinsă de fiecare intrare (0 = doar intrat, 6 = client)
  t as (
    select greatest(
             case when exists (
               select 1 from public.evenimente e
                where e.lead_id = i.lead_id and e.la >= i.la and e.la < i.pana_la
                  and e.autor_id is not null and e.tip in ('incercare', 'stare')) then 1 else 0 end,
             case when exists (
               select 1 from public.evenimente e
                where e.lead_id = i.lead_id and e.la >= i.la and e.la < i.pana_la and e.tip = 'stare'
                  and e.detalii->>'in' in ('a_raspuns', 'callback', 'programat', 'oferta_trimisa', 'client', 'pierdut')) then 2 else 0 end,
             case when exists (
               select 1 from public.evenimente e
                where e.lead_id = i.lead_id and e.la >= i.la and e.la < i.pana_la
                  and (e.tip = 'programat' or (e.tip = 'stare' and e.detalii->>'in' = 'programat')))
               or exists (
               select 1 from public.discutii d
                where d.lead_id = i.lead_id and d.incepe_la >= i.la and d.incepe_la < i.pana_la) then 3 else 0 end,
             case when exists (
               select 1 from public.discutii d
                where d.lead_id = i.lead_id and d.incepe_la >= i.la and d.incepe_la < i.pana_la
                  and d.incepe_la <= now() and d.neprezentat_la is null) then 4 else 0 end,
             case when exists (
               select 1 from public.evenimente e
                where e.lead_id = i.lead_id and e.la >= i.la and e.la < i.pana_la and e.tip = 'stare'
                  and e.detalii->>'in' in ('oferta_trimisa', 'client')) then 5 else 0 end,
             case when exists (
               select 1 from public.evenimente e
                where e.lead_id = i.lead_id and e.la >= i.la and e.la < i.pana_la and e.tip = 'stare'
                  and e.detalii->>'in' = 'client') then 6 else 0 end
           ) as n
      from i
  )
  select count(*)::int,
         (count(*) filter (where n >= 1))::int,
         (count(*) filter (where n >= 2))::int,
         (count(*) filter (where n >= 3))::int,
         (count(*) filter (where n >= 4))::int,
         (count(*) filter (where n >= 5))::int,
         (count(*) filter (where n >= 6))::int
    from t
  having public.kpi_rol() = 'admin'
$$;

-- 2. Rata de programare pe răspunsurile perioadei (coloana nouă `programate_din_raspuns`).
--    Tipul întors se schimbă, deci funcția se refăce.
drop function public.kpi_apeluri(timestamptz, timestamptz);
create function public.kpi_apeluri(de timestamptz, pana timestamptz)
returns table (om_id uuid, luate int, apeluri int, au_raspuns int, programate int,
               minute_primul_apel numeric, nesunate_24h int, incercari_pana_raspunde numeric,
               programate_din_raspuns int)
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
    -- rata de programare: dintre răspunsurile perioadei, câte s-au programat (și după perioadă, până acum)
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
  -- cine nu e Admin primește mereu rândul lui, chiar fără activitate
  select rol.eu, 0, 0, 0, 0, null, 0, null, 0
    from rol
   where rol.r <> 'admin' and not exists (select 1 from rez z where z.g = 0 and z.om = rol.eu)
$$;

-- 3. Rata de închidere pe discuțiile perioadei (coloana nouă `clienti_din_discutii`).
drop function public.kpi_inchideri(timestamptz, timestamptz);
create function public.kpi_inchideri(de timestamptz, pana timestamptz)
returns table (om_id uuid, programate int, au_venit int, clienti int, vandut_lei bigint, fara_pret int, zile_pana_la_client numeric,
               clienti_din_discutii int)
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
    -- rata de închidere: dintre discuțiile ținute în perioadă, câte lead-uri s-au făcut clienți (și după perioadă, până acum)
    union all
    select 'client_din_discutie', d.closer_id, d.lead_id, null
      from public.discutii d
     where d.incepe_la >= de and d.incepe_la < pana and d.incepe_la <= now() and d.neprezentat_la is null
       and exists (select 1 from public.evenimente e
                    where e.lead_id = d.lead_id and e.tip = 'stare' and e.detalii->>'in' = 'client' and e.la >= d.incepe_la)
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
           round((percentile_cont(0.5) within group (order by f.v) filter (where f.k = 'zile'))::numeric, 1) as zile_pana_la_client,
           (count(distinct f.obj) filter (where f.k = 'client_din_discutie'))::int as clienti_din_discutii
      from fapte f
     group by grouping sets ((f.om), ())
  )
  select z.om, z.programate, z.au_venit, z.clienti,
         case when rol.r = 'admin' then z.vandut_lei end,
         case when rol.r = 'admin' then z.fara_pret end,
         z.zile_pana_la_client, z.clienti_din_discutii
    from rez z, rol
   where (rol.r = 'admin' and (z.g = 1 or z.om is not null))
      or (rol.r <> 'admin' and z.g = 0 and z.om = rol.eu)
  union all
  select rol.eu, 0, 0, 0, null, null, null, 0
    from rol
   where rol.r <> 'admin' and not exists (select 1 from rez z where z.g = 0 and z.om = rol.eu)
$$;

revoke execute on function public.kpi_apeluri(timestamptz, timestamptz), public.kpi_inchideri(timestamptz, timestamptz) from public, anon;
grant execute on function public.kpi_apeluri(timestamptz, timestamptz), public.kpi_inchideri(timestamptz, timestamptz) to authenticated;
