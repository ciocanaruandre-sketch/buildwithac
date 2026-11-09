-- Formularele Tally se dau clienților după ce semnează: nu aduc lead-uri.
-- Lead-urile noi vin din reclamele Meta și TikTok (formulare de tip Typeform).
-- Un enum Postgres nu-și poate șterge valorile, așa că îl refacem.

drop policy lead_adaugare on public.lead_uri;

alter type public.sursa rename to sursa_veche;
create type public.sursa as enum ('formular_site', 'reclama_meta', 'reclama_tiktok', 'cold_calling', 'recomandare', 'dm_instagram', 'dm_tiktok', 'altceva');

-- datele de test venite „din Tally” devin „Reclamă Meta”
alter table public.lead_uri alter column sursa type public.sursa
  using (case when sursa::text like 'tally_%' then 'reclama_meta' else sursa::text end)::public.sursa;
alter table public.cereri alter column sursa type public.sursa
  using (case when sursa::text like 'tally_%' then 'reclama_meta' else sursa::text end)::public.sursa;
alter table public.clienti alter column sursa type public.sursa
  using (case when sursa::text like 'tally_%' then 'reclama_meta' else sursa::text end)::public.sursa;

drop type public.sursa_veche;

-- până intră singure, lead-urile din reclame se pot adăuga și de mână
create policy lead_adaugare on public.lead_uri for insert to authenticated
  with check (
    (select public.rol_curent()) in ('admin', 'caller', 'closer')
    and creat_de = (select auth.uid())
    and sursa in ('reclama_meta', 'reclama_tiktok', 'cold_calling', 'recomandare', 'dm_instagram', 'dm_tiktok', 'altceva')
  );
