-- Regulile pe care RLS nu le poate spune singur (ce coloană, în ce valoare) și Parcursul scris automat.

create function public.inainte_de_schimbare_lead() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  eu uuid := auth.uid();
  r public.rol := public.rol_curent();
begin
  -- cheia de serviciu (fără utilizator) și Adminul trec
  if eu is null or r = 'admin' then
    return new;
  end if;
  if old.stare = 'client' then
    raise exception 'Lead-ul e deja client: doar Adminul îl mai schimbă.' using errcode = '42501';
  end if;
  if new.caller_id is distinct from old.caller_id and not (old.caller_id is null and new.caller_id = eu) then
    raise exception 'Nu poți muta lead-ul la alt om.' using errcode = '42501';
  end if;
  if new.closer_id is distinct from old.closer_id and new.stare <> 'programat' then
    raise exception 'Closerul se alege doar la programarea discuției.' using errcode = '42501';
  end if;
  if new.stare is distinct from old.stare and new.stare in ('client', 'pierdut') and r <> 'closer' then
    raise exception 'Doar closerul marchează Client sau Pierdut.' using errcode = '42501';
  end if;
  if new.nume is distinct from old.nume or new.serviciu is distinct from old.serviciu
     or new.sursa is distinct from old.sursa or new.intrat_la is distinct from old.intrat_la
     or new.creat_de is distinct from old.creat_de then
    raise exception 'Câmpurile astea le schimbă doar Adminul.' using errcode = '42501';
  end if;
  return new;
end $$;

create trigger inainte_de_schimbare_lead before update on public.lead_uri
  for each row execute function public.inainte_de_schimbare_lead();

create function public.dupa_schimbare_lead() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  eu uuid := auth.uid();
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
      on conflict (lead_id) do nothing;
  end if;
  return null;
end $$;

create trigger dupa_schimbare_lead after insert or update on public.lead_uri
  for each row execute function public.dupa_schimbare_lead();

revoke execute on function public.inainte_de_schimbare_lead() from public, anon, authenticated;
revoke execute on function public.dupa_schimbare_lead() from public, anon, authenticated;
