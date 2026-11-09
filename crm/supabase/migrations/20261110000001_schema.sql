-- CRM buildwithac, etapa 1: tabelele. Valorile enum-urilor = lib/tipuri.ts.
create type public.rol as enum ('admin', 'caller', 'closer', 'constructor');
create type public.stare as enum ('nou', 'fara_raspuns', 'a_raspuns', 'callback', 'programat', 'oferta_trimisa', 'client', 'pierdut', 'descalificat');
create type public.sursa as enum ('formular_site', 'tally_site', 'tally_automatizari', 'tally_ghid', 'cold_calling', 'recomandare', 'dm_instagram', 'dm_tiktok', 'altceva');
create type public.serviciu as enum ('site', 'automatizari', '1la1', 'altceva');

-- oamenii din echipă; rândul se creează de Admin la invitație (nu există înscriere liberă)
create table public.profiluri (
  id uuid primary key references auth.users (id) on delete cascade,
  nume text not null,
  email text not null unique,
  rol public.rol not null,
  activ boolean not null default true,
  durata_discutie_min int not null default 30 check (durata_discutie_min between 10 and 180),
  creat_la timestamptz not null default now()
);

create table public.lead_uri (
  id uuid primary key default gen_random_uuid(),
  nume text not null check (length(nume) between 1 and 120),
  telefon text,
  telefon_norm text unique,
  email text,
  email_norm text unique,
  serviciu public.serviciu not null,
  sursa public.sursa not null,
  stare public.stare not null default 'nou',
  caller_id uuid references public.profiluri (id) on delete set null,
  closer_id uuid references public.profiluri (id) on delete set null,
  callback_la timestamptz,
  incercari int not null default 0,
  motiv text,
  -- de aici se numără cele 90 de zile (o cerere nouă le repornește)
  intrat_la timestamptz not null default now(),
  creat_de uuid references public.profiluri (id) on delete set null,
  creat_la timestamptz not null default now(),
  check (telefon_norm is not null or email_norm is not null)
);
create index lead_uri_intrat_la on public.lead_uri (intrat_la desc);
create index lead_uri_stare on public.lead_uri (stare);
create index lead_uri_caller on public.lead_uri (caller_id);
create index lead_uri_closer on public.lead_uri (closer_id);
create index lead_uri_callback on public.lead_uri (callback_la) where callback_la is not null;

-- fiecare formular trimis (un lead poate avea mai multe)
create table public.cereri (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.lead_uri (id) on delete cascade,
  sursa public.sursa not null,
  id_extern text unique,
  raspunsuri jsonb not null default '[]',
  utm jsonb not null default '{}',
  primita_la timestamptz not null default now()
);
create index cereri_lead on public.cereri (lead_id);

-- Parcursul: scris doar de trigger-e și de cheia de serviciu
create table public.evenimente (
  id bigint generated always as identity primary key,
  lead_id uuid not null references public.lead_uri (id) on delete cascade,
  autor_id uuid references public.profiluri (id) on delete set null,
  tip text not null,
  detalii jsonb not null default '{}',
  la timestamptz not null default now()
);
create index evenimente_lead on public.evenimente (lead_id, la desc);
create index evenimente_autor on public.evenimente (autor_id);

create table public.notite (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.lead_uri (id) on delete cascade,
  autor_id uuid default auth.uid() references public.profiluri (id) on delete set null,
  text text not null check (length(text) between 1 and 5000),
  link_vocal text,
  la timestamptz not null default now()
);
create index notite_lead on public.notite (lead_id, la desc);
create index notite_autor on public.notite (autor_id);

-- în etapa 1, doar lista; fișa completă vine în etapa 2
create table public.clienti (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid unique references public.lead_uri (id) on delete set null,
  nume text not null,
  telefon text,
  email text,
  serviciu public.serviciu not null,
  sursa public.sursa not null,
  caller_id uuid references public.profiluri (id) on delete set null,
  closer_id uuid references public.profiluri (id) on delete set null,
  creat_la timestamptz not null default now()
);
create index clienti_caller on public.clienti (caller_id);
create index clienti_closer on public.clienti (closer_id);
create index lead_uri_creat_de on public.lead_uri (creat_de);
