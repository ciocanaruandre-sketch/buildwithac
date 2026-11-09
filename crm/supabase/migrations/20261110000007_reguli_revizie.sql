-- Reparațiile de la verificarea finală a etapei 1.

-- 1. Lead adăugat de un om din echipă: doar pe el, în „nou”, cu data de acum.
--    (Pagina pune deja valorile astea; regula ține și când cineva scrie direct în API.)
create function public.inainte_de_adaugare_lead() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  eu uuid := auth.uid();
begin
  -- cheia de serviciu (formularul site-ului) și Adminul trec
  if eu is null or public.rol_curent() = 'admin' then
    return new;
  end if;
  if new.caller_id is distinct from eu then
    raise exception 'Lead-ul adăugat de tine e al tău.' using errcode = '42501';
  end if;
  new.stare := 'nou';
  new.closer_id := null;
  new.callback_la := null;
  new.incercari := 0;
  new.motiv := null;
  new.intrat_la := now();
  new.creat_la := now();
  return new;
end $$;

create trigger inainte_de_adaugare_lead before insert on public.lead_uri
  for each row execute function public.inainte_de_adaugare_lead();
revoke execute on function public.inainte_de_adaugare_lead() from public, anon, authenticated;

-- 2. Discuția viitoare urmează lead-ul: iese din „programat” → se anulează; Adminul schimbă closerul → trece la cel nou
--    (dacă cel nou e ocupat la ora aceea, constrângerea de excludere refuză schimbarea, cod 23P01).
--    muta_lead_uri își mută singur discuțiile și le lasă pe cele care nu încap: aici sare peste (crm.muta = 1).
create function public.discutii_dupa_lead() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if coalesce(current_setting('crm.muta', true), '') = '1' then
    return null;
  end if;
  if old.stare = 'programat' and new.stare is distinct from 'programat' then
    delete from public.discutii where lead_id = new.id and incepe_la > now();
  elsif new.stare = 'programat' and new.closer_id is distinct from old.closer_id then
    if new.closer_id is null then
      delete from public.discutii where lead_id = new.id and incepe_la > now();
    else
      update public.discutii set closer_id = new.closer_id
       where lead_id = new.id and incepe_la > now() and closer_id is distinct from new.closer_id;
    end if;
  end if;
  return null;
end $$;

create trigger discutii_dupa_lead after update of stare, closer_id on public.lead_uri
  for each row execute function public.discutii_dupa_lead();
revoke execute on function public.discutii_dupa_lead() from public, anon, authenticated;

-- muta_lead_uri: aceeași funcție, cu semnul pentru trigger-ul de mai sus
create or replace function public.muta_lead_uri(de uuid, la uuid) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  rol_de public.rol;
  rol_la public.rol;
  activ_la boolean;
  n_lead_uri int;
  n_discutii int;
  n_ramase int;
begin
  if public.rol_curent() is distinct from 'admin' then
    raise exception 'Doar Adminul mută lead-urile.' using errcode = '42501';
  end if;
  if de = la then
    raise exception 'Alege alt om.' using errcode = '22023';
  end if;
  select rol into rol_de from public.profiluri where id = de;
  select rol, activ into rol_la, activ_la from public.profiluri where id = la;
  if rol_de is null or rol_la is null then
    raise exception 'Omul nu există.' using errcode = '22023';
  end if;
  if not activ_la then
    raise exception 'Omul ales are contul oprit.' using errcode = '22023';
  end if;
  if rol_la <> rol_de and rol_la <> 'admin' then
    raise exception 'Lead-urile trec doar la cineva cu același rol (sau la Admin).' using errcode = '22023';
  end if;

  perform set_config('crm.muta', '1', true);

  update public.lead_uri
     set caller_id = case when caller_id = de then la else caller_id end,
         closer_id = case when closer_id = de then la else closer_id end
   where (caller_id = de or closer_id = de)
     and stare not in ('client', 'pierdut', 'descalificat');
  get diagnostics n_lead_uri = row_count;

  -- discuțiile viitoare trec și ele, dacă cel nou e liber la ora aceea
  update public.discutii d
     set closer_id = la
   where d.closer_id = de
     and d.incepe_la > now()
     and not exists (
       select 1 from public.discutii x
        where x.closer_id = la
          and tstzrange(x.incepe_la, x.sfarseste_la) && tstzrange(d.incepe_la, d.sfarseste_la)
     );
  get diagnostics n_discutii = row_count;
  select count(*) into n_ramase from public.discutii where closer_id = de and incepe_la > now();

  perform set_config('crm.muta', '', true);
  return jsonb_build_object('lead_uri', n_lead_uri, 'discutii', n_discutii, 'discutii_ramase', n_ramase);
end $$;
