-- Finanțe: reparațiile de după verificarea finală.
-- 1) O lună de mentenanță ștearsă sau mutată nu mai e refăcută: abonamentul ține minte până la ce lună a făcut tranșele.
-- 2) La pornirea mentenanței, „fără om” înseamnă „nimeni” („Doar eu”), nu primul constructor.
-- 3) Un om cu comisioane fără procent nu se scoate de pe proiect; procentul unui om cu contul oprit se poate pune.
-- 4) Echipa își vede comisioanele viitoare fără date și fără „· rest” (nu poate deduce cine întârzie sau plătește parțial).

-- ───────────── 1) mentenanța ─────────────

alter table public.abonamente add column generat_pana date;
-- prima zi a ultimei luni pentru care s-a făcut deja tranșa
update public.abonamente a
   set generat_pana = (select max(date_trunc('month', x.scadenta))::date from public.transe x where x.abonament_id = a.id);

create or replace function public.genereaza_mentenanta(pana date) returns int
language plpgsql security definer set search_path = ''
as $$
declare
  luni text[] := array['ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie', 'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie'];
  a public.abonamente;
  luna date;
  ultima date;
  d date;
  n int := 0;
begin
  if auth.uid() is not null and public.rol_curent() is distinct from 'admin' then
    raise exception 'Doar Adminul face tranșele de mentenanță.';
  end if;
  for a in select * from public.abonamente where oprit_la is null order by id for update loop
    luna := date_trunc('month', a.porneste)::date;
    -- lunile deja făcute nu se refac, chiar dacă tranșa lor a fost ștearsă sau mutată
    if a.generat_pana is not null and a.generat_pana >= luna then
      luna := (a.generat_pana + interval '1 month')::date;
    end if;
    ultima := null;
    while luna <= pana loop
      d := luna + (a.zi - 1);
      exit when d > pana;
      if d >= a.porneste
         and not exists (select 1 from public.transe x where x.abonament_id = a.id and date_trunc('month', x.scadenta) = luna) then
        insert into public.transe (proiect_id, tip, eticheta, suma_lei, scadenta, abonament_id)
          values (a.proiect_id, 'mentenanta', 'Mentenanță ' || luni[extract(month from d)::int], a.suma_lei, d, a.id);
        n := n + 1;
      end if;
      ultima := luna;
      luna := (luna + interval '1 month')::date;
    end loop;
    if ultima is not null then
      update public.abonamente set generat_pana = ultima where id = a.id;
    end if;
  end loop;
  return n;
end $$;

-- Suma nouă contează de la tranșele neîncasate de azi încolo; ziua nouă, din luna următoare (lunile viitoare se refac).
create or replace function public.schimba_abonament(a uuid, suma int, zi int) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  azi date := public.azi_ro();
begin
  if auth.uid() is not null and public.rol_curent() is distinct from 'admin' then
    raise exception 'Doar Adminul schimbă mentenanța.';
  end if;
  if suma is null or suma < 1 or suma > 10000000 then
    raise exception 'Scrie suma lunară, în lei.';
  end if;
  if zi is null or zi < 1 or zi > 28 then
    raise exception 'Ziua din lună e între 1 și 28.';
  end if;
  if not exists (select 1 from public.abonamente where id = a and oprit_la is null) then
    raise exception 'Mentenanța e oprită.';
  end if;
  update public.transe set suma_lei = suma where abonament_id = a and incasata_la is null and scadenta >= azi;
  delete from public.transe
   where abonament_id = a and incasata_la is null and scadenta >= (date_trunc('month', azi) + interval '1 month')::date;
  update public.abonamente
     set suma_lei = suma, zi = schimba_abonament.zi,
         generat_pana = least(generat_pana, date_trunc('month', azi)::date)
   where id = a;
  perform public.genereaza_mentenanta(azi + 35);
end $$;

-- Pornește abonamentul: omul ales (fără om = „Doar eu”, nimeni) cu procentul de bază al mentenanței,
-- plus callerul și closerul proiectului, doar dacă procentul lor de bază la mentenanță e peste 0.
create or replace function public.porneste_abonament(p uuid, suma int, zi int, porneste date, om uuid) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  a uuid;
begin
  if auth.uid() is not null and public.rol_curent() is distinct from 'admin' then
    raise exception 'Doar Adminul pornește mentenanța.';
  end if;
  if suma is null or suma < 1 or suma > 10000000 then
    raise exception 'Scrie suma lunară, în lei.';
  end if;
  if zi is null or zi < 1 or zi > 28 then
    raise exception 'Ziua din lună e între 1 și 28.';
  end if;
  if porneste is null then
    raise exception 'Alege data de pornire.';
  end if;
  if not exists (select 1 from public.proiecte where id = p) then
    raise exception 'Proiectul nu mai există.';
  end if;
  if exists (select 1 from public.abonamente where proiect_id = p and oprit_la is null) then
    raise exception 'Proiectul are deja o mentenanță pornită.';
  end if;

  insert into public.abonamente (proiect_id, suma_lei, zi, porneste) values (p, suma, zi, porneste) returning id into a;

  if om is not null then
    insert into public.abonament_oameni (abonament_id, om_id, procent)
    select a, pr.id, b.procent
      from public.profiluri pr
      left join public.procente_baza b on b.categorie = 'mentenanta' and b.rol = pr.rol
     where pr.id = om and pr.rol <> 'admin';
  end if;
  insert into public.abonament_oameni (abonament_id, om_id, procent)
  select a, v.om_id, b.procent
    from public.proiect_vanzari v
    join public.profiluri pr on pr.id = v.om_id
    join public.procente_baza b on b.categorie = 'mentenanta' and b.rol = pr.rol
   where v.proiect_id = p and b.procent > 0
  on conflict do nothing;

  perform public.genereaza_mentenanta(public.azi_ro() + 35);
  return a;
end $$;

-- ───────────── 3) oamenii de pe proiect și comisioanele fără procent ─────────────

-- Contul pornit se cere doar când omul e pus pe proiect, nu când i se schimbă procentul
-- (upsert-ul trece întâi prin „insert”, deci un rând deja existent nu se mai verifică).
create or replace function public.inainte_de_om_pe_proiect() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.om_id is not distinct from old.om_id then
    return new;
  end if;
  if tg_op = 'INSERT' and exists (select 1 from public.proiect_oameni o where o.proiect_id = new.proiect_id and o.om_id = new.om_id) then
    return new;
  end if;
  if not exists (select 1 from public.profiluri p where p.id = new.om_id and p.rol = 'constructor' and p.activ) then
    raise exception 'Pe proiect se pun doar constructori cu contul pornit.';
  end if;
  return new;
end $$;

create or replace function public.inainte_de_vanzator() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.om_id is not distinct from old.om_id then
    return new;
  end if;
  if tg_op = 'INSERT' and exists (select 1 from public.proiect_vanzari v where v.proiect_id = new.proiect_id and v.om_id = new.om_id) then
    return new;
  end if;
  if not exists (select 1 from public.profiluri p where p.id = new.om_id and p.rol in ('caller', 'closer') and p.activ) then
    raise exception 'Aici se pun doar calleri și closeri cu contul pornit.';
  end if;
  return new;
end $$;

-- Fără rândul lui de pe proiect, procentul nu se mai poate pune, iar comisionul ar rămâne blocat (și clientul nu s-ar mai putea șterge).
-- Nu se aplică la ștergerea proiectului (sterge_client verifică întâi comisioanele) și nici scripturilor cu cheia de serviciu.
create function public.inainte_de_scos_de_pe_proiect() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null or not exists (select 1 from public.proiecte p where p.id = old.proiect_id) then
    return old;
  end if;
  if exists (select 1 from public.comisioane k
              where k.proiect_id = old.proiect_id and k.om_id = old.om_id
                and k.tip = 'comision' and k.suma_lei is null and k.platit_la is null) then
    raise exception 'Are comisioane fără procent pe proiect. Pune-i întâi procentul (0 dacă nu primește nimic).';
  end if;
  return old;
end $$;

create trigger inainte_de_scos_om before delete on public.proiect_oameni
  for each row execute function public.inainte_de_scos_de_pe_proiect();
create trigger inainte_de_scos_vanzator before delete on public.proiect_vanzari
  for each row execute function public.inainte_de_scos_de_pe_proiect();

revoke execute on function public.inainte_de_scos_de_pe_proiect() from public, anon, authenticated;

-- ───────────── 4) ce vede echipa ─────────────

-- Fără „· rest”: omul nu vede că un client a plătit doar o parte.
create or replace function public.comisioanele_mele()
returns table (id uuid, tip text, client text, eticheta text, procent numeric, baza_lei int, suma_lei int, platit_la date, creat_la timestamptz)
language sql stable security definer set search_path = ''
as $$
  select k.id, k.tip, c.nume, regexp_replace(tr.eticheta, ' · rest$', ''), k.procent, k.baza_lei, k.suma_lei, k.platit_la, k.creat_la
    from public.comisioane k
    left join public.proiecte p on p.id = k.proiect_id
    left join public.clienti c on c.id = p.client_id
    left join public.transe tr on tr.id = k.transa_id
   where k.om_id = auth.uid() and public.rol_curent() is not null
   order by k.creat_la desc
$$;

-- Fără date și fără luna mentenanței: omul nu poate deduce cine întârzie. Grupate pe client și proiect.
drop function public.comisioane_viitoare();
create function public.comisioane_viitoare()
returns table (client text, proiect text, eticheta text, suma_lei int, procent numeric, comision int)
language sql stable security definer set search_path = ''
as $$
  with liste as (
    select tr.id as transa_id, o.procent
      from public.transe tr join public.proiect_oameni o on o.proiect_id = tr.proiect_id and o.om_id = auth.uid()
     where tr.abonament_id is null and tr.incasata_la is null
    union all
    select tr.id, v.procent
      from public.transe tr join public.proiect_vanzari v on v.proiect_id = tr.proiect_id and v.om_id = auth.uid()
     where tr.abonament_id is null and tr.incasata_la is null
    union all
    select tr.id, ao.procent
      from public.transe tr join public.abonament_oameni ao on ao.abonament_id = tr.abonament_id and ao.om_id = auth.uid()
     where tr.incasata_la is null
  )
  select c.nume, p.titlu,
         case when tr.tip = 'mentenanta' then 'Mentenanță' else regexp_replace(tr.eticheta, ' · rest$', '') end,
         tr.suma_lei, l.procent,
         case when l.procent is null then null else round(tr.suma_lei * l.procent / 100)::int end
    from liste l
    join public.transe tr on tr.id = l.transa_id
    join public.proiecte p on p.id = tr.proiect_id
    join public.clienti c on c.id = p.client_id
   where l.procent is distinct from 0
     and public.rol_curent() in ('caller', 'closer', 'constructor')
   order by 1, 2, 3
$$;

revoke execute on function public.comisioane_viitoare() from public, anon;
grant execute on function public.comisioane_viitoare() to authenticated;
