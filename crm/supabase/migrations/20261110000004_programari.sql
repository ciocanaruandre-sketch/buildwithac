-- Programul săptămânal al closerilor și discuțiile programate (etapa 1: fără Google Calendar / Calendly).
create extension if not exists btree_gist with schema extensions;

-- o fereastră pe zi; orele sunt ale României
create table public.program_closer (
  id uuid primary key default gen_random_uuid(),
  closer_id uuid not null references public.profiluri (id) on delete cascade,
  zi smallint not null check (zi between 1 and 7), -- 1 = luni
  de_la time not null,
  pana_la time not null,
  check (de_la < pana_la),
  unique (closer_id, zi)
);

create table public.discutii (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.lead_uri (id) on delete cascade,
  closer_id uuid not null references public.profiluri (id) on delete cascade,
  incepe_la timestamptz not null,
  sfarseste_la timestamptz not null,
  creat_de uuid default auth.uid() references public.profiluri (id) on delete set null,
  creat_la timestamptz not null default now(),
  check (incepe_la < sfarseste_la),
  -- același closer nu poate avea două discuții care se suprapun
  constraint discutii_fara_suprapunere exclude using gist (closer_id with =, tstzrange(incepe_la, sfarseste_la) with &&)
);
create index discutii_lead on public.discutii (lead_id);
create index discutii_creat_de on public.discutii (creat_de);

alter table public.program_closer enable row level security;
alter table public.discutii enable row level security;
revoke all on public.program_closer, public.discutii from anon;
grant select on public.program_closer, public.discutii to authenticated;

create policy program_citire on public.program_closer for select to authenticated
  using ((select public.rol_curent()) is not null);
create policy discutii_citire on public.discutii for select to authenticated
  using ((select public.rol_curent()) in ('admin', 'caller', 'closer'));

-- Programarea: șterge discuțiile viitoare ale lead-ului, pune una nouă, mută lead-ul în „programat”.
-- Rulează cu drepturile omului (RLS + trigger-ul de pe lead_uri se aplică), totul într-o singură tranzacție.
create function public.programeaza_discutie(p_lead uuid, p_closer uuid, p_incepe timestamptz)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  eu uuid := auth.uid();
  r public.rol := public.rol_curent();
  l record;
  durata int;
begin
  select caller_id, closer_id, stare into l from public.lead_uri where id = p_lead;
  if not found then
    raise exception 'Lead-ul nu există.' using errcode = 'P0002';
  end if;
  if r is null or r = 'constructor'
     or (r <> 'admin' and l.caller_id is distinct from eu and l.closer_id is distinct from eu) then
    raise exception 'Nu poți programa pe lead-ul ăsta.' using errcode = '42501';
  end if;
  if r <> 'admin' and l.stare not in ('a_raspuns', 'callback', 'programat') then
    raise exception 'Programarea vine după ce omul a răspuns.' using errcode = '42501';
  end if;
  select p.durata_discutie_min into durata from public.profiluri p
    where p.id = p_closer and p.activ and p.rol in ('closer', 'admin');
  if durata is null then
    raise exception 'Omul ales nu e closer activ.' using errcode = '22023';
  end if;
  if p_incepe < now() then
    raise exception 'Ora a trecut deja.' using errcode = '22023';
  end if;

  delete from public.discutii where lead_id = p_lead and incepe_la > now();
  insert into public.discutii (lead_id, closer_id, incepe_la, sfarseste_la, creat_de)
    values (p_lead, p_closer, p_incepe, p_incepe + make_interval(mins => durata), eu);
  insert into public.evenimente (lead_id, autor_id, tip, detalii)
    values (p_lead, eu, 'programat', jsonb_build_object('closer', p_closer, 'la', p_incepe));
  -- auth.uid() rămâne al omului: trigger-ul de pe lead_uri verifică din nou (closer_id doar cu stare = programat)
  update public.lead_uri set closer_id = p_closer, stare = 'programat', callback_la = null where id = p_lead;
end $$;
revoke execute on function public.programeaza_discutie(uuid, uuid, timestamptz) from public, anon;
grant execute on function public.programeaza_discutie(uuid, uuid, timestamptz) to authenticated;

-- Programul săptămânal al unui closer: îl scrie closerul pentru el, sau Adminul pentru oricine.
create function public.salveaza_program(p_closer uuid, p_zile jsonb, p_durata int)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  r public.rol := public.rol_curent();
begin
  if not (r = 'admin' or (r = 'closer' and p_closer = auth.uid())) then
    raise exception 'Nu poți schimba programul altcuiva.' using errcode = '42501';
  end if;
  if p_durata not in (15, 30, 45, 60) then
    raise exception 'Durata se alege din 15, 30, 45 sau 60 de minute.' using errcode = '22023';
  end if;
  delete from public.program_closer where closer_id = p_closer;
  insert into public.program_closer (closer_id, zi, de_la, pana_la)
    select p_closer, (z ->> 'zi')::smallint, (z ->> 'de_la')::time, (z ->> 'pana_la')::time
    from jsonb_array_elements(p_zile) z;
  update public.profiluri set durata_discutie_min = p_durata where id = p_closer;
end $$;
revoke execute on function public.salveaza_program(uuid, jsonb, int) from public, anon;
grant execute on function public.salveaza_program(uuid, jsonb, int) to authenticated;
