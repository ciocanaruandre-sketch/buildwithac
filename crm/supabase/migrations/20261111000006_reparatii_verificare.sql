-- Reparațiile din verificarea etapei 2.

-- 1) Un fișier urcă doar pe drumul fix <proiect>/<uuid>/<nume curat> (același tipar ca desfaCalea din lib/fisiere.ts).
--    Altfel un fișier urcat pe alt drum, direct prin Storage, ar bloca „Șterge clientul”.
create function public.cale_fisier_valida(cale text) returns boolean
language sql immutable set search_path = ''
as $$
  select coalesce(cale ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[A-Za-z0-9._-]{1,80}$', false)
$$;
revoke execute on function public.cale_fisier_valida(text) from public, anon;
grant execute on function public.cale_fisier_valida(text) to authenticated;

drop policy materiale_fisiere_adaugare on storage.objects;
create policy materiale_fisiere_adaugare on storage.objects for insert to authenticated
  with check (
    bucket_id = 'materiale'
    and public.cale_fisier_valida(name)
    and public.lucreaza_la(public.proiect_din_cale(name))
  );

-- 2) „Adăugat de” e mereu omul conectat; un material trimite doar la un fișier din dosarul proiectului lui.
drop policy livrari_adaugare on public.livrari;
create policy livrari_adaugare on public.livrari for insert to authenticated
  with check (public.lucreaza_la(proiect_id) and adaugat_de = (select auth.uid()));

drop policy conturi_adaugare on public.conturi;
create policy conturi_adaugare on public.conturi for insert to authenticated
  with check (public.lucreaza_la(proiect_id) and adaugat_de = (select auth.uid()));

drop policy materiale_adaugare on public.materiale;
create policy materiale_adaugare on public.materiale for insert to authenticated
  with check (
    public.lucreaza_la(proiect_id)
    and adaugat_de = (select auth.uid())
    and (cale is null or (public.cale_fisier_valida(cale) and public.proiect_din_cale(cale) = proiect_id))
  );

alter table public.materiale add constraint materiale_marime_maxima check (marime <= 26214400);

-- 4) Lead-ul și clientul pleacă împreună sau deloc. Rulează cu drepturile celui care cheamă (RLS: doar Adminul șterge).
--    Fișierele se șterg după, din aplicație; ce rămâne prinde curățarea din jobul zilnic.
create function public.sterge_client(c uuid) returns boolean
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
revoke execute on function public.sterge_client(uuid) from public, anon;
grant execute on function public.sterge_client(uuid) to authenticated;
