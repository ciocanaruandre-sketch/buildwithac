-- CRM buildwithac, etapa 3, bucata 2: Finanțe. Tabelele, permisiunile și încasatul vechi mutat în tranșe.
-- Operațiile care mișcă bani (încasarea, returnarea, plata) sunt funcții, în migrațiile următoare.
-- Ele pun set_config('finante.functie', '1', true); trigger-ele de aici lasă doar atunci câmpurile banilor să se schimbe.

create type public.tip_transa as enum ('odata', 'avans', 'rest', 'rata', 'extra', 'mentenanta', 'inainte');

-- Procentele de bază: se pun singure pe proiectele noi (și pe oamenii adăugați). Gol = nestabilit.
create table public.procente_baza (
  categorie text not null check (categorie in ('site', 'automatizari', '1la1', 'altceva', 'mentenanta')),
  rol public.rol not null check (rol in ('caller', 'closer', 'constructor')),
  procent numeric(5,2) check (procent between 0 and 100),
  primary key (categorie, rol)
);
insert into public.procente_baza (categorie, rol)
select c, r::public.rol
  from unnest(array['site', 'automatizari', '1la1', 'altceva', 'mentenanta']) c
 cross join unnest(array['caller', 'closer', 'constructor']) r;

-- Callerul și closerul cu procent pe proiect. Separat de proiect_oameni, ca procentul să nu le deschidă fișa.
create table public.proiect_vanzari (
  proiect_id uuid not null references public.proiecte (id) on delete cascade,
  om_id uuid not null references public.profiluri (id) on delete cascade,
  procent numeric(5,2) check (procent between 0 and 100),
  adaugat_la timestamptz not null default now(),
  primary key (proiect_id, om_id)
);
create index proiect_vanzari_om on public.proiect_vanzari (om_id);

-- Tranșele planului de plată (și ale mentenanței). O tranșă e încasată o singură dată; plata parțială o taie în două.
create table public.transe (
  id uuid primary key default gen_random_uuid(),
  proiect_id uuid not null references public.proiecte (id) on delete cascade,
  tip public.tip_transa not null,
  eticheta text not null check (length(eticheta) between 1 and 60),
  suma_lei int not null check (suma_lei between 1 and 10000000),
  scadenta date not null,
  incasata_la date,
  incasat_lei int check (incasat_lei between 1 and 10000000),
  returnat_lei int not null default 0 check (returnat_lei >= 0),
  returnata_la date,
  abonament_id uuid,
  -- e-mailul de întârziere pleacă o singură dată pe tranșă
  alerta_trimisa_la timestamptz,
  creat_la timestamptz not null default now(),
  check ((incasata_la is null) = (incasat_lei is null)),
  check (returnat_lei <= coalesce(incasat_lei, 0))
);
create index transe_proiect on public.transe (proiect_id, scadenta);
create index transe_neincasate on public.transe (scadenta) where incasata_la is null;

-- Comisioanele: câte unul pe om la fiecare încasare; „minus” = comision plătit dintr-o tranșă returnată.
-- Procentul și suma se îngheață la încasare. Gol = procent nestabilit (se completează când Adminul îl pune).
create table public.comisioane (
  id uuid primary key default gen_random_uuid(),
  tip text not null default 'comision' check (tip in ('comision', 'minus')),
  transa_id uuid references public.transe (id) on delete set null,
  proiect_id uuid references public.proiecte (id) on delete set null,
  om_id uuid not null references public.profiluri (id) on delete cascade,
  procent numeric(5,2) check (procent between 0 and 100),
  baza_lei int not null,
  suma_lei int,
  nota text,
  platit_la date,
  creat_la timestamptz not null default now(),
  check (tip = 'comision' or suma_lei < 0)
);
create index comisioane_om_neplatite on public.comisioane (om_id) where platit_la is null;
create index comisioane_om on public.comisioane (om_id);
create index comisioane_transa on public.comisioane (transa_id);
create index comisioane_proiect on public.comisioane (proiect_id);

-- ───────────── cine are voie ─────────────

alter table public.procente_baza enable row level security;
alter table public.proiect_vanzari enable row level security;
alter table public.transe enable row level security;
alter table public.comisioane enable row level security;

revoke all on public.procente_baza, public.proiect_vanzari, public.transe, public.comisioane from anon, authenticated;
grant select, update on public.procente_baza to authenticated;
grant select, insert, update, delete on public.proiect_vanzari, public.transe to authenticated;
-- comisioanele le adaugă și le șterg doar funcțiile; Adminul doar bifează „plătit”
grant select, update on public.comisioane to authenticated;

create policy procente_baza_citire on public.procente_baza for select to authenticated
  using ((select public.rol_curent()) = 'admin');
create policy procente_baza_schimbare on public.procente_baza for update to authenticated
  using ((select public.rol_curent()) = 'admin') with check ((select public.rol_curent()) = 'admin');

create policy proiect_vanzari_citire on public.proiect_vanzari for select to authenticated
  using ((select public.rol_curent()) = 'admin' or ((select public.rol_curent()) is not null and om_id = (select auth.uid())));
create policy proiect_vanzari_adaugare on public.proiect_vanzari for insert to authenticated
  with check ((select public.rol_curent()) = 'admin');
create policy proiect_vanzari_schimbare on public.proiect_vanzari for update to authenticated
  using ((select public.rol_curent()) = 'admin') with check ((select public.rol_curent()) = 'admin');
create policy proiect_vanzari_stergere on public.proiect_vanzari for delete to authenticated
  using ((select public.rol_curent()) = 'admin');

create policy transe_citire on public.transe for select to authenticated
  using ((select public.rol_curent()) = 'admin');
create policy transe_adaugare on public.transe for insert to authenticated
  with check ((select public.rol_curent()) = 'admin');
create policy transe_schimbare on public.transe for update to authenticated
  using ((select public.rol_curent()) = 'admin') with check ((select public.rol_curent()) = 'admin');
create policy transe_stergere on public.transe for delete to authenticated
  using ((select public.rol_curent()) = 'admin');

create policy comisioane_citire on public.comisioane for select to authenticated
  using ((select public.rol_curent()) = 'admin' or ((select public.rol_curent()) is not null and om_id = (select auth.uid())));
create policy comisioane_schimbare on public.comisioane for update to authenticated
  using ((select public.rol_curent()) = 'admin') with check ((select public.rol_curent()) = 'admin');

-- ───────────── regulile pe rânduri ─────────────

-- funcțiile de bani pun acest semn pe durata tranzacției lor
create function public.in_functie_finante() returns boolean
language sql stable set search_path = ''
as $$ select coalesce(current_setting('finante.functie', true), '') = '1' $$;

create function public.inainte_de_vanzator() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (select 1 from public.profiluri p where p.id = new.om_id and p.rol in ('caller', 'closer') and p.activ) then
    raise exception 'Aici se pun doar calleri și closeri cu contul pornit.';
  end if;
  return new;
end $$;

create trigger inainte_de_vanzator before insert or update of om_id on public.proiect_vanzari
  for each row execute function public.inainte_de_vanzator();

-- Câmpurile încasării se schimbă doar din funcții. O tranșă încasată nu se schimbă și nu se șterge direct
-- (doar odată cu proiectul, prin cascadă). Cheia de serviciu (fără utilizator) trece.
create function public.inainte_de_transa() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null or public.in_functie_finante() then
    return coalesce(new, old);
  end if;
  if tg_op = 'DELETE' then
    if old.incasata_la is not null and exists (select 1 from public.proiecte p where p.id = old.proiect_id) then
      raise exception 'Tranșa e încasată. Anulează încasarea întâi.';
    end if;
    return old;
  end if;
  if tg_op = 'UPDATE' then
    if old.incasata_la is not null then
      raise exception 'Tranșa e încasată. Anulează încasarea întâi.';
    end if;
    if new.proiect_id is distinct from old.proiect_id or new.abonament_id is distinct from old.abonament_id then
      raise exception 'Tranșa nu se mută pe alt proiect.';
    end if;
  end if;
  if new.incasata_la is not null or new.incasat_lei is not null or new.returnat_lei <> 0 or new.returnata_la is not null
     or (tg_op = 'UPDATE' and new.alerta_trimisa_la is distinct from old.alerta_trimisa_la) then
    raise exception 'Încasarea se face doar din butonul „Am încasat”.';
  end if;
  return new;
end $$;

create trigger inainte_de_transa before insert or update or delete on public.transe
  for each row execute function public.inainte_de_transa();

-- Direct se schimbă doar bifa „plătit” (și legăturile puse pe null de cascadă, la ștergerea clientului).
create function public.inainte_de_comision() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null or public.in_functie_finante() then
    return new;
  end if;
  if (to_jsonb(new) - 'platit_la' - 'proiect_id' - 'transa_id') is distinct from (to_jsonb(old) - 'platit_la' - 'proiect_id' - 'transa_id')
     or (new.proiect_id is distinct from old.proiect_id and new.proiect_id is not null)
     or (new.transa_id is distinct from old.transa_id and new.transa_id is not null) then
    raise exception 'Din comision se schimbă doar bifa „plătit”.';
  end if;
  if new.platit_la is not null and new.suma_lei is null then
    raise exception 'Procentul nu e stabilit încă.';
  end if;
  return new;
end $$;

create trigger inainte_de_comision before update on public.comisioane
  for each row execute function public.inainte_de_comision();

-- Proiectul nou primește callerul și closerul clientului, cu procentul de bază al rolului lor.
create function public.dupa_proiect_nou() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.proiect_vanzari (proiect_id, om_id, procent)
  select new.id, p.id, b.procent
    from public.clienti c
    join public.profiluri p on p.id in (c.caller_id, c.closer_id) and p.rol in ('caller', 'closer') and p.activ
    left join public.procente_baza b on b.categorie = new.serviciu::text and b.rol = p.rol
   where c.id = new.client_id
  on conflict do nothing;
  return null;
end $$;

create trigger dupa_proiect_nou after insert on public.proiecte
  for each row execute function public.dupa_proiect_nou();

revoke execute on function public.inainte_de_vanzator(), public.inainte_de_transa(), public.inainte_de_comision(), public.dupa_proiect_nou()
  from public, anon, authenticated;
revoke execute on function public.in_functie_finante() from public, anon;
grant execute on function public.in_functie_finante() to authenticated, service_role;

-- ───────────── datele de dinainte ─────────────

-- callerul și closerul clienților existenți, fără procent (îl pune Adminul)
insert into public.proiect_vanzari (proiect_id, om_id)
select pr.id, p.id
  from public.proiecte pr
  join public.clienti c on c.id = pr.client_id
  join public.profiluri p on p.id in (c.caller_id, c.closer_id) and p.rol in ('caller', 'closer') and p.activ
on conflict do nothing;

-- încasatul scris de mână devine o tranșă încasată azi
insert into public.transe (proiect_id, tip, eticheta, suma_lei, scadenta, incasata_la, incasat_lei)
select id, 'inainte', 'Încasat înainte de Finanțe', incasat_lei,
       (now() at time zone 'Europe/Bucharest')::date, (now() at time zone 'Europe/Bucharest')::date, incasat_lei
  from public.proiecte
 where incasat_lei > 0;

-- banii de dinainte se consideră împărțiți: comisioanele lor sunt plătite
insert into public.comisioane (tip, transa_id, proiect_id, om_id, procent, baza_lei, suma_lei, nota, platit_la)
select 'comision', t.id, t.proiect_id, o.om_id, o.procent, t.incasat_lei, round(t.incasat_lei * o.procent / 100)::int, 'dinainte de Finanțe', t.incasata_la
  from public.transe t
  join public.proiect_oameni o on o.proiect_id = t.proiect_id
  join public.profiluri p on p.id = o.om_id and p.rol <> 'admin'
 where t.tip = 'inainte' and o.procent > 0;
