-- Entre-Mains — 0001 : bibliothèque de signes LSQ
-- Tables : signes, signeurs, consentements, enregistrements ; vue lexique ; stockage.
-- À exécuter une fois dans l'éditeur SQL de Supabase. Voir CLAUDE.md §6.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.type_signe as enum ('signe', 'lettre', 'chiffre');
create type public.role_signeur as enum ('contributeur', 'validateur', 'admin');
create type public.statut_enregistrement as enum ('en_attente', 'valide', 'rejete');

-- ---------------------------------------------------------------------------
-- signes : catalogue des concepts à filmer (alimenté par supabase/seed.sql)
-- ---------------------------------------------------------------------------
create table public.signes (
  id          bigint generated always as identity primary key,
  glose       text not null unique check (glose ~ '^[A-Z0-9]+(-[A-Z0-9]+)*$'),
  mots_fr     text[] not null default '{}',
  categorie   text not null,
  type        public.type_signe not null default 'signe',
  priorite    smallint not null default 3 check (priorite between 1 and 3),
  notes       text,
  created_at  timestamptz not null default now()
);
create index signes_categorie_idx on public.signes (categorie);
create index signes_mots_fr_idx on public.signes using gin (mots_fr);

-- ---------------------------------------------------------------------------
-- signeurs : profil des contributeur·rice·s (id = auth.users.id)
-- ---------------------------------------------------------------------------
create table public.signeurs (
  id              uuid primary key references auth.users (id) on delete cascade,
  nom_affiche     text not null check (char_length(nom_affiche) between 1 and 80),
  identite        text not null check (identite in ('sourd', 'malentendant', 'coda', 'interprete', 'autre')),
  region          text check (char_length(region) <= 80),
  main_dominante  text not null check (main_dominante in ('droite', 'gauche')),
  role            public.role_signeur not null default 'contributeur',
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- consentements : une ligne par signature (texte intégral conservé)
-- ---------------------------------------------------------------------------
create table public.consentements (
  id                     uuid primary key default gen_random_uuid(),
  signeur_id             uuid not null references public.signeurs (id) on delete cascade,
  version                text not null,
  texte                  text not null,
  nom_signature          text not null check (char_length(nom_signature) between 2 and 120),
  a_14_ans_ou_plus       boolean not null check (a_14_ans_ou_plus),
  portee_application     boolean not null check (portee_application),
  portee_reconnaissance  boolean not null default false,
  portee_avatar          boolean not null default false,
  portee_credit_public   boolean not null default false,
  signe_le               timestamptz not null default now(),
  revoque_le             timestamptz
);
create index consentements_signeur_idx on public.consentements (signeur_id) where revoque_le is null;

-- ---------------------------------------------------------------------------
-- enregistrements : une prise vidéo d'un signe
-- ---------------------------------------------------------------------------
create table public.enregistrements (
  id                   uuid primary key default gen_random_uuid(),
  signe_id             bigint not null references public.signes (id) on delete restrict,
  signeur_id           uuid not null references public.signeurs (id) on delete cascade,
  consentement_id      uuid not null references public.consentements (id) on delete restrict,
  video_path           text not null unique,
  positions_path       text,
  mime                 text not null,
  duree_ms             integer not null check (duree_ms > 0 and duree_ms <= 20000),
  largeur              integer,
  hauteur              integer,
  fps                  real,
  nb_frames_positions  integer,
  debut_ms             integer check (debut_ms >= 0),
  fin_ms               integer check (fin_ms >= 0),
  main_dominante       text check (main_dominante in ('droite', 'gauche')),
  variante             text check (char_length(variante) <= 120),
  commentaire          text check (char_length(commentaire) <= 1000),
  statut               public.statut_enregistrement not null default 'en_attente',
  motif_rejet          text,
  valide_par           uuid references public.signeurs (id),
  valide_le            timestamptz,
  created_at           timestamptz not null default now(),
  check (fin_ms is null or debut_ms is null or fin_ms > debut_ms)
);
create index enregistrements_signe_idx on public.enregistrements (signe_id, statut);
create index enregistrements_signeur_idx on public.enregistrements (signeur_id);

-- ---------------------------------------------------------------------------
-- Fonctions utilitaires pour RLS (security definer : lisent sans boucle RLS)
-- ---------------------------------------------------------------------------
create or replace function public.est_validateur()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.signeurs
    where id = (select auth.uid()) and role in ('validateur', 'admin')
  );
$$;

create or replace function public.a_consentement_actif()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.consentements
    where signeur_id = (select auth.uid()) and revoque_le is null
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.signes enable row level security;
alter table public.signeurs enable row level security;
alter table public.consentements enable row level security;
alter table public.enregistrements enable row level security;

-- signes : lecture publique, écriture réservée (éditeur SQL / clé secrète)
create policy "signes lisibles par tous" on public.signes
  for select to anon, authenticated using (true);

-- signeurs : chacun son profil ; les validateur·rice·s voient tout
create policy "voir son profil" on public.signeurs
  for select to authenticated using (id = (select auth.uid()) or public.est_validateur());
create policy "créer son profil" on public.signeurs
  for insert to authenticated with check (id = (select auth.uid()));
create policy "modifier son profil" on public.signeurs
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Le rôle ne peut pas être choisi ni modifié par l'utilisateur·rice (privilèges par colonne).
revoke insert, update on public.signeurs from anon, authenticated;
grant insert (id, nom_affiche, identite, region, main_dominante) on public.signeurs to authenticated;
grant update (nom_affiche, identite, region, main_dominante) on public.signeurs to authenticated;

-- consentements : signer pour soi, voir les siens, seulement révoquer
create policy "voir ses consentements" on public.consentements
  for select to authenticated using (signeur_id = (select auth.uid()) or public.est_validateur());
create policy "signer un consentement" on public.consentements
  for insert to authenticated with check (signeur_id = (select auth.uid()) and revoque_le is null);
create policy "révoquer son consentement" on public.consentements
  for update to authenticated
  using (signeur_id = (select auth.uid()) and revoque_le is null)
  with check (signeur_id = (select auth.uid()) and revoque_le is not null);

revoke insert, update, delete on public.consentements from anon, authenticated;
grant insert (signeur_id, version, texte, nom_signature, a_14_ans_ou_plus, portee_application,
              portee_reconnaissance, portee_avatar, portee_credit_public)
  on public.consentements to authenticated;
grant update (revoque_le) on public.consentements to authenticated;

-- enregistrements
create policy "voir ses enregistrements" on public.enregistrements
  for select to authenticated using (signeur_id = (select auth.uid()) or public.est_validateur());

create policy "déposer un enregistrement" on public.enregistrements
  for insert to authenticated with check (
    signeur_id = (select auth.uid())
    and video_path like (select auth.uid())::text || '/%'
    and (positions_path is null or positions_path like (select auth.uid())::text || '/%')
    and exists (
      select 1 from public.consentements c
      where c.id = consentement_id and c.signeur_id = (select auth.uid()) and c.revoque_le is null
    )
  );

create policy "retirer un enregistrement non validé" on public.enregistrements
  for delete to authenticated using (signeur_id = (select auth.uid()) and statut = 'en_attente');

create policy "valider un enregistrement" on public.enregistrements
  for update to authenticated using (public.est_validateur()) with check (public.est_validateur());

revoke insert, update on public.enregistrements from anon, authenticated;
grant insert (id, signe_id, signeur_id, consentement_id, video_path, positions_path, mime, duree_ms,
              largeur, hauteur, fps, nb_frames_positions, debut_ms, fin_ms, main_dominante,
              variante, commentaire)
  on public.enregistrements to authenticated;
grant update (statut, motif_rejet, valide_par, valide_le, debut_ms, fin_ms)
  on public.enregistrements to authenticated;

-- ---------------------------------------------------------------------------
-- Vue lexique : seuls signes utilisables par le direct (CLAUDE.md §1.3)
-- security_invoker : lue côté serveur avec la clé secrète.
-- ---------------------------------------------------------------------------
create view public.lexique with (security_invoker = true) as
select
  s.id,
  s.glose,
  s.mots_fr,
  s.categorie,
  s.type,
  count(e.id)::int as nb_videos
from public.signes s
join public.enregistrements e on e.signe_id = s.id and e.statut = 'valide'
join public.consentements c on c.id = e.consentement_id and c.revoque_le is null
group by s.id;

-- ---------------------------------------------------------------------------
-- Stockage : buckets privés, chacun écrit seulement dans son dossier {uid}/
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('videos-signes', 'videos-signes', false, 52428800, array['video/mp4', 'video/webm']),
  ('positions-signes', 'positions-signes', false, 20971520, array['application/gzip'])
on conflict (id) do nothing;

create policy "déposer dans son dossier" on storage.objects
  for insert to authenticated with check (
    bucket_id in ('videos-signes', 'positions-signes')
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.a_consentement_actif()
  );

create policy "lire son dossier ou valider" on storage.objects
  for select to authenticated using (
    bucket_id in ('videos-signes', 'positions-signes')
    and ((storage.foldername(name))[1] = (select auth.uid())::text or public.est_validateur())
  );

create policy "supprimer dans son dossier" on storage.objects
  for delete to authenticated using (
    bucket_id in ('videos-signes', 'positions-signes')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
