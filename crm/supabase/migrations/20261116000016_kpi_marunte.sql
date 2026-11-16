-- Măruntele rămase de la pagina KPI.

-- ───────────── 0. migrația 000010 a scos constrângerea veche de contact? ─────────────
-- Blocul de acolo nu dădea eroare dacă n-o găsea; dacă a rămas, lead-ul fără nume nu se poate scrie.
do $$
begin
  if exists (
    select 1 from pg_constraint
     where conrelid = 'public.lead_uri'::regclass and contype = 'c' and conname <> 'lead_uri_contact'
       and pg_get_constraintdef(oid) ilike '%telefon_norm IS NOT NULL%email_norm IS NOT NULL%'
  ) then
    raise exception 'Constrângerea veche de contact e încă pe lead_uri.';
  end if;
end $$;

-- ───────────── 1. indexul pentru cifre ─────────────
-- Funcțiile KPI caută evenimentele după tip și dată.
create index evenimente_tip_la on public.evenimente (tip, la);

-- ───────────── 2. motivul ține doar de Pierdut și Descalificat ─────────────
-- Pe orice drum (programarea făcută de Admin, cheia de serviciu, mutarea): ieșit din ele, motivul se golește.
create function public.lead_fara_motiv_vechi() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.stare not in ('pierdut', 'descalificat') then
    new.motiv := null;
    new.motiv_categorie := null;
  end if;
  return new;
end $$;
create trigger lead_fara_motiv_vechi before update of stare, motiv, motiv_categorie on public.lead_uri
  for each row execute function public.lead_fara_motiv_vechi();
revoke execute on function public.lead_fara_motiv_vechi() from public, anon, authenticated;

-- ───────────── 3. „de refăcut” după livrare, nu după titlu ─────────────
create or replace function public.dupa_livrare() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  eu uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    insert into public.evenimente_proiect (proiect_id, autor_id, tip, detalii)
      values (new.proiect_id, eu, 'livrat', jsonb_build_object('titlu', new.titlu, 'livrare', new.id));
  elsif new.stare is distinct from old.stare then
    insert into public.evenimente_proiect (proiect_id, autor_id, tip, detalii)
      values (new.proiect_id, eu, 'livrare_stare', jsonb_build_object('titlu', new.titlu, 'in', new.stare, 'livrare', new.id));
  end if;
  return null;
end $$;

-- evenimentele vechi primesc livrarea acolo unde titlul e unic pe proiect
update public.evenimente_proiect e
   set detalii = e.detalii || jsonb_build_object('livrare', v.id)
  from public.livrari v
 where e.tip in ('livrat', 'livrare_stare') and not e.detalii ? 'livrare'
   and v.proiect_id = e.proiect_id and v.titlu = e.detalii->>'titlu'
   and (select count(*) from public.livrari w where w.proiect_id = v.proiect_id and w.titlu = v.titlu) = 1;

create or replace function public.kpi_proiecte(de timestamptz, pana timestamptz)
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
              where e.proiect_id = v.proiect_id and e.tip = 'livrare_stare' and e.detalii->>'in' = 'de_refacut'
                -- evenimentele fără livrare (titlu repetat pe proiect, de dinainte de reparație): după titlu
                and (e.detalii->>'livrare' = v.id::text or (not e.detalii ? 'livrare' and e.detalii->>'titlu' = v.titlu))) as refacut
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

-- ───────────── 4. încercările până răspunde: pe apeluri, ca „Apeluri” ─────────────
-- Două „Nu răspunde” la sub 10 minute sunt un apel, deci o încercare. Încercările = apelurile până la cel
-- care a prins omul, fără el.
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
           greatest((select count(*) from ap a
                      where a.lead_id = i.lead_id and a.apel_nou and a.la >= i.la and a.la <= rs.la) - 1, 0)::numeric as n
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

-- ───────────── 5. lead-ul reintrat: discuția veche nu mai contează ─────────────
-- „De la discuție la client” pornește de la prima discuție de după ultima intrare. La rata de închidere,
-- discuția se socotește convertită doar dacă clientul vine înainte de o intrare nouă.
create or replace function public.kpi_inchideri(de timestamptz, pana timestamptz)
returns table (om_id uuid, programate int, au_venit int, clienti int, vandut_lei bigint, fara_pret int, zile_pana_la_client numeric,
               clienti_din_discutii int)
language sql stable security definer set search_path = ''
as $$
  with
  rol as (select public.kpi_rol() as r, auth.uid() as eu),
  devenit_client as (
    select e.lead_id, e.la, l.closer_id,
           (select max(x.la) from public.evenimente x
             where x.lead_id = e.lead_id and x.tip in ('creat', 'redeschis') and x.la <= e.la) as intrat
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
           and d.incepe_la >= coalesce(c.intrat, '-infinity')
      ) prima on prima.la is not null
    union all
    select 'client_din_discutie', d.closer_id, d.lead_id, null
      from public.discutii d
     where d.incepe_la >= de and d.incepe_la < pana and d.incepe_la <= now() and d.neprezentat_la is null
       and exists (select 1 from public.evenimente e
                    where e.lead_id = d.lead_id and e.tip = 'stare' and e.detalii->>'in' = 'client' and e.la >= d.incepe_la
                      and not exists (select 1 from public.evenimente x
                                       where x.lead_id = d.lead_id and x.tip in ('creat', 'redeschis')
                                         and x.la > d.incepe_la and x.la <= e.la))
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

-- ───────────── 6. anularea „N-a venit” întoarce lead-ul în Programat ─────────────
-- Doar dacă „N-a venit” l-a mutat (programat → callback) și nu s-a mai lucrat pe el de atunci.
-- Mutările făcute de „N-a venit” și de anulare ies din Parcurs: altfel ar arăta ca un apel cu răspuns.
-- „N-a venit” și „N-a venit, anulat” rămân.
create or replace function public.marcheaza_neprezentat(d uuid, da boolean) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  eu uuid := auth.uid();
  r public.rol := public.rol_curent();
  x record;
  t0 timestamptz;
begin
  select id, lead_id, closer_id, incepe_la, neprezentat_la into x from public.discutii where id = d;
  if not found then
    raise exception 'Discuția nu mai există.' using errcode = '42501';
  end if;
  if r is null or (r <> 'admin' and x.closer_id is distinct from eu) then
    raise exception 'Doar closerul discuției o marchează.' using errcode = '42501';
  end if;
  if x.incepe_la > now() then
    raise exception 'Discuția n-a început încă.' using errcode = '42501';
  end if;

  if da then
    if x.neprezentat_la is not null then
      return;
    end if;
    update public.discutii set neprezentat_la = now() where id = d;
    insert into public.evenimente (lead_id, autor_id, tip, detalii)
      values (x.lead_id, eu, 'neprezentat', jsonb_build_object('discutie', d, 'la', x.incepe_la));
    update public.lead_uri set stare = 'callback', callback_la = now()
     where id = x.lead_id and stare = 'programat'
       and not exists (select 1 from public.discutii o where o.lead_id = x.lead_id and o.incepe_la > now());
  else
    if x.neprezentat_la is null then
      return;
    end if;
    update public.discutii set neprezentat_la = null where id = d;

    select e.la into t0 from public.evenimente e
     where e.lead_id = x.lead_id and e.tip = 'neprezentat' and e.detalii->>'discutie' = d::text
     order by e.la desc, e.id desc limit 1;
    if t0 is not null
       and exists (select 1 from public.lead_uri l where l.id = x.lead_id and l.stare = 'callback')
       and exists (select 1 from public.evenimente e
                    where e.lead_id = x.lead_id and e.la = t0 and e.tip = 'stare'
                      and e.detalii->>'de' = 'programat' and e.detalii->>'in' = 'callback')
       and not exists (select 1 from public.evenimente e
                        where e.lead_id = x.lead_id and e.la > t0 and e.tip not in ('neprezentat', 'neprezentat_anulat')) then
      update public.lead_uri set stare = 'programat', callback_la = null where id = x.lead_id;
      delete from public.evenimente e
       where e.lead_id = x.lead_id
         and ((e.la = t0 and (e.tip = 'callback'
                              or (e.tip = 'stare' and e.detalii->>'de' = 'programat' and e.detalii->>'in' = 'callback')))
              or (e.la = now() and e.tip = 'stare' and e.detalii->>'de' = 'callback' and e.detalii->>'in' = 'programat'));
    end if;

    insert into public.evenimente (lead_id, autor_id, tip, detalii)
      values (x.lead_id, eu, 'neprezentat_anulat', jsonb_build_object('discutie', d, 'la', x.incepe_la));
  end if;
end $$;

-- ───────────── 7. coada calendarului: rândurile care pică nu mai țin locul celorlalte ─────────────
-- După o eroare, rândul așteaptă 2 min × 2^încercări (4 min, 8, 16… cel mult o zi) și trece după cele noi.
-- După 10 încercări se oprește, până îl repune cineva în coadă (ora schimbată, „Reîncearcă”, reconectarea).
create or replace function public.calendar_ia_din_coada(limita int, p_discutie uuid default null, p_om uuid default null)
returns setof public.calendar_coada
language sql security definer set search_path = ''
as $$
  with alese as (
    select c.id
      from public.calendar_coada c
     where c.incercari < 10
       and (c.luat_la is null
            or c.luat_la < now() - least(interval '2 minutes' * power(2, c.incercari), interval '1 day'))
       and (p_discutie is null or c.discutie_id = p_discutie)
       and (p_om is null or c.om_id = p_om
            or exists (select 1 from public.discutii d where d.id = c.discutie_id and d.closer_id = p_om))
     order by c.incercari, c.id
     limit limita
       for update of c skip locked
  )
  update public.calendar_coada q
     set luat_la = now()
    from alese
   where q.id = alese.id
  returning q.*;
$$;

-- repus în coadă = pornește de la zero
create or replace function public.calendar_pune_scrie(p_discutie uuid) returns void
language sql security definer set search_path = ''
as $$
  insert into public.calendar_coada (actiune, discutie_id) values ('scrie', p_discutie)
  on conflict (discutie_id) where actiune = 'scrie'
  do update set versiune = public.calendar_coada.versiune + 1, luat_la = null, creat_la = now(), incercari = 0;
$$;
