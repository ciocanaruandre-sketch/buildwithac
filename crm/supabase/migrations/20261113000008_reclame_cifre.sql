-- CRM buildwithac, etapa 3, bucata 3: cifrele paginii Reclame și unirea a două reclame (redenumite în Meta).

-- Câte un rând pe reclamă (fără cele unite în altele): pâlnia și banii.
-- Încasat = banii lăsați de clienții șterși + net-ul tranșelor încasate ale clienților de acum (fără cele „înainte” de CRM).
-- Mai vin = tranșele neîncasate ale clienților de acum. Cu drepturile celui care întreabă: doar Adminul vede ceva.
create function public.reclame_cifre()
returns table (
  id uuid,
  platforma text,
  campanie text,
  nume text,
  cheltuit_lei int,
  lead_uri int,
  discutii int,
  clienti int,
  incasat_lei int,
  mai_vin_lei int
)
language sql stable security invoker set search_path = ''
as $$
  with numar as (
    select l.reclama_id,
           count(*)::int as lead_uri,
           (count(*) filter (where l.a_avut_discutie or l.client))::int as discutii,
           (count(*) filter (where l.client))::int as clienti,
           coalesce(sum(l.incasat_sters_lei), 0) as sters
      from public.reclame_lead_uri l
     group by l.reclama_id
  ),
  bani as (
    select l.reclama_id,
           coalesce(sum(t.incasat_lei - t.returnat_lei) filter (where t.incasata_la is not null and t.tip <> 'inainte'), 0) as incasat,
           coalesce(sum(t.suma_lei) filter (where t.incasata_la is null), 0) as mai_vin
      from public.reclame_lead_uri l
      join public.proiecte p on p.client_id = l.client_id
      join public.transe t on t.proiect_id = p.id
     where l.client_id is not null
     group by l.reclama_id
  )
  select r.id, r.platforma, r.campanie, r.nume, r.cheltuit_lei,
         coalesce(n.lead_uri, 0),
         coalesce(n.discutii, 0),
         coalesce(n.clienti, 0),
         (coalesce(n.sters, 0) + coalesce(b.incasat, 0))::int,
         coalesce(b.mai_vin, 0)::int
    from public.reclame r
    left join numar n on n.reclama_id = r.id
    left join bani b on b.reclama_id = r.id
   where r.unita_in is null
$$;

revoke execute on function public.reclame_cifre() from public, anon;
grant execute on function public.reclame_cifre() to authenticated, service_role;

-- Două reclame care sunt de fapt una (redenumită în Meta): lead-urile și cheltuiala trec la cea păstrată,
-- iar lead-urile care vin de acum cu numele vechi ajung tot la ea (unita_in).
create function public.uneste_reclame(p_pastrata uuid, p_unita uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  a public.reclame;
  b public.reclame;
begin
  if auth.uid() is not null and (select public.rol_curent()) is distinct from 'admin' then
    raise exception 'Doar Adminul unește reclamele.';
  end if;
  if p_pastrata = p_unita then
    raise exception 'Alege o altă reclamă.';
  end if;
  select * into a from public.reclame where id = p_pastrata for update;
  select * into b from public.reclame where id = p_unita for update;
  if a.id is null or b.id is null then
    raise exception 'Reclama nu mai există. Reîncarcă pagina.';
  end if;
  if a.unita_in is not null or b.unita_in is not null then
    raise exception 'Reclama e deja unită cu alta. Reîncarcă pagina.';
  end if;
  if a.platforma <> b.platforma then
    raise exception 'Poți uni doar reclame de pe aceeași platformă.';
  end if;
  update public.reclame_lead_uri set reclama_id = p_pastrata where reclama_id = p_unita;
  -- gol + X = X, gol + gol = gol
  update public.reclame
     set cheltuit_lei = case when a.cheltuit_lei is null and b.cheltuit_lei is null then null
                             else coalesce(a.cheltuit_lei, 0) + coalesce(b.cheltuit_lei, 0) end
   where id = p_pastrata;
  update public.reclame set unita_in = p_pastrata where id = p_unita or unita_in = p_unita;
end $$;

revoke execute on function public.uneste_reclame(uuid, uuid) from public, anon;
grant execute on function public.uneste_reclame(uuid, uuid) to authenticated, service_role;
