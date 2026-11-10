-- „Mută tot la…” pentru un constructor care pleacă: task-urile lui neterminate trec la altcineva.
-- Doar Adminul. Omul nou e pus pe proiectele respective (fără procent: îl scrie Adminul din fișă).
create function public.muta_taskuri(de uuid, la uuid) returns int
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
    insert into public.proiect_oameni (proiect_id, om_id)
    select distinct t.proiect_id, la from public.taskuri t where t.om_id = de and not t.gata
    on conflict do nothing;
  end if;

  update public.taskuri set om_id = la where om_id = de and not gata;
  get diagnostics n = row_count;
  return n;
end $$;

revoke execute on function public.muta_taskuri(uuid, uuid) from public, anon;
grant execute on function public.muta_taskuri(uuid, uuid) to authenticated;
