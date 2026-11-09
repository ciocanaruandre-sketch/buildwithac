-- Permisiunile: verificate în baza de date, nu doar în pagină.

-- rolul celui conectat, doar dacă are contul activ; altfel null (= nu vede nimic)
create function public.rol_curent() returns public.rol
language sql stable security definer set search_path = ''
as $$ select p.rol from public.profiluri p where p.id = auth.uid() and p.activ $$;
revoke execute on function public.rol_curent() from public, anon;
grant execute on function public.rol_curent() to authenticated;

alter table public.profiluri enable row level security;
alter table public.lead_uri enable row level security;
alter table public.cereri enable row level security;
alter table public.evenimente enable row level security;
alter table public.notite enable row level security;
alter table public.clienti enable row level security;

revoke all on public.profiluri, public.lead_uri, public.cereri, public.evenimente, public.notite, public.clienti from anon;
grant select, insert, update, delete on public.profiluri, public.lead_uri, public.cereri, public.evenimente, public.notite, public.clienti to authenticated;

-- profiluri
create policy profiluri_citire on public.profiluri for select to authenticated
  using ((select public.rol_curent()) is not null);
create policy profiluri_schimbare on public.profiluri for update to authenticated
  using ((select public.rol_curent()) = 'admin') with check ((select public.rol_curent()) = 'admin');

-- lead_uri: Admin, Caller, Closer văd tot; Constructorul nimic
create policy lead_citire on public.lead_uri for select to authenticated
  using ((select public.rol_curent()) in ('admin', 'caller', 'closer'));
create policy lead_adaugare on public.lead_uri for insert to authenticated
  with check (
    (select public.rol_curent()) in ('admin', 'caller', 'closer')
    and creat_de = (select auth.uid())
    and sursa in ('cold_calling', 'recomandare', 'dm_instagram', 'dm_tiktok', 'altceva')
  );
-- se poate atinge un lead al tău sau unul liber (ca să ți-l iei); după schimbare trebuie să fie al tău
create policy lead_schimbare on public.lead_uri for update to authenticated
  using (
    (select public.rol_curent()) = 'admin'
    or ((select public.rol_curent()) in ('caller', 'closer')
        and (caller_id = (select auth.uid()) or closer_id = (select auth.uid()) or caller_id is null))
  )
  with check (
    (select public.rol_curent()) = 'admin'
    or ((select public.rol_curent()) in ('caller', 'closer')
        and (caller_id = (select auth.uid()) or closer_id = (select auth.uid())))
  );
create policy lead_stergere on public.lead_uri for delete to authenticated
  using ((select public.rol_curent()) = 'admin');

-- cereri și Parcurs: doar citire (scriu trigger-ele și cheia de serviciu)
create policy cereri_citire on public.cereri for select to authenticated
  using ((select public.rol_curent()) in ('admin', 'caller', 'closer'));
create policy evenimente_citire on public.evenimente for select to authenticated
  using ((select public.rol_curent()) in ('admin', 'caller', 'closer'));

-- notițe: le vede cine vede lead-ul; scrie cine poate lucra pe lead
create policy notite_citire on public.notite for select to authenticated
  using ((select public.rol_curent()) in ('admin', 'caller', 'closer'));
create policy notite_adaugare on public.notite for insert to authenticated
  with check (
    autor_id = (select auth.uid())
    and exists (
      select 1 from public.lead_uri l
      where l.id = lead_id
        and ((select public.rol_curent()) = 'admin'
             or ((select public.rol_curent()) in ('caller', 'closer')
                 and (l.caller_id = (select auth.uid()) or l.closer_id = (select auth.uid()))))
    )
  );

-- clienți: Admin tot; callerul și closerul doar pe ai lor; Constructorul (etapa 1) nimic
create policy clienti_citire on public.clienti for select to authenticated
  using (
    (select public.rol_curent()) = 'admin'
    or ((select public.rol_curent()) in ('caller', 'closer')
        and (caller_id = (select auth.uid()) or closer_id = (select auth.uid())))
  );
