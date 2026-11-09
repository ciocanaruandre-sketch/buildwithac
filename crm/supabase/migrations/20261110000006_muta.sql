-- „Mută tot la…”: când pleacă un om, lead-urile lui deschise (și discuțiile viitoare) trec la altcineva.
-- Doar Adminul. Fiecare mutare de lead intră în Parcurs prin trigger-ul dupa_schimbare_lead.
create function public.muta_lead_uri(de uuid, la uuid) returns jsonb
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

  return jsonb_build_object('lead_uri', n_lead_uri, 'discutii', n_discutii, 'discutii_ramase', n_ramase);
end $$;

revoke execute on function public.muta_lead_uri(uuid, uuid) from public, anon;
grant execute on function public.muta_lead_uri(uuid, uuid) to authenticated;
