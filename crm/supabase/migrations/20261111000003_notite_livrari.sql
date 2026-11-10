-- Notițele proiectului și ce i s-a trimis clientului („Livrat”). Valorile enum-ului = lib/tipuri.ts.
create type public.stare_livrare as enum ('trimis', 'aprobat', 'de_refacut');

-- separate de notițele lead-ului: pe acelea constructorul nu le vede
create table public.notite_proiect (
  id uuid primary key default gen_random_uuid(),
  proiect_id uuid not null references public.proiecte (id) on delete cascade,
  autor_id uuid default auth.uid() references public.profiluri (id) on delete set null,
  text text not null check (length(text) between 1 and 5000),
  la timestamptz not null default now()
);
create index notite_proiect_proiect on public.notite_proiect (proiect_id, la desc);
create index notite_proiect_autor on public.notite_proiect (autor_id);

create table public.livrari (
  id uuid primary key default gen_random_uuid(),
  proiect_id uuid not null references public.proiecte (id) on delete cascade,
  titlu text not null check (length(titlu) between 1 and 200),
  link text check (link ~ '^https?://'),
  nota text check (length(nota) <= 1000),
  stare public.stare_livrare not null default 'trimis',
  adaugat_de uuid default auth.uid() references public.profiluri (id) on delete set null,
  adaugat_la timestamptz not null default now()
);
create index livrari_proiect on public.livrari (proiect_id, adaugat_la desc);
create index livrari_adaugat_de on public.livrari (adaugat_de);

alter table public.notite_proiect enable row level security;
alter table public.livrari enable row level security;
revoke all on public.notite_proiect, public.livrari from anon;
grant select, insert, update, delete on public.notite_proiect, public.livrari to authenticated;

-- notițe: le vede și le scrie cine lucrează la proiect, în numele lui; nu se schimbă; le șterge doar Adminul
create policy notite_proiect_citire on public.notite_proiect for select to authenticated
  using (public.lucreaza_la(proiect_id));
create policy notite_proiect_adaugare on public.notite_proiect for insert to authenticated
  with check (public.lucreaza_la(proiect_id) and autor_id = (select auth.uid()));
create policy notite_proiect_stergere on public.notite_proiect for delete to authenticated
  using ((select public.rol_curent()) = 'admin');

create policy livrari_citire on public.livrari for select to authenticated
  using (public.lucreaza_la(proiect_id));
create policy livrari_adaugare on public.livrari for insert to authenticated
  with check (public.lucreaza_la(proiect_id));
create policy livrari_schimbare on public.livrari for update to authenticated
  using (public.lucreaza_la(proiect_id)) with check (public.lucreaza_la(proiect_id));
create policy livrari_stergere on public.livrari for delete to authenticated
  using (public.lucreaza_la(proiect_id));

-- o livrare rămâne pe proiectul ei și cu autorul ei
create function public.inainte_de_schimbare_livrare() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.proiect_id is distinct from old.proiect_id then
    raise exception 'Livrarea nu se mută pe alt proiect.';
  end if;
  new.adaugat_de := old.adaugat_de;
  new.adaugat_la := old.adaugat_la;
  return new;
end $$;

create trigger inainte_de_schimbare_livrare before update on public.livrari
  for each row execute function public.inainte_de_schimbare_livrare();

-- Parcursul: ce s-a trimis și ce a zis clientul
create function public.dupa_livrare() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  eu uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    insert into public.evenimente_proiect (proiect_id, autor_id, tip, detalii)
      values (new.proiect_id, eu, 'livrat', jsonb_build_object('titlu', new.titlu));
  elsif new.stare is distinct from old.stare then
    insert into public.evenimente_proiect (proiect_id, autor_id, tip, detalii)
      values (new.proiect_id, eu, 'livrare_stare', jsonb_build_object('titlu', new.titlu, 'in', new.stare));
  end if;
  return null;
end $$;

create trigger dupa_livrare after insert or update on public.livrari
  for each row execute function public.dupa_livrare();

revoke execute on function public.inainte_de_schimbare_livrare(), public.dupa_livrare() from public, anon, authenticated;
