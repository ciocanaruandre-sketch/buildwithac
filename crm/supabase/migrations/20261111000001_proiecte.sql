-- CRM buildwithac, etapa 2: proiectele, oamenii de pe proiect, task-urile și parcursul proiectului.
-- Valorile enum-urilor = lib/tipuri.ts. Mesajele din „raise exception” (cod P0001) ajung în pagină: se scriu în română.
create type public.stadiu as enum ('discutie', 'schita', 'constructie', 'revizii', 'livrat', 'mentenanta');

create table public.proiecte (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clienti (id) on delete cascade,
  titlu text not null check (length(titlu) between 1 and 120),
  serviciu public.serviciu not null,
  stadiu public.stadiu not null default 'discutie',
  pret_lei int check (pret_lei between 0 and 10000000),
  incasat_lei int not null default 0 check (incasat_lei between 0 and 10000000),
  termen date,
  -- colaborarea pe proiectul ăsta s-a terminat (de aici se numără anul din pagina de confidențialitate)
  inchis_la timestamptz,
  creat_de uuid references public.profiluri (id) on delete set null,
  creat_la timestamptz not null default now()
);
create index proiecte_client on public.proiecte (client_id);
create index proiecte_creat_de on public.proiecte (creat_de);

-- constructorii puși pe proiect; Adminul e pe toate, fără rând aici
create table public.proiect_oameni (
  proiect_id uuid not null references public.proiecte (id) on delete cascade,
  om_id uuid not null references public.profiluri (id) on delete cascade,
  -- comisionul omului pe proiectul ăsta; gol = nestabilit încă
  procent numeric(5,2) check (procent between 0 and 100),
  adaugat_la timestamptz not null default now(),
  primary key (proiect_id, om_id)
);
create index proiect_oameni_om on public.proiect_oameni (om_id);

create table public.taskuri (
  id uuid primary key default gen_random_uuid(),
  proiect_id uuid not null references public.proiecte (id) on delete cascade,
  titlu text not null check (length(titlu) between 1 and 200),
  om_id uuid references public.profiluri (id) on delete set null,
  termen date,
  gata boolean not null default false,
  gata_la timestamptz,
  creat_de uuid default auth.uid() references public.profiluri (id) on delete set null,
  creat_la timestamptz not null default now()
);
create index taskuri_proiect on public.taskuri (proiect_id);
create index taskuri_om on public.taskuri (om_id) where not gata;
create index taskuri_creat_de on public.taskuri (creat_de);

-- Parcursul proiectului: scris doar de trigger-e
create table public.evenimente_proiect (
  id bigint generated always as identity primary key,
  proiect_id uuid not null references public.proiecte (id) on delete cascade,
  autor_id uuid references public.profiluri (id) on delete set null,
  tip text not null,
  detalii jsonb not null default '{}',
  la timestamptz not null default now()
);
create index evenimente_proiect_proiect on public.evenimente_proiect (proiect_id, la desc);
create index evenimente_proiect_autor on public.evenimente_proiect (autor_id);

-- ───────────── cine are voie ─────────────

-- Adminul sau un constructor pus pe proiect. Regula de acces pentru tot ce ține de un proiect.
create function public.lucreaza_la(p uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select case (select public.rol_curent())
    when 'admin' then true
    when 'constructor' then exists (select 1 from public.proiect_oameni o where o.proiect_id = p and o.om_id = auth.uid())
    else false
  end
$$;

-- Oamenii de pe un proiect, fără procente (procentul și-l vede fiecare doar pe al lui).
create function public.oameni_proiect(p uuid) returns table (om_id uuid)
language sql stable security definer set search_path = ''
as $$ select o.om_id from public.proiect_oameni o where o.proiect_id = p and public.lucreaza_la(p) $$;

-- Omul ăsta e pe un proiect pe care sunt și eu?
create function public.e_coleg(alt uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.proiect_oameni a
      join public.proiect_oameni b on b.proiect_id = a.proiect_id
     where a.om_id = auth.uid() and b.om_id = alt
  )
$$;

create function public.titlu_implicit(s public.serviciu) returns text
language sql immutable set search_path = ''
as $$
  select case s
    when 'site' then 'Site'
    when 'automatizari' then 'Automatizări'
    when '1la1' then 'Sesiune 1 la 1 / ghid'
    else 'Proiect'
  end
$$;

revoke execute on function public.lucreaza_la(uuid), public.oameni_proiect(uuid), public.e_coleg(uuid), public.titlu_implicit(public.serviciu) from public, anon;
grant execute on function public.lucreaza_la(uuid), public.oameni_proiect(uuid), public.e_coleg(uuid) to authenticated;

alter table public.proiecte enable row level security;
alter table public.proiect_oameni enable row level security;
alter table public.taskuri enable row level security;
alter table public.evenimente_proiect enable row level security;

revoke all on public.proiecte, public.proiect_oameni, public.taskuri, public.evenimente_proiect from anon;
grant select, insert, update, delete on public.proiecte, public.proiect_oameni, public.taskuri, public.evenimente_proiect to authenticated;

-- proiecte: le vede și le schimbă cine lucrează la ele (ce coloane, hotărăște trigger-ul); le adaugă și le șterge doar Adminul
create policy proiecte_citire on public.proiecte for select to authenticated
  using (public.lucreaza_la(id));
create policy proiecte_adaugare on public.proiecte for insert to authenticated
  with check ((select public.rol_curent()) = 'admin');
create policy proiecte_schimbare on public.proiecte for update to authenticated
  using (public.lucreaza_la(id)) with check (public.lucreaza_la(id));
create policy proiecte_stergere on public.proiecte for delete to authenticated
  using ((select public.rol_curent()) = 'admin');

-- oamenii de pe proiect: Adminul tot; constructorul doar rândul lui (cu procentul lui)
create policy proiect_oameni_citire on public.proiect_oameni for select to authenticated
  using (
    (select public.rol_curent()) = 'admin'
    or ((select public.rol_curent()) = 'constructor' and om_id = (select auth.uid()))
  );
create policy proiect_oameni_adaugare on public.proiect_oameni for insert to authenticated
  with check ((select public.rol_curent()) = 'admin');
create policy proiect_oameni_schimbare on public.proiect_oameni for update to authenticated
  using ((select public.rol_curent()) = 'admin') with check ((select public.rol_curent()) = 'admin');
create policy proiect_oameni_stergere on public.proiect_oameni for delete to authenticated
  using ((select public.rol_curent()) = 'admin');

create policy taskuri_citire on public.taskuri for select to authenticated
  using (public.lucreaza_la(proiect_id));
create policy taskuri_adaugare on public.taskuri for insert to authenticated
  with check (public.lucreaza_la(proiect_id));
create policy taskuri_schimbare on public.taskuri for update to authenticated
  using (public.lucreaza_la(proiect_id)) with check (public.lucreaza_la(proiect_id));
create policy taskuri_stergere on public.taskuri for delete to authenticated
  using (public.lucreaza_la(proiect_id));

create policy evenimente_proiect_citire on public.evenimente_proiect for select to authenticated
  using (public.lucreaza_la(proiect_id));

-- clienți: ca în etapa 1, plus constructorul care lucrează la un proiect al clientului; îi schimbă și îi șterge doar Adminul
drop policy clienti_citire on public.clienti;
create policy clienti_citire on public.clienti for select to authenticated
  using (
    (select public.rol_curent()) = 'admin'
    or ((select public.rol_curent()) in ('caller', 'closer')
        and (caller_id = (select auth.uid()) or closer_id = (select auth.uid())))
    or ((select public.rol_curent()) = 'constructor'
        and exists (select 1 from public.proiecte p where p.client_id = clienti.id and public.lucreaza_la(p.id)))
  );
create policy clienti_schimbare on public.clienti for update to authenticated
  using ((select public.rol_curent()) = 'admin') with check ((select public.rol_curent()) = 'admin');
create policy clienti_stergere on public.clienti for delete to authenticated
  using ((select public.rol_curent()) = 'admin');

-- profiluri: constructorul nu mai vede toată echipa, doar pe el, Adminii și colegii de proiect
drop policy profiluri_citire on public.profiluri;
create policy profiluri_citire on public.profiluri for select to authenticated
  using (
    (select public.rol_curent()) in ('admin', 'caller', 'closer')
    or ((select public.rol_curent()) = 'constructor'
        and (id = (select auth.uid()) or rol = 'admin' or public.e_coleg(id)))
  );

-- programul closerilor îi privește doar pe cei care programează discuții
drop policy program_citire on public.program_closer;
create policy program_citire on public.program_closer for select to authenticated
  using ((select public.rol_curent()) in ('admin', 'caller', 'closer'));

-- ───────────── regulile pe coloane ─────────────

create function public.inainte_de_schimbare_proiect() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  -- cheia de serviciu (fără utilizator) și Adminul trec
  if auth.uid() is null or public.rol_curent() = 'admin' then
    return new;
  end if;
  if old.inchis_la is not null then
    raise exception 'Proiectul e închis.';
  end if;
  if (to_jsonb(new) - 'stadiu') is distinct from (to_jsonb(old) - 'stadiu') then
    raise exception 'Doar Adminul schimbă datele proiectului.';
  end if;
  return new;
end $$;

create trigger inainte_de_schimbare_proiect before update on public.proiecte
  for each row execute function public.inainte_de_schimbare_proiect();

create function public.inainte_de_om_pe_proiect() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (select 1 from public.profiluri p where p.id = new.om_id and p.rol = 'constructor' and p.activ) then
    raise exception 'Pe proiect se pun doar constructori cu contul pornit.';
  end if;
  return new;
end $$;

create trigger inainte_de_om_pe_proiect before insert or update of om_id on public.proiect_oameni
  for each row execute function public.inainte_de_om_pe_proiect();

create function public.inainte_de_task() returns trigger
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
  elsif tg_op = 'INSERT' or not old.gata then
    new.gata_la := now();
  else
    new.gata_la := old.gata_la;
  end if;
  return new;
end $$;

create trigger inainte_de_task before insert or update on public.taskuri
  for each row execute function public.inainte_de_task();

-- ───────────── Parcursul, scris automat ─────────────

create function public.dupa_schimbare_proiect() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  eu uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    insert into public.evenimente_proiect (proiect_id, autor_id, tip, detalii)
      values (new.id, eu, 'proiect_creat', jsonb_build_object('titlu', new.titlu, 'serviciu', new.serviciu));
    return null;
  end if;
  if new.stadiu is distinct from old.stadiu then
    insert into public.evenimente_proiect (proiect_id, autor_id, tip, detalii)
      values (new.id, eu, 'stadiu', jsonb_build_object('de', old.stadiu, 'in', new.stadiu));
  end if;
  if new.inchis_la is not null and old.inchis_la is null then
    insert into public.evenimente_proiect (proiect_id, autor_id, tip) values (new.id, eu, 'inchis');
  elsif new.inchis_la is null and old.inchis_la is not null then
    insert into public.evenimente_proiect (proiect_id, autor_id, tip) values (new.id, eu, 'redeschis');
  end if;
  return null;
end $$;

create trigger dupa_schimbare_proiect after insert or update on public.proiecte
  for each row execute function public.dupa_schimbare_proiect();

create function public.dupa_om_pe_proiect() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  eu uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    insert into public.evenimente_proiect (proiect_id, autor_id, tip, detalii)
      values (new.proiect_id, eu, 'om_adaugat', jsonb_build_object('om', new.om_id));
    return null;
  end if;
  -- la ștergerea întregului proiect (cascade) nu mai e nimic de notat
  if exists (select 1 from public.proiecte p where p.id = old.proiect_id) then
    insert into public.evenimente_proiect (proiect_id, autor_id, tip, detalii)
      values (old.proiect_id, eu, 'om_scos', jsonb_build_object('om', old.om_id));
    -- task-urile lui neterminate rămân fără om
    update public.taskuri set om_id = null where proiect_id = old.proiect_id and om_id = old.om_id and not gata;
  end if;
  return null;
end $$;

create trigger dupa_om_pe_proiect after insert or delete on public.proiect_oameni
  for each row execute function public.dupa_om_pe_proiect();

revoke execute on function public.inainte_de_schimbare_proiect(), public.inainte_de_om_pe_proiect(), public.inainte_de_task(),
  public.dupa_schimbare_proiect(), public.dupa_om_pe_proiect() from public, anon, authenticated;

-- ───────────── lead → client → primul proiect ─────────────

-- aceeași funcție ca în etapa 1; la sfârșit, clientul nou primește și primul proiect
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
      values (new.id, eu, 'stare', jsonb_strip_nulls(jsonb_build_object('de', old.stare, 'in', new.stare, 'motiv', new.motiv)));
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

-- clienții de dinaintea etapei 2: câte un proiect fiecăruia
insert into public.proiecte (client_id, titlu, serviciu)
select c.id, public.titlu_implicit(c.serviciu), c.serviciu
  from public.clienti c
 where not exists (select 1 from public.proiecte p where p.client_id = c.id);
