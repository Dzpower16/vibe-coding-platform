-- Entre-Mains — 0006 : validation des prises (CLAUDE.md §1.1, étape 1c)
-- Des validateur·rice·s (rôle « validateur » ou « admin », attribué par SQL) acceptent ou refusent
-- chaque prise. Les garde-fous vivent dans la base, pas seulement dans l'interface :
--   1. personne ne valide ses propres prises (ni un import qu'il ou elle a déposé) ;
--   2. qui a décidé et quand est inscrit par la base elle-même (impossible à falsifier) ;
--   3. un refus exige un motif, pour que la personne sache quoi refaire.

alter table public.enregistrements
  add constraint enregistrements_motif_rejet_longueur check (char_length(motif_rejet) <= 500);

-- ---------------------------------------------------------------------------
-- Horodatage et signature de la décision
-- ---------------------------------------------------------------------------
create or replace function public.inscrire_decision_validation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.statut is distinct from old.statut then
    if new.statut = 'en_attente' then
      -- Décision annulée : la prise retourne dans la file.
      new.valide_par := null;
      new.valide_le := null;
      new.motif_rejet := null;
    else
      new.valide_par := (select auth.uid());
      new.valide_le := now();
      if new.statut = 'valide' then
        new.motif_rejet := null;
      elsif coalesce(btrim(new.motif_rejet), '') = '' then
        raise exception 'Un refus doit être accompagné d''un motif.' using errcode = 'check_violation';
      end if;
    end if;
  else
    -- Sans changement de statut, la signature de la décision ne bouge pas.
    new.valide_par := old.valide_par;
    new.valide_le := old.valide_le;
  end if;
  return new;
end;
$$;

create trigger enregistrements_decision_validation
  before update on public.enregistrements
  for each row execute function public.inscrire_decision_validation();

-- ---------------------------------------------------------------------------
-- Pas d'auto-validation
-- ---------------------------------------------------------------------------
drop policy "valider un enregistrement" on public.enregistrements;
create policy "valider un enregistrement" on public.enregistrements
  for update to authenticated
  using (public.est_validateur() and signeur_id <> (select auth.uid()))
  with check (public.est_validateur() and signeur_id <> (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Index : file d'attente et clés étrangères signalées par l'analyseur Supabase
-- ---------------------------------------------------------------------------
create index enregistrements_file_attente_idx on public.enregistrements (created_at)
  where statut = 'en_attente';
create index enregistrements_consentement_idx on public.enregistrements (consentement_id);
create index enregistrements_valide_par_idx on public.enregistrements (valide_par);
create index sources_externes_cree_par_idx on public.sources_externes (cree_par);
