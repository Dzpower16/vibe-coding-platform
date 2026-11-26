-- Entre-Mains — 0005 : vidéos externes avec accord écrit (CLAUDE.md §6ter)
-- Une vidéo filmée hors de /tournage (ex. vidéo d'un·e créateur·rice LSQ) peut entrer dans la
-- bibliothèque SEULEMENT si un accord écrit de son titulaire ET des personnes filmées est
-- enregistré ici, avec sa preuve. Le retrait de l'accord retire les vidéos du lexique.

-- ---------------------------------------------------------------------------
-- Fonction : la personne connectée est-elle admin ?
-- ---------------------------------------------------------------------------
create or replace function public.est_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.signeurs where id = (select auth.uid()) and role = 'admin'
  );
$$;
revoke execute on function public.est_admin() from public, anon;
grant execute on function public.est_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Registre des accords
-- ---------------------------------------------------------------------------
create table public.sources_externes (
  id                     uuid primary key default gen_random_uuid(),
  titulaire              text not null check (char_length(titulaire) between 2 and 160),
  contact                text check (char_length(contact) <= 200),
  personnes_filmees      text not null check (char_length(personnes_filmees) between 2 and 500),
  url_origine            text check (url_origine ~ '^https?://'),
  description            text check (char_length(description) <= 2000),
  portee_application     boolean not null default false,
  portee_reconnaissance  boolean not null default false,
  portee_commercial      boolean not null default false,
  credit_public          boolean not null default false,
  credit_nom             text check (char_length(credit_nom) <= 160),
  mineurs                boolean not null default false,
  accord_parental        boolean not null default false,
  preuve_path            text,
  preuve_note            text check (char_length(preuve_note) <= 2000),
  date_accord            date not null,
  revoque_le             timestamptz,
  cree_par               uuid references public.signeurs (id),
  created_at             timestamptz not null default now(),
  check (not mineurs or accord_parental),
  check (preuve_path is not null or preuve_note is not null)
);

alter table public.sources_externes enable row level security;

create policy "admins lisent les accords" on public.sources_externes
  for select to authenticated using (public.est_admin());
create policy "admins créent les accords" on public.sources_externes
  for insert to authenticated with check (public.est_admin() and cree_par = (select auth.uid()));
create policy "admins modifient les accords" on public.sources_externes
  for update to authenticated using (public.est_admin()) with check (public.est_admin());

-- ---------------------------------------------------------------------------
-- Enregistrements : origine « tournage » (consentement) ou « externe » (accord)
-- ---------------------------------------------------------------------------
alter table public.enregistrements
  add column origine text not null default 'tournage' check (origine in ('tournage', 'externe')),
  add column source_externe_id uuid references public.sources_externes (id) on delete restrict,
  add column signeur_externe text check (char_length(signeur_externe) <= 160),
  add column source_debut_ms integer check (source_debut_ms >= 0),
  add column source_fin_ms integer check (source_fin_ms >= 0);

alter table public.enregistrements alter column consentement_id drop not null;

alter table public.enregistrements add constraint enregistrements_origine_coherente check (
  (origine = 'tournage' and consentement_id is not null and source_externe_id is null)
  or (origine = 'externe' and source_externe_id is not null)
);

create index enregistrements_source_idx on public.enregistrements (source_externe_id);

-- La politique de tournage ne couvre que l'origine « tournage ».
drop policy "déposer un enregistrement" on public.enregistrements;
create policy "déposer un enregistrement" on public.enregistrements
  for insert to authenticated with check (
    origine = 'tournage'
    and signeur_id = (select auth.uid())
    and video_path like (select auth.uid())::text || '/%'
    and (positions_path is null or positions_path like (select auth.uid())::text || '/%')
    and exists (
      select 1 from public.consentements c
      where c.id = consentement_id and c.signeur_id = (select auth.uid()) and c.revoque_le is null
    )
  );

create policy "importer un enregistrement externe" on public.enregistrements
  for insert to authenticated with check (
    origine = 'externe'
    and public.est_admin()
    and signeur_id = (select auth.uid())
    and video_path like (select auth.uid())::text || '/%'
    and (positions_path is null or positions_path like (select auth.uid())::text || '/%')
    and exists (
      select 1 from public.sources_externes x
      where x.id = source_externe_id and x.revoque_le is null
    )
  );

grant insert (origine, source_externe_id, signeur_externe, source_debut_ms, source_fin_ms)
  on public.enregistrements to authenticated;

-- ---------------------------------------------------------------------------
-- Lexique : prises valides dont le consentement OU l'accord est toujours actif
-- ---------------------------------------------------------------------------
create or replace view public.lexique with (security_invoker = true) as
select
  s.id,
  s.glose,
  s.mots_fr,
  s.categorie,
  s.type,
  count(e.id)::int as nb_videos
from public.signes s
join public.enregistrements e on e.signe_id = s.id and e.statut = 'valide'
left join public.consentements c on c.id = e.consentement_id
left join public.sources_externes x on x.id = e.source_externe_id
where (e.origine = 'tournage' and c.id is not null and c.revoque_le is null)
   or (e.origine = 'externe' and x.id is not null and x.revoque_le is null and x.portee_application)
group by s.id;

-- ---------------------------------------------------------------------------
-- Stockage : preuves d'accord (admins seulement) ; dépôt des imports par les admins
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('preuves-accords', 'preuves-accords', false, 10485760,
        array['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/plain'])
on conflict (id) do nothing;

create policy "admins déposent les preuves" on storage.objects
  for insert to authenticated with check (bucket_id = 'preuves-accords' and public.est_admin());
create policy "admins lisent les preuves" on storage.objects
  for select to authenticated using (bucket_id = 'preuves-accords' and public.est_admin());

create policy "admins importent dans leur dossier" on storage.objects
  for insert to authenticated with check (
    bucket_id in ('videos-signes', 'positions-signes')
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.est_admin()
  );
