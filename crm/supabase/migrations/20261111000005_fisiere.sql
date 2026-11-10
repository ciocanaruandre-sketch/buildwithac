-- Fișierele de la „Materiale”: un bucket privat, cu aceeași regulă ca restul fișei (lucreaza_la).
-- Calea unui fișier: <proiect_id>/<uuid>/<nume curat>. Limita de 25 MB = MARIME_MAXIMA din lib/fisiere.ts.
insert into storage.buckets (id, name, public, file_size_limit)
values ('materiale', 'materiale', false, 26214400)
on conflict (id) do update set public = false, file_size_limit = 26214400;

-- proiectul din primul dosar al căii; null dacă nu e un uuid
create function public.proiect_din_cale(cale text) returns uuid
language sql immutable set search_path = ''
as $$
  select case
    when split_part(cale, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then split_part(cale, '/', 1)::uuid
  end
$$;
revoke execute on function public.proiect_din_cale(text) from public, anon;
grant execute on function public.proiect_din_cale(text) to authenticated;

-- citește, urcă și șterge doar cine lucrează la proiectul din cale; în afara dosarului unui proiect, nimeni
create policy materiale_fisiere_citire on storage.objects for select to authenticated
  using (
    bucket_id = 'materiale'
    and public.proiect_din_cale(name) is not null
    and public.lucreaza_la(public.proiect_din_cale(name))
  );
create policy materiale_fisiere_adaugare on storage.objects for insert to authenticated
  with check (
    bucket_id = 'materiale'
    and public.proiect_din_cale(name) is not null
    and public.lucreaza_la(public.proiect_din_cale(name))
  );
create policy materiale_fisiere_stergere on storage.objects for delete to authenticated
  using (
    bucket_id = 'materiale'
    and public.proiect_din_cale(name) is not null
    and public.lucreaza_la(public.proiect_din_cale(name))
  );
