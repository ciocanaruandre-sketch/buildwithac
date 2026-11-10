-- Conturile folosite într-un proiect (fără parole) și materialele lui (link-uri; fișierele vin cu migrația următoare).
-- Valorile enum-urilor = lib/tipuri.ts.
create type public.al_cui as enum ('client', 'firma');
-- o listă, nu un câmp liber: aici nu are cum să ajungă o parolă
create type public.unde_parola as enum ('la_client', 'la_firma', 'manager_parole', 'nu_e_cazul');

create table public.conturi (
  id uuid primary key default gen_random_uuid(),
  proiect_id uuid not null references public.proiecte (id) on delete cascade,
  serviciu text not null check (length(serviciu) between 1 and 120),
  cont text not null check (length(cont) between 1 and 200),
  al_cui public.al_cui not null,
  unde_parola public.unde_parola not null default 'nu_e_cazul',
  adaugat_de uuid default auth.uid() references public.profiluri (id) on delete set null,
  adaugat_la timestamptz not null default now()
);
create index conturi_proiect on public.conturi (proiect_id);
create index conturi_adaugat_de on public.conturi (adaugat_de);

create table public.materiale (
  id uuid primary key default gen_random_uuid(),
  proiect_id uuid not null references public.proiecte (id) on delete cascade,
  titlu text not null check (length(titlu) between 1 and 200),
  nota text check (length(nota) <= 500),
  -- ori un link…
  url text check (url ~ '^https?://'),
  -- …ori un fișier din bucketul „materiale” (calea lui)
  cale text unique,
  marime int check (marime >= 0),
  adaugat_de uuid default auth.uid() references public.profiluri (id) on delete set null,
  adaugat_la timestamptz not null default now(),
  check ((url is null) <> (cale is null))
);
create index materiale_proiect on public.materiale (proiect_id, adaugat_la desc);
create index materiale_adaugat_de on public.materiale (adaugat_de);

alter table public.conturi enable row level security;
alter table public.materiale enable row level security;
revoke all on public.conturi, public.materiale from anon;
grant select, insert, delete on public.conturi, public.materiale to authenticated;

-- le vede, le adaugă și le șterge cine lucrează la proiect; nu se schimbă (greșeala se șterge și se scrie din nou)
create policy conturi_citire on public.conturi for select to authenticated
  using (public.lucreaza_la(proiect_id));
create policy conturi_adaugare on public.conturi for insert to authenticated
  with check (public.lucreaza_la(proiect_id));
create policy conturi_stergere on public.conturi for delete to authenticated
  using (public.lucreaza_la(proiect_id));

create policy materiale_citire on public.materiale for select to authenticated
  using (public.lucreaza_la(proiect_id));
create policy materiale_adaugare on public.materiale for insert to authenticated
  with check (public.lucreaza_la(proiect_id));
create policy materiale_stergere on public.materiale for delete to authenticated
  using (public.lucreaza_la(proiect_id));
