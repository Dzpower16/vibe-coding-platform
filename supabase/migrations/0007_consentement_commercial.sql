-- Entre-Mains — 0007 : consentement version 2 (application payante, portée « promotion »)
-- La version 2 du texte (lib/consentement.ts) dit clairement que l'application peut être payante
-- et ajoute une case facultative, jamais précochée : vidéos utilisées dans des publicités ou des
-- vidéos de présentation. Les personnes ayant signé la version 1 doivent re-signer pour filmer.

alter table public.consentements
  add column portee_promotion boolean not null default false;

grant insert (portee_promotion) on public.consentements to authenticated;
