-- Entre-Mains — 0004 : définition courte de chaque signe
-- Texte original rédigé pour Entre-Mains (pas copié d'un dictionnaire). Sert à préciser le SENS
-- du mot pour la personne qui filme ou qui valide. Relancer supabase/seed.sql pour remplir la colonne.

alter table public.signes
  add column definition text check (char_length(definition) <= 200);
