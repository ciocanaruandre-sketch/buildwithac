-- Finanțe: mentenanța lunară (abonamentele și tranșele lor), comisionul ei și „Mută tot la…” cu procentul de bază.

create table public.abonamente (
  id uuid primary key default gen_random_uuid(),
  proiect_id uuid not null references public.proiecte (id) on delete cascade,
  suma_lei int not null check (suma_lei between 1 and 10000000),
  zi int not null check (zi between 1 and 28),
  porneste date not null,
  oprit_la date,
  creat_la timestamptz not null default now()
);
create unique index abonamente_unul_pornit on public.abonamente (proiect_id) where oprit_la is null;

alter table public.transe
  add constraint transe_abonament foreign key (abonament_id) references public.abonamente (id) on delete cascade;
create index transe_abonament on public.transe (abonament_id, scadenta) where abonament_id is not null;

-- oamenii cu comision din mentenanță: lista abonamentului, separată de lista proiectului
create table public.abonament_oameni (
  abonament_id uuid not null references public.abonamente (id) on delete cascade,
  om_id uuid not null references public.profiluri (id) on delete cascade,
  procent numeric(5,2) check (procent between 0 and 100),
  primary key (abonament_id, om_id)
);
create index abonament_oameni_om on public.abonament_oameni (om_id);

alter table public.abonamente enable row level security;
alter table public.abonament_oameni enable row level security;
revoke all on public.abonamente, public.abonament_oameni from anon, authenticated;
-- abonamentele le scriu doar funcțiile; lista de oameni o schimbă Adminul direct
grant select on public.abonamente to authenticated;
grant select, insert, update, delete on public.abonament_oameni to authenticated;

create policy abonamente_citire on public.abonamente for select to authenticated
  using ((select public.rol_curent()) = 'admin');
create policy abonament_oameni_citire on public.abonament_oameni for select to authenticated
  using ((select public.rol_curent()) = 'admin');
create policy abonament_oameni_adaugare on public.abonament_oameni for insert to authenticated
  with check ((select public.rol_curent()) = 'admin');
create policy abonament_oameni_schimbare on public.abonament_oameni for update to authenticated
  using ((select public.rol_curent()) = 'admin') with check ((select public.rol_curent()) = 'admin');
create policy abonament_oameni_stergere on public.abonament_oameni for delete to authenticated
  using ((select public.rol_curent()) = 'admin');

create function public.azi_ro() returns date
language sql stable set search_path = ''
as $$ select (now() at time zone 'Europe/Bucharest')::date $$;
revoke execute on function public.azi_ro() from public, anon;
grant execute on function public.azi_ro() to authenticated, service_role;

-- Tranșa fiecărei luni a abonamentelor pornite, până la `pana`. O lună care are deja o tranșă (sau un rest) nu primește alta.
create function public.genereaza_mentenanta(pana date) returns int
language plpgsql security definer set search_path = ''
as $$
declare
  luni text[] := array['ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie', 'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie'];
  a public.abonamente;
  luna date;
  d date;
  n int := 0;
begin
  if auth.uid() is not null and public.rol_curent() is distinct from 'admin' then
    raise exception 'Doar Adminul face tranșele de mentenanță.';
  end if;
  for a in select * from public.abonamente where oprit_la is null order by id for update loop
    luna := date_trunc('month', a.porneste)::date;
    while luna <= pana loop
      d := luna + (a.zi - 1);
      if d >= a.porneste and d <= pana
         and not exists (select 1 from public.transe x where x.abonament_id = a.id and date_trunc('month', x.scadenta) = luna) then
        insert into public.transe (proiect_id, tip, eticheta, suma_lei, scadenta, abonament_id)
          values (a.proiect_id, 'mentenanta', 'Mentenanță ' || luni[extract(month from d)::int], a.suma_lei, d, a.id);
        n := n + 1;
      end if;
      luna := (luna + interval '1 month')::date;
    end loop;
  end loop;
  return n;
end $$;

-- Pornește abonamentul: omul care se ocupă (implicit primul constructor de pe proiect) cu procentul de bază al mentenanței,
-- plus callerul și closerul proiectului, doar dacă procentul lor de bază la mentenanță e peste 0.
create function public.porneste_abonament(p uuid, suma int, zi int, porneste date, om uuid) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  a uuid;
  cine uuid := om;
begin
  if auth.uid() is not null and public.rol_curent() is distinct from 'admin' then
    raise exception 'Doar Adminul pornește mentenanța.';
  end if;
  if suma is null or suma < 1 or suma > 10000000 then
    raise exception 'Scrie suma lunară, în lei.';
  end if;
  if zi is null or zi < 1 or zi > 28 then
    raise exception 'Ziua din lună e între 1 și 28.';
  end if;
  if porneste is null then
    raise exception 'Alege data de pornire.';
  end if;
  if not exists (select 1 from public.proiecte where id = p) then
    raise exception 'Proiectul nu mai există.';
  end if;
  if exists (select 1 from public.abonamente where proiect_id = p and oprit_la is null) then
    raise exception 'Proiectul are deja o mentenanță pornită.';
  end if;

  insert into public.abonamente (proiect_id, suma_lei, zi, porneste) values (p, suma, zi, porneste) returning id into a;

  if cine is null then
    select o.om_id into cine from public.proiect_oameni o where o.proiect_id = p order by o.adaugat_la limit 1;
  end if;
  if cine is not null then
    insert into public.abonament_oameni (abonament_id, om_id, procent)
    select a, pr.id, b.procent
      from public.profiluri pr
      left join public.procente_baza b on b.categorie = 'mentenanta' and b.rol = pr.rol
     where pr.id = cine and pr.rol <> 'admin';
  end if;
  insert into public.abonament_oameni (abonament_id, om_id, procent)
  select a, v.om_id, b.procent
    from public.proiect_vanzari v
    join public.profiluri pr on pr.id = v.om_id
    join public.procente_baza b on b.categorie = 'mentenanta' and b.rol = pr.rol
   where v.proiect_id = p and b.procent > 0
  on conflict do nothing;

  perform public.genereaza_mentenanta(public.azi_ro() + 35);
  return a;
end $$;

-- Suma nouă contează de la tranșele neîncasate de azi încolo; ziua nouă, din luna următoare.
create function public.schimba_abonament(a uuid, suma int, zi int) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  azi date := public.azi_ro();
begin
  if auth.uid() is not null and public.rol_curent() is distinct from 'admin' then
    raise exception 'Doar Adminul schimbă mentenanța.';
  end if;
  if suma is null or suma < 1 or suma > 10000000 then
    raise exception 'Scrie suma lunară, în lei.';
  end if;
  if zi is null or zi < 1 or zi > 28 then
    raise exception 'Ziua din lună e între 1 și 28.';
  end if;
  if not exists (select 1 from public.abonamente where id = a and oprit_la is null) then
    raise exception 'Mentenanța e oprită.';
  end if;
  update public.transe set suma_lei = suma where abonament_id = a and incasata_la is null and scadenta >= azi;
  delete from public.transe
   where abonament_id = a and incasata_la is null and scadenta >= (date_trunc('month', azi) + interval '1 month')::date;
  update public.abonamente set suma_lei = suma, zi = schimba_abonament.zi where id = a;
  perform public.genereaza_mentenanta(azi + 35);
end $$;

-- Oprirea: tranșele viitoare neîncasate dispar; cele întârziate rămân.
create function public.opreste_abonament(a uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  azi date := public.azi_ro();
begin
  if auth.uid() is not null and public.rol_curent() is distinct from 'admin' then
    raise exception 'Doar Adminul oprește mentenanța.';
  end if;
  update public.abonamente set oprit_la = azi where id = a and oprit_la is null;
  if not found then
    raise exception 'Mentenanța e deja oprită.';
  end if;
  delete from public.transe where abonament_id = a and incasata_la is null and scadenta >= azi;
end $$;

-- Procentul pus pe omul abonamentului completează comisioanele lui nestabilite din tranșele abonamentului.
create function public.dupa_procent_abonament() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  vechi text := coalesce(current_setting('finante.functie', true), '');
begin
  if new.procent is not distinct from old.procent or new.procent is null then
    return null;
  end if;
  perform set_config('finante.functie', '1', true);
  if new.procent = 0 then
    delete from public.comisioane k
     using public.transe tr
     where tr.id = k.transa_id and tr.abonament_id = new.abonament_id and k.om_id = new.om_id
       and k.tip = 'comision' and k.suma_lei is null and k.platit_la is null;
  else
    update public.comisioane k
       set procent = new.procent, suma_lei = round(k.baza_lei * new.procent / 100)::int
      from public.transe tr
     where tr.id = k.transa_id and tr.abonament_id = new.abonament_id and k.om_id = new.om_id
       and k.tip = 'comision' and k.suma_lei is null and k.platit_la is null;
  end if;
  perform set_config('finante.functie', vechi, true);
  return null;
end $$;

create trigger dupa_procent_abonament after update of procent on public.abonament_oameni
  for each row execute function public.dupa_procent_abonament();

-- Încasarea (ca în 20261113000002): la mentenanță, comisioanele vin din lista abonamentului.
create or replace function public.incaseaza(t uuid, suma int, zi date, peste boolean default false) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  r public.transe;
begin
  if auth.uid() is not null and public.rol_curent() is distinct from 'admin' then
    raise exception 'Doar Adminul încasează.';
  end if;
  perform set_config('finante.functie', '1', true);

  select * into r from public.transe where id = t for update;
  if not found then
    raise exception 'Tranșa nu mai există.';
  end if;
  if r.incasata_la is not null then
    raise exception 'Tranșa e deja încasată.';
  end if;
  if suma is null or suma <= 0 or suma > 10000000 then
    raise exception 'Scrie suma încasată, în lei.';
  end if;
  if zi is null or zi > public.azi_ro() then
    raise exception 'Data încasării nu poate fi în viitor.';
  end if;
  if suma > r.suma_lei and not coalesce(peste, false) then
    raise exception 'Suma e mai mare decât tranșa. Confirmă.';
  end if;

  if suma < r.suma_lei then
    insert into public.transe (proiect_id, tip, eticheta, suma_lei, scadenta, abonament_id, alerta_trimisa_la)
      values (r.proiect_id, r.tip,
              case when r.eticheta like '% · rest' then r.eticheta else left(r.eticheta, 53) || ' · rest' end,
              r.suma_lei - suma, r.scadenta, r.abonament_id, r.alerta_trimisa_la);
    update public.transe set suma_lei = suma where id = t;
  end if;
  update public.transe set incasata_la = zi, incasat_lei = suma where id = t;

  insert into public.comisioane (tip, transa_id, proiect_id, om_id, procent, baza_lei, suma_lei)
  select 'comision', t, r.proiect_id, x.om_id, x.procent, suma,
         case when x.procent is null then null else round(suma * x.procent / 100)::int end
    from (select o.om_id, o.procent from public.proiect_oameni o where r.abonament_id is null and o.proiect_id = r.proiect_id
          union all
          select v.om_id, v.procent from public.proiect_vanzari v where r.abonament_id is null and v.proiect_id = r.proiect_id
          union all
          select ao.om_id, ao.procent from public.abonament_oameni ao where ao.abonament_id = r.abonament_id) x
    join public.profiluri p on p.id = x.om_id and p.rol <> 'admin'
   where x.procent is distinct from 0;

  perform set_config('finante.functie', '', true);
  return t;
end $$;

-- „Mută tot la…” (ca în 20261111000002): omul nou intră pe proiecte cu procentul de bază al constructorului.
create or replace function public.muta_taskuri(de uuid, la uuid) returns int
language plpgsql security definer set search_path = ''
as $$
declare
  rol_la public.rol;
  activ_la boolean;
  n int;
begin
  if public.rol_curent() is distinct from 'admin' then
    raise exception 'Doar Adminul mută task-urile.';
  end if;
  if de = la then
    raise exception 'Alege alt om.';
  end if;
  select rol, activ into rol_la, activ_la from public.profiluri where id = la;
  if rol_la is null or not activ_la or rol_la not in ('admin', 'constructor') then
    raise exception 'Task-urile trec doar la un constructor cu contul pornit sau la Admin.';
  end if;

  if rol_la = 'constructor' then
    insert into public.proiect_oameni (proiect_id, om_id, procent)
    select distinct t.proiect_id, la, b.procent
      from public.taskuri t
      join public.proiecte p on p.id = t.proiect_id
      left join public.procente_baza b on b.categorie = p.serviciu::text and b.rol = 'constructor'
     where t.om_id = de and not t.gata
    on conflict do nothing;
  end if;

  update public.taskuri set om_id = la where om_id = de and not gata;
  get diagnostics n = row_count;
  return n;
end $$;

revoke execute on function public.dupa_procent_abonament() from public, anon, authenticated;
revoke execute on function public.genereaza_mentenanta(date), public.porneste_abonament(uuid, int, int, date, uuid),
  public.schimba_abonament(uuid, int, int), public.opreste_abonament(uuid) from public, anon;
grant execute on function public.genereaza_mentenanta(date), public.porneste_abonament(uuid, int, int, date, uuid),
  public.schimba_abonament(uuid, int, int), public.opreste_abonament(uuid) to authenticated, service_role;
