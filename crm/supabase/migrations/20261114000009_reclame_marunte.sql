-- CRM buildwithac, etapa 3, bucata 3: măruntele din verificarea Reclamelor.

-- ───────────── 1. o reclamă cu lead-uri nu se șterge de mână ─────────────
-- Până acum oprea doar acțiunea din aplicație; cheia străină (on delete cascade) lua cu ea și cifrele.
-- Cu cheia de serviciu (scripturile de test și demo) ștergerea merge mai departe, cu legături cu tot.
create function public.reclame_inainte_de_stergere() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is not null and exists (select 1 from public.reclame_lead_uri where reclama_id = old.id) then
    raise exception 'Reclama are lead-uri. Unește-o cu alta în loc s-o ștergi.';
  end if;
  return old;
end $$;
create trigger reclame_inainte_de_stergere before delete on public.reclame
  for each row execute function public.reclame_inainte_de_stergere();

-- ───────────── 2 și 3. banii clientului șters rămân la reclamă, oricum ar fi șters ─────────────
-- Până acum îi muta doar sterge_client, printr-o funcție pe care Adminul o putea chema și singur.
-- Acum îi mută un trigger, înainte ca ștergerea clientului să ia cu ea proiectele și tranșele.
create function public.reclame_inainte_de_stergere_client() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  update public.reclame_lead_uri
     set incasat_sters_lei = incasat_sters_lei + coalesce((
           select sum(t.incasat_lei - t.returnat_lei)
             from public.transe t
             join public.proiecte p on p.id = t.proiect_id
            where p.client_id = old.id and t.incasata_la is not null and t.tip <> 'inainte'), 0),
         client_id = null
   where client_id = old.id;
  return old;
end $$;
create trigger reclame_inainte_de_stergere_client before delete on public.clienti
  for each row execute function public.reclame_inainte_de_stergere_client();

revoke execute on function public.reclame_inainte_de_stergere(), public.reclame_inainte_de_stergere_client()
  from public, anon, authenticated;

-- sterge_client: ca în 20261113000007, fără chemarea directă (o face trigger-ul).
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

drop function public.reclame_pastreaza_banii(uuid);

-- ───────────── 4. atribuirea și unirea în aceeași clipă ─────────────
-- Fără blocare, un lead putea fi legat de reclama tocmai unită în alta și dispărea din cifre.
-- Atribuirea ține un singur rând (reclama cu numele din link) cu `for share`; unirea ține, înainte să mute
-- lead-urile, ambele reclame și pe cele unite deja în cea care dispare, cu `for update`. Așa una o așteaptă
-- pe cealaltă: ori lead-ul e scris înainte și unirea îl mută, ori atribuirea citește unde a ajuns reclama.
create or replace function public.atribuie_reclama(p_lead uuid, p_platforma text, p_campanie text, p_nume text) returns uuid
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
   where platforma = p_platforma and campanie = p_campanie and nume = p_nume
     for share;
  r := coalesce(u, r);
  insert into public.reclame_lead_uri (reclama_id, lead_id) values (r, p_lead)
    on conflict (lead_id) do nothing;
  return r;
end $$;

-- uneste_reclame: ca în 20261113000008 (cheltuielile se adună, alegerea lui Andrei), plus blocarea celor unite deja.
create or replace function public.uneste_reclame(p_pastrata uuid, p_unita uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  a public.reclame;
  b public.reclame;
begin
  if auth.uid() is not null and (select public.rol_curent()) is distinct from 'admin' then
    raise exception 'Doar Adminul unește reclamele.';
  end if;
  if p_pastrata = p_unita then
    raise exception 'Alege o altă reclamă.';
  end if;
  select * into a from public.reclame where id = p_pastrata for update;
  select * into b from public.reclame where id = p_unita for update;
  if a.id is null or b.id is null then
    raise exception 'Reclama nu mai există. Reîncarcă pagina.';
  end if;
  if a.unita_in is not null or b.unita_in is not null then
    raise exception 'Reclama e deja unită cu alta. Reîncarcă pagina.';
  end if;
  if a.platforma <> b.platforma then
    raise exception 'Poți uni doar reclame de pe aceeași platformă.';
  end if;
  perform 1 from public.reclame where unita_in = p_unita for update;
  update public.reclame_lead_uri set reclama_id = p_pastrata where reclama_id = p_unita;
  -- gol + X = X, gol + gol = gol
  update public.reclame
     set cheltuit_lei = case when a.cheltuit_lei is null and b.cheltuit_lei is null then null
                             else coalesce(a.cheltuit_lei, 0) + coalesce(b.cheltuit_lei, 0) end
   where id = p_pastrata;
  update public.reclame set unita_in = p_pastrata where id = p_unita or unita_in = p_unita;
end $$;
