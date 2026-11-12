-- Finanțe: încasarea unei tranșe (cu comisioanele ei), anularea ei și completarea procentelor nestabilite.
-- Funcțiile refuză orice om conectat care nu e Admin; cheia de serviciu (npm run demo, teste) trece.

create function public.incaseaza(t uuid, suma int, zi date, peste boolean default false) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  r public.transe;
begin
  if auth.uid() is not null and public.rol_curent() is distinct from 'admin' then
    raise exception 'Doar Adminul încasează.';
  end if;
  perform set_config('finante.functie', '1', true);

  select * into r from public.transe where id = t for update;
  if not found then
    raise exception 'Tranșa nu mai există.';
  end if;
  if r.incasata_la is not null then
    raise exception 'Tranșa e deja încasată.';
  end if;
  if suma is null or suma <= 0 or suma > 10000000 then
    raise exception 'Scrie suma încasată, în lei.';
  end if;
  if zi is null or zi > (now() at time zone 'Europe/Bucharest')::date then
    raise exception 'Data încasării nu poate fi în viitor.';
  end if;
  if suma > r.suma_lei and not coalesce(peste, false) then
    raise exception 'Suma e mai mare decât tranșa. Confirmă.';
  end if;

  -- plată parțială: restul rămâne o tranșă neîncasată, cu aceeași scadență (și fără un al doilea e-mail de întârziere)
  if suma < r.suma_lei then
    insert into public.transe (proiect_id, tip, eticheta, suma_lei, scadenta, abonament_id, alerta_trimisa_la)
      values (r.proiect_id, r.tip,
              case when r.eticheta like '% · rest' then r.eticheta else left(r.eticheta, 53) || ' · rest' end,
              r.suma_lei - suma, r.scadenta, r.abonament_id, r.alerta_trimisa_la);
    update public.transe set suma_lei = suma where id = t;
  end if;
  update public.transe set incasata_la = zi, incasat_lei = suma where id = t;

  -- câte un comision pe om, cu procentul de acum (înghețat); fără Admin, fără procentul 0; gol = nestabilit
  insert into public.comisioane (tip, transa_id, proiect_id, om_id, procent, baza_lei, suma_lei)
  select 'comision', t, r.proiect_id, x.om_id, x.procent, suma,
         case when x.procent is null then null else round(suma * x.procent / 100)::int end
    from (select o.om_id, o.procent from public.proiect_oameni o where o.proiect_id = r.proiect_id
          union all
          select v.om_id, v.procent from public.proiect_vanzari v where v.proiect_id = r.proiect_id) x
    join public.profiluri p on p.id = x.om_id and p.rol <> 'admin'
   where x.procent is distinct from 0;

  perform set_config('finante.functie', '', true);
  return t;
end $$;

-- O încasare bifată greșit se anulează doar cât niciun comision din ea nu e plătit.
create function public.anuleaza_incasare(t uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  r public.transe;
begin
  if auth.uid() is not null and public.rol_curent() is distinct from 'admin' then
    raise exception 'Doar Adminul anulează încasările.';
  end if;
  perform set_config('finante.functie', '1', true);

  select * into r from public.transe where id = t for update;
  if not found then
    raise exception 'Tranșa nu mai există.';
  end if;
  if r.incasata_la is null then
    raise exception 'Tranșa nu e încasată.';
  end if;
  if r.returnat_lei > 0 then
    raise exception 'Tranșa are o returnare. Încasarea nu se mai poate anula.';
  end if;
  if exists (select 1 from public.comisioane k where k.transa_id = t and k.platit_la is not null) then
    raise exception 'Ai plătit deja un comision din ea. Folosește returnarea.';
  end if;

  delete from public.comisioane where transa_id = t;
  update public.transe set incasata_la = null, incasat_lei = null where id = t;
  perform set_config('finante.functie', '', true);
end $$;

-- Procentul pus sau schimbat pe proiect completează doar comisioanele cu procent nestabilit (neplătite).
-- Comisioanele deja calculate rămân cum erau. La procentul 0, cele nestabilite dispar.
create function public.dupa_procent_proiect() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  vechi text := coalesce(current_setting('finante.functie', true), '');
begin
  if new.procent is not distinct from old.procent or new.procent is null then
    return null;
  end if;
  perform set_config('finante.functie', '1', true);
  if new.procent = 0 then
    delete from public.comisioane k
     using public.transe tr
     where tr.id = k.transa_id and tr.abonament_id is null
       and k.proiect_id = new.proiect_id and k.om_id = new.om_id
       and k.tip = 'comision' and k.suma_lei is null and k.platit_la is null;
  else
    update public.comisioane k
       set procent = new.procent, suma_lei = round(k.baza_lei * new.procent / 100)::int
      from public.transe tr
     where tr.id = k.transa_id and tr.abonament_id is null
       and k.proiect_id = new.proiect_id and k.om_id = new.om_id
       and k.tip = 'comision' and k.suma_lei is null and k.platit_la is null;
  end if;
  perform set_config('finante.functie', vechi, true);
  return null;
end $$;

create trigger dupa_procent_proiect after update of procent on public.proiect_oameni
  for each row execute function public.dupa_procent_proiect();
create trigger dupa_procent_vanzari after update of procent on public.proiect_vanzari
  for each row execute function public.dupa_procent_proiect();

revoke execute on function public.dupa_procent_proiect() from public, anon, authenticated;
revoke execute on function public.incaseaza(uuid, int, date, boolean), public.anuleaza_incasare(uuid) from public, anon;
grant execute on function public.incaseaza(uuid, int, date, boolean), public.anuleaza_incasare(uuid) to authenticated, service_role;
