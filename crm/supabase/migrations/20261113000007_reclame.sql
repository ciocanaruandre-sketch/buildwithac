-- CRM buildwithac, etapa 3, bucata 3: lead-urile din reclame.
-- O reclamă = platformă + campanie + nume (din UTM-urile linkului). Legătura lead → reclamă ține contoarele
-- (discuție, client, banii clienților șterși), puse de trigger-e în clipa întâmplării. Când lead-ul sau clientul
-- dispare, rândul rămâne anonim (fără nume, telefon, text), ca cifrele reclamei să nu scadă.

create table public.reclame (
  id uuid primary key default gen_random_uuid(),
  platforma text not null check (platforma in ('meta', 'tiktok')),
  campanie text not null default '' check (length(campanie) <= 120),
  nume text not null check (length(nume) between 1 and 120),
  -- totalul scris de Admin din Ads Manager; gol = încă nescris
  cheltuit_lei int check (cheltuit_lei between 0 and 10000000),
  -- reclama a fost unită cu alta (redenumită în Meta): lead-urile noi cu numele ăsta merg la aceea
  unita_in uuid references public.reclame (id) on delete cascade,
  creat_la timestamptz not null default now(),
  unique (platforma, campanie, nume),
  check (unita_in is distinct from id)
);
create index reclame_unita_in on public.reclame (unita_in) where unita_in is not null;

create table public.reclame_lead_uri (
  id uuid primary key default gen_random_uuid(),
  reclama_id uuid not null references public.reclame (id) on delete cascade,
  lead_id uuid unique references public.lead_uri (id) on delete set null,
  -- fără cheie străină: sterge_client îl golește după ce mută banii clientului în incasat_sters_lei
  client_id uuid,
  a_avut_discutie boolean not null default false,
  client boolean not null default false,
  incasat_sters_lei int not null default 0 check (incasat_sters_lei >= 0),
  creat_la timestamptz not null default now()
);
create index reclame_lead_uri_reclama on public.reclame_lead_uri (reclama_id);
create index reclame_lead_uri_client on public.reclame_lead_uri (client_id) where client_id is not null;

-- ───────────── cine are voie ─────────────
alter table public.reclame enable row level security;
alter table public.reclame_lead_uri enable row level security;

create policy reclame_citire on public.reclame for select to authenticated
  using ((select public.rol_curent()) = 'admin');
create policy reclame_adaugare on public.reclame for insert to authenticated
  with check ((select public.rol_curent()) = 'admin');
create policy reclame_schimbare on public.reclame for update to authenticated
  using ((select public.rol_curent()) = 'admin') with check ((select public.rol_curent()) = 'admin');
create policy reclame_stergere on public.reclame for delete to authenticated
  using ((select public.rol_curent()) = 'admin');
-- legăturile le scriu doar funcțiile și trigger-ele
create policy reclame_lead_uri_citire on public.reclame_lead_uri for select to authenticated
  using ((select public.rol_curent()) = 'admin');

-- ───────────── legarea unui lead nou de reclama lui ─────────────
create function public.atribuie_reclama(p_lead uuid, p_platforma text, p_campanie text, p_nume text) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  r uuid;
  u uuid;
begin
  if auth.uid() is not null and (select public.rol_curent()) is distinct from 'admin' then
    raise exception 'Doar Adminul leagă reclamele.';
  end if;
  insert into public.reclame (platforma, campanie, nume) values (p_platforma, p_campanie, p_nume)
    on conflict (platforma, campanie, nume) do nothing;
  select id, unita_in into r, u from public.reclame
   where platforma = p_platforma and campanie = p_campanie and nume = p_nume;
  r := coalesce(u, r);
  insert into public.reclame_lead_uri (reclama_id, lead_id) values (r, p_lead)
    on conflict (lead_id) do nothing;
  return r;
end $$;

revoke execute on function public.atribuie_reclama(uuid, text, text, text) from public, anon;
grant execute on function public.atribuie_reclama(uuid, text, text, text) to authenticated, service_role;

-- ───────────── contoarele ─────────────
-- O discuție se numără la programare și nu mai scade: reprogramarea șterge rândul vechi din discutii.
create function public.reclame_dupa_discutie() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  update public.reclame_lead_uri set a_avut_discutie = true where lead_id = new.lead_id and not a_avut_discutie;
  return null;
end $$;
create trigger reclame_dupa_discutie after insert on public.discutii
  for each row execute function public.reclame_dupa_discutie();

create function public.reclame_dupa_client() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.lead_id is not null then
    update public.reclame_lead_uri set client = true, client_id = new.id where lead_id = new.lead_id;
  end if;
  return null;
end $$;
create trigger reclame_dupa_client after insert on public.clienti
  for each row execute function public.reclame_dupa_client();

-- Ștergerea de mână (Adminul: lead de probă sau greșit) scoate lead-ul din cifre.
-- Cea automată (cron-ul de 90 de zile, cu cheia de serviciu) îl lasă anonim: lead_id devine null.
-- Un lead devenit client rămâne (sterge_client îl anonimizează întâi).
create function public.reclame_inainte_de_stergere_lead() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is not null then
    delete from public.reclame_lead_uri where lead_id = old.id and not client;
  end if;
  return old;
end $$;
create trigger reclame_inainte_de_stergere_lead before delete on public.lead_uri
  for each row execute function public.reclame_inainte_de_stergere_lead();

revoke execute on function public.reclame_dupa_discutie(), public.reclame_dupa_client(), public.reclame_inainte_de_stergere_lead()
  from public, anon, authenticated;

-- Banii unui client șters rămân la reclama lui, ca sumă anonimă. Chemată din sterge_client (security invoker).
create function public.reclame_pastreaza_banii(c uuid) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is not null and (select public.rol_curent()) is distinct from 'admin' then
    raise exception 'Doar Adminul șterge clienți.';
  end if;
  update public.reclame_lead_uri
     set incasat_sters_lei = incasat_sters_lei + coalesce((
           select sum(t.incasat_lei - t.returnat_lei)
             from public.transe t
             join public.proiecte p on p.id = t.proiect_id
            where p.client_id = c and t.incasata_la is not null and t.tip <> 'inainte'), 0),
         client_id = null
   where client_id = c;
end $$;

revoke execute on function public.reclame_pastreaza_banii(uuid) from public, anon;
grant execute on function public.reclame_pastreaza_banii(uuid) to authenticated, service_role;

-- sterge_client: ca în 20261113000003, plus banii păstrați la reclamă înainte de ștergere.
create or replace function public.sterge_client(c uuid) returns boolean
language plpgsql security invoker set search_path = ''
as $$
declare
  l uuid;
  n int;
begin
  select lead_id into l from public.clienti where id = c;
  if not found then
    return false;
  end if;
  if exists (
    select 1 from public.comisioane k
      join public.proiecte p on p.id = k.proiect_id
     where p.client_id = c and k.platit_la is null
  ) then
    raise exception 'Mai ai de plătit comisioane din proiectele lui. Plătește-le întâi.';
  end if;
  perform public.reclame_pastreaza_banii(c);
  if l is not null then
    delete from public.lead_uri where id = l;
    get diagnostics n = row_count;
    if n = 0 then
      raise exception 'lead_nesters';
    end if;
  end if;
  delete from public.clienti where id = c;
  get diagnostics n = row_count;
  if n = 0 then
    raise exception 'client_nesters';
  end if;
  return true;
end
$$;

-- ───────────── curățenie: încasatul vechi al proiectului (înlocuit de tranșe, în Finanțe) ─────────────
alter table public.proiecte drop column incasat_lei;
