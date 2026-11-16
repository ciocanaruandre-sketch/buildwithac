-- Un „scrie” pus din nou (closer schimbat, nume schimbat) își mută creat_la în prezent:
-- fișa arată „N-a ajuns în calendar” abia dacă a trecut de 2 minute de la ultima punere în coadă.
create or replace function public.calendar_pune_scrie(p_discutie uuid) returns void
language sql security definer set search_path = ''
as $$
  insert into public.calendar_coada (actiune, discutie_id) values ('scrie', p_discutie)
  on conflict (discutie_id) where actiune = 'scrie'
  do update set versiune = public.calendar_coada.versiune + 1, luat_la = null, creat_la = now();
$$;
revoke execute on function public.calendar_pune_scrie(uuid) from public, anon, authenticated;
