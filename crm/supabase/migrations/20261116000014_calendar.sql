-- Bucata 5: discuțiile în Google Calendar-ul closerului.
-- Cheile Google stau criptate într-o tabelă pe care n-o atinge niciun utilizator; doar serverul (service_role).
-- Ce trebuie făcut în Google intră într-o coadă, umplută de trigger-e, ca să nu scape niciun drum
-- (programarea, schimbarea closerului, muta_lead_uri, cascadele, anonimizarea).

-- ───────────── cheile Google ─────────────
create table public.google_conexiuni (
  om_id uuid primary key references public.profiluri (id) on delete cascade,
  email text not null,
  refresh_criptat text not null,
  stare text not null default 'ok' check (stare in ('ok', 'cazut')),
  conectat_la timestamptz not null default now()
);
alter table public.google_conexiuni enable row level security;
revoke all on public.google_conexiuni from public, anon, authenticated;

-- ───────────── discuțiile: unde sunt în Google ─────────────
alter table public.discutii
  add column google_event_id text,
  add column google_om_id uuid, -- în calendarul cui e evenimentul (fără FK: omul poate pleca)
  add column calendar_stare text check (calendar_stare in ('ok', 'eroare', 'neconectat')); -- null = în așteptare

-- ───────────── coada ─────────────
-- „scrie”: discuția trebuie să fie în Google cum e acum în CRM (creare sau schimbare).
-- „sterge”: evenimentul event_id trebuie scos din calendarul lui om_id (discuția poate să nu mai existe).
-- versiune crește când un „scrie” deja luat de un server se schimbă: serverul scoate rândul doar dacă versiunea e tot a lui.
create table public.calendar_coada (
  id bigint generated always as identity primary key,
  actiune text not null check (actiune in ('scrie', 'sterge')),
  discutie_id uuid,
  om_id uuid,
  event_id text,
  versiune int not null default 0,
  incercari int not null default 0,
  ultima_eroare text,
  luat_la timestamptz,
  creat_la timestamptz not null default now(),
  check ((actiune = 'scrie' and discutie_id is not null) or (actiune = 'sterge' and om_id is not null and event_id is not null))
);
create unique index calendar_coada_un_scrie on public.calendar_coada (discutie_id) where actiune = 'scrie';
create index calendar_coada_om on public.calendar_coada (om_id) where om_id is not null;
alter table public.calendar_coada enable row level security;
revoke all on public.calendar_coada from public, anon, authenticated;

-- un singur „scrie” pe discuție; dacă era deja luat de un server, îl pune înapoi, cu versiune nouă
create function public.calendar_pune_scrie(p_discutie uuid) returns void
language sql security definer set search_path = ''
as $$
  insert into public.calendar_coada (actiune, discutie_id) values ('scrie', p_discutie)
  on conflict (discutie_id) where actiune = 'scrie'
  do update set versiune = public.calendar_coada.versiune + 1, luat_la = null;
$$;
revoke execute on function public.calendar_pune_scrie(uuid) from public, anon, authenticated;

-- ───────────── trigger-ele pe discuții ─────────────
-- înainte de schimbare: discuția mutată la alt closer pleacă din calendarul celui vechi
create function public.calendar_discutii_inainte() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.closer_id is distinct from old.closer_id then
    if old.google_event_id is not null then
      insert into public.calendar_coada (actiune, om_id, event_id)
        values ('sterge', coalesce(old.google_om_id, old.closer_id), old.google_event_id);
    end if;
    new.google_event_id := null;
    new.google_om_id := null;
    new.calendar_stare := null;
  elsif new.incepe_la is distinct from old.incepe_la or new.sfarseste_la is distinct from old.sfarseste_la then
    new.calendar_stare := null;
  end if;
  return new;
end $$;
create trigger calendar_discutii_inainte before update of closer_id, incepe_la, sfarseste_la on public.discutii
  for each row execute function public.calendar_discutii_inainte();
revoke execute on function public.calendar_discutii_inainte() from public, anon, authenticated;

create function public.calendar_discutii_dupa() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform public.calendar_pune_scrie(new.id);
  elsif tg_op = 'UPDATE' then
    if new.closer_id is distinct from old.closer_id
       or new.incepe_la is distinct from old.incepe_la
       or new.sfarseste_la is distinct from old.sfarseste_la then
      perform public.calendar_pune_scrie(new.id);
    end if;
  else -- DELETE, inclusiv prin cascadă
    delete from public.calendar_coada where actiune = 'scrie' and discutie_id = old.id;
    if old.google_event_id is not null then
      insert into public.calendar_coada (actiune, om_id, event_id)
        values ('sterge', coalesce(old.google_om_id, old.closer_id), old.google_event_id);
    end if;
  end if;
  return null;
end $$;
create trigger calendar_discutii_dupa after insert or update or delete on public.discutii
  for each row execute function public.calendar_discutii_dupa();
revoke execute on function public.calendar_discutii_dupa() from public, anon, authenticated;

-- ───────────── trigger-ul pe lead-uri ─────────────
-- Numele „lead_calendar” vine după „discutii_dupa_lead” în ordinea alfabetică: rulează după el.
create function public.calendar_dupa_lead() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if old.anonimizat_la is null and new.anonimizat_la is not null then
    -- după un an, fără nume: și din Google, și evenimentele trecute
    delete from public.calendar_coada c
     using public.discutii d
     where d.lead_id = new.id and c.actiune = 'scrie' and c.discutie_id = d.id;
    insert into public.calendar_coada (actiune, om_id, event_id)
      select 'sterge', coalesce(d.google_om_id, d.closer_id), d.google_event_id
        from public.discutii d
       where d.lead_id = new.id and d.google_event_id is not null;
    update public.discutii
       set google_event_id = null, google_om_id = null, calendar_stare = null
     where lead_id = new.id and (google_event_id is not null or calendar_stare is not null);
  elsif new.anonimizat_la is null
    and (new.nume is distinct from old.nume or new.telefon is distinct from old.telefon
         or new.serviciu is distinct from old.serviciu) then
    perform public.calendar_pune_scrie(d.id)
       from public.discutii d
      where d.lead_id = new.id and d.incepe_la > now();
  end if;
  return null;
end $$;
create trigger lead_calendar after update of anonimizat_la, nume, telefon, serviciu on public.lead_uri
  for each row execute function public.calendar_dupa_lead();
revoke execute on function public.calendar_dupa_lead() from public, anon, authenticated;

-- ───────────── pentru server ─────────────
-- Ia rânduri din coadă: libere sau luate de peste 2 minute (serverul care le luase a căzut).
-- p_om: rândurile „sterge” ale omului + „scrie”-urile discuțiilor lui.
create function public.calendar_ia_din_coada(limita int, p_discutie uuid default null, p_om uuid default null)
returns setof public.calendar_coada
language sql security definer set search_path = ''
as $$
  with alese as (
    select c.id
      from public.calendar_coada c
     where (c.luat_la is null or c.luat_la < now() - interval '2 minutes')
       and (p_discutie is null or c.discutie_id = p_discutie)
       and (p_om is null or c.om_id = p_om
            or exists (select 1 from public.discutii d where d.id = c.discutie_id and d.closer_id = p_om))
     order by c.id
     limit limita
       for update of c skip locked
  )
  update public.calendar_coada q
     set luat_la = now()
    from alese
   where q.id = alese.id
  returning q.*;
$$;
revoke execute on function public.calendar_ia_din_coada(int, uuid, uuid) from public, anon, authenticated;
grant execute on function public.calendar_ia_din_coada(int, uuid, uuid) to service_role;

-- După conectare: toate discuțiile viitoare ale omului care nu sunt deja în Google intră în coadă.
create function public.calendar_pune_viitoare(p_om uuid) returns int
language plpgsql security definer set search_path = ''
as $$
declare
  n int := 0;
  d record;
begin
  for d in select id from public.discutii
            where closer_id = p_om and incepe_la > now() and calendar_stare is distinct from 'ok' loop
    perform public.calendar_pune_scrie(d.id);
    n := n + 1;
  end loop;
  return n;
end $$;
revoke execute on function public.calendar_pune_viitoare(uuid) from public, anon, authenticated;
grant execute on function public.calendar_pune_viitoare(uuid) to service_role;

-- Starea conexiunii pentru closeri și Admini activi. Adresa Gmail o vede doar omul însuși și Adminul.
create function public.calendar_stari()
returns table (om_id uuid, conectat boolean, stare text, email text)
language plpgsql stable security definer set search_path = ''
as $$
declare
  r public.rol := public.rol_curent();
  eu uuid := auth.uid();
begin
  if r is null or r = 'constructor' then
    return;
  end if;
  return query
    select p.id, g.om_id is not null, g.stare,
           case when p.id = eu or r = 'admin' then g.email end
      from public.profiluri p
      left join public.google_conexiuni g on g.om_id = p.id
     where p.activ and p.rol in ('closer', 'admin');
end $$;
revoke execute on function public.calendar_stari() from public, anon;
grant execute on function public.calendar_stari() to authenticated;
