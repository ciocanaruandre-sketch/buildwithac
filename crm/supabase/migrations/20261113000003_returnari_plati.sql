-- Finanțe: returnarea unei încasări, „Am plătit tot” și ștergerea clientului blocată de comisioanele neplătite.

-- „1.500” (separatorul de mii al CRM-ului), pentru mesajele către om
create function public.lei_text(n int) returns text
language sql immutable set search_path = ''
as $$ select replace(to_char(n, 'FM999,999,990'), ',', '.') $$;
revoke execute on function public.lei_text(int) from public, anon;
grant execute on function public.lei_text(int) to authenticated, service_role;

-- Banii returnați clientului. Tranșa rămâne „returnată” (nu redevine de încasat).
-- Comisionul din partea returnată: neplătit → scade (sau dispare); plătit → un minus, scăzut din următoarele comisioane ale omului.
create function public.returneaza(t uuid, suma int, zi date) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  r public.transe;
  k public.comisioane;
  disponibil int;
  parte int;
begin
  if auth.uid() is not null and public.rol_curent() is distinct from 'admin' then
    raise exception 'Doar Adminul marchează returnările.';
  end if;
  perform set_config('finante.functie', '1', true);

  select * into r from public.transe where id = t for update;
  if not found then
    raise exception 'Tranșa nu mai există.';
  end if;
  if r.incasata_la is null then
    raise exception 'Tranșa nu e încasată.';
  end if;
  disponibil := r.incasat_lei - r.returnat_lei;
  if suma is null or suma <= 0 then
    raise exception 'Scrie suma returnată, în lei.';
  end if;
  if suma > disponibil then
    raise exception 'Poți returna cel mult % lei.', public.lei_text(disponibil);
  end if;
  if zi is null or zi > (now() at time zone 'Europe/Bucharest')::date then
    raise exception 'Data returnării nu poate fi în viitor.';
  end if;

  for k in select * from public.comisioane where transa_id = t and tip = 'comision' for update loop
    parte := case when k.procent is null then null else round(suma * k.procent / 100)::int end;
    if k.platit_la is null then
      if (k.suma_lei is null and k.baza_lei - suma <= 0) or (k.suma_lei is not null and k.suma_lei - parte <= 0) then
        delete from public.comisioane where id = k.id;
      else
        update public.comisioane
           set baza_lei = baza_lei - suma, suma_lei = case when suma_lei is null then null else suma_lei - parte end
         where id = k.id;
      end if;
    elsif parte > 0 then
      insert into public.comisioane (tip, transa_id, proiect_id, om_id, procent, baza_lei, suma_lei, nota)
        values ('minus', t, k.proiect_id, k.om_id, k.procent, -suma, -parte, 'returnare');
    end if;
  end loop;

  update public.transe set returnat_lei = returnat_lei + suma, returnata_la = zi where id = t;
  perform set_config('finante.functie', '', true);
end $$;

-- Plătește tot ce i se datorează omului: comisioanele neplătite minus minusurile nestinse. Cele cu procent nestabilit rămân.
create function public.plateste_tot(om uuid, zi date) returns int
language plpgsql security definer set search_path = ''
as $$
declare
  total int;
begin
  if auth.uid() is not null and public.rol_curent() is distinct from 'admin' then
    raise exception 'Doar Adminul bifează plățile.';
  end if;
  if zi is null then
    raise exception 'Alege data plății.';
  end if;
  perform 1 from public.comisioane where om_id = om and platit_la is null for update;
  select coalesce(sum(suma_lei), 0) into total
    from public.comisioane where om_id = om and platit_la is null and suma_lei is not null;
  if total <= 0 then
    raise exception 'Nu e nimic de plătit.';
  end if;
  update public.comisioane set platit_la = zi where om_id = om and platit_la is null and suma_lei is not null;
  return total;
end $$;

revoke execute on function public.returneaza(uuid, int, date), public.plateste_tot(uuid, date) from public, anon;
grant execute on function public.returneaza(uuid, int, date), public.plateste_tot(uuid, date) to authenticated, service_role;

-- Ștergerea clientului (ca în 20261111000006), blocată cât proiectele lui au comisioane de plătit sau minusuri nestinse.
-- Comisioanele plătite rămân în istoricul omului, fără proiect (cascada pune legăturile pe null).
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
