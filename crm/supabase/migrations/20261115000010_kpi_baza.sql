-- KPI, baza: lead-ul fără nume (după un an), „N-a venit” pe discuții și categoria motivului.

-- ───────────── coloanele ─────────────
alter table public.lead_uri
  add column anonimizat_la timestamptz,
  add column motiv_categorie text check (motiv_categorie in (
    'prea_scump', 'alt_furnizor', 'nu_mai_are_nevoie', 'nu_mai_raspunde',
    'nu_are_firma', 'numar_gresit', 'nu_e_interesat', 'cauta_altceva', 'altceva'));

-- lead-ul fără nume nu mai are nici telefon, nici e-mail
do $$
declare c text;
begin
  for c in
    select conname from pg_constraint
     where conrelid = 'public.lead_uri'::regclass and contype = 'c'
       and pg_get_constraintdef(oid) ilike '%telefon_norm IS NOT NULL%email_norm IS NOT NULL%'
  loop
    execute format('alter table public.lead_uri drop constraint %I', c);
  end loop;
end $$;
alter table public.lead_uri add constraint lead_uri_contact
  check (anonimizat_la is not null or telefon_norm is not null or email_norm is not null);

alter table public.discutii add column neprezentat_la timestamptz;

-- ───────────── lead-ul fără nume nu se vede pentru nimeni (rămâne doar în cifre) ─────────────
drop policy lead_citire on public.lead_uri;
create policy lead_citire on public.lead_uri for select to authenticated
  using ((select public.rol_curent()) in ('admin', 'caller', 'closer') and anonimizat_la is null);

-- ───────────── Parcursul: categoria motivului la schimbarea stării ─────────────
-- aceeași funcție ca în 20261111000001_proiecte.sql; în plus, `categorie` la evenimentul `stare`
create or replace function public.dupa_schimbare_lead() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  eu uuid := auth.uid();
  c uuid;
begin
  if tg_op = 'INSERT' then
    insert into public.evenimente (lead_id, autor_id, tip, detalii)
      values (new.id, eu, 'creat', jsonb_build_object('sursa', new.sursa));
    return null;
  end if;

  if new.stare is distinct from old.stare then
    insert into public.evenimente (lead_id, autor_id, tip, detalii)
      values (new.id, eu, 'stare', jsonb_strip_nulls(jsonb_build_object(
        'de', old.stare, 'in', new.stare, 'motiv', new.motiv, 'categorie', new.motiv_categorie)));
  end if;
  if new.incercari > old.incercari then
    insert into public.evenimente (lead_id, autor_id, tip, detalii)
      values (new.id, eu, 'incercare', jsonb_build_object('nr', new.incercari));
  end if;
  if new.caller_id is distinct from old.caller_id then
    insert into public.evenimente (lead_id, autor_id, tip, detalii)
      values (new.id, eu, 'caller', jsonb_build_object('de', old.caller_id, 'in', new.caller_id));
  end if;
  if new.closer_id is distinct from old.closer_id then
    insert into public.evenimente (lead_id, autor_id, tip, detalii)
      values (new.id, eu, 'closer', jsonb_build_object('de', old.closer_id, 'in', new.closer_id));
  end if;
  if new.callback_la is distinct from old.callback_la and new.callback_la is not null then
    insert into public.evenimente (lead_id, autor_id, tip, detalii)
      values (new.id, eu, 'callback', jsonb_build_object('la', new.callback_la));
  end if;

  if new.stare = 'client' and old.stare <> 'client' then
    insert into public.clienti (lead_id, nume, telefon, email, serviciu, sursa, caller_id, closer_id)
      values (new.id, new.nume, new.telefon, new.email, new.serviciu, new.sursa, new.caller_id, new.closer_id)
      on conflict (lead_id) do nothing
      returning id into c;
    -- doar clientul nou primește proiect; cel care exista deja îl are
    if c is not null then
      insert into public.proiecte (client_id, titlu, serviciu, creat_de)
        values (c, public.titlu_implicit(new.serviciu), new.serviciu, eu);
    end if;
  end if;
  return null;
end $$;

-- ───────────── după un an: fără nume, nu șters ─────────────
-- Scoate datele personale ale lead-urilor care n-au ajuns clienți și au intrat de peste `zile` zile.
-- Rămân: starea, sursa, serviciul, oamenii, datele și Parcursul (fără motivul scris), pentru cifre.
create function public.anonimizeaza_vechi(zile int) returns int
language plpgsql security definer set search_path = ''
as $$
declare
  ids uuid[];
begin
  select coalesce(array_agg(id), '{}') into ids
    from public.lead_uri
   where stare <> 'client' and anonimizat_la is null
     and intrat_la < now() - make_interval(days => zile);
  if cardinality(ids) = 0 then
    return 0;
  end if;
  delete from public.cereri where lead_id = any (ids);
  delete from public.notite where lead_id = any (ids);
  update public.evenimente set detalii = detalii - 'motiv'
   where lead_id = any (ids) and detalii ? 'motiv';
  update public.lead_uri
     set nume = 'Lead șters', telefon = null, telefon_norm = null, email = null, email_norm = null,
         motiv = null, callback_la = null, anonimizat_la = now()
   where id = any (ids);
  return cardinality(ids);
end $$;
revoke execute on function public.anonimizeaza_vechi(int) from public, anon, authenticated;
grant execute on function public.anonimizeaza_vechi(int) to service_role;

-- ───────────── „N-a venit” ─────────────
-- da = true: discuția începută e marcată; lead-ul `programat` fără altă discuție viitoare trece în `callback`,
-- la același closer. da = false: marcajul se scoate, starea rămâne. Fără schimbare, fără eveniment.
create function public.marcheaza_neprezentat(d uuid, da boolean) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  eu uuid := auth.uid();
  r public.rol := public.rol_curent();
  x record;
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
    insert into public.evenimente (lead_id, autor_id, tip, detalii)
      values (x.lead_id, eu, 'neprezentat_anulat', jsonb_build_object('discutie', d, 'la', x.incepe_la));
  end if;
end $$;
revoke execute on function public.marcheaza_neprezentat(uuid, boolean) from public, anon;
grant execute on function public.marcheaza_neprezentat(uuid, boolean) to authenticated;
