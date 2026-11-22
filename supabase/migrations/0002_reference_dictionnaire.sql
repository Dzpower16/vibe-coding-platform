-- Entre-Mains — 0002 : lien de référence vers un dictionnaire LSQ externe
-- Lien seulement (aucun contenu copié) : aide la personne qui filme ou valide à vérifier le SENS du mot.
-- Source actuelle : « Mon dictionnaire LSQ » (AQEPA, https://lsq-fr.ca). Voir CLAUDE.md §6.
-- Après cette migration, relancer supabase/seed.sql pour remplir les liens.

alter table public.signes
  add column reference_url text check (reference_url ~ '^https://');
