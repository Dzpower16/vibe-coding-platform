# Entre-Mains

Application temps réel **français ↔ langue des signes québécoise (LSQ)**.
La constitution du projet (principes, architecture, conventions) est dans [`CLAUDE.md`](./CLAUDE.md).

## Mise en route (Vercel + Supabase, sans local)

1. **Supabase** — créer un projet (région Canada si possible), puis dans *SQL Editor* exécuter dans l'ordre :
   1. `supabase/migrations/0001_bibliotheque_signes.sql`
   2. `supabase/migrations/0002_reference_dictionnaire.sql`
   3. `supabase/migrations/0003_restreindre_fonctions_rls.sql`
   4. `supabase/migrations/0004_definitions.sql`
   5. `supabase/migrations/0005_sources_externes.sql`
   6. `supabase/seed.sql` (803 signes : alphabet, chiffres et nombres, ~740 signes courants, 477 liens vers « Mon dictionnaire LSQ »)
2. **Supabase Auth** — *URL Configuration* : Site URL = URL Vercel de production ; Redirect URLs :
   l'URL de production et celle des previews (`https://*-<compte>.vercel.app/**`).
   *Email Templates → Magic Link* : ajouter `{{ .Token }}` au message (code à 6 chiffres).
3. **Vercel** — importer le dépôt, ajouter les variables de `.env.example`
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`), déployer.
4. Ouvrir `/tournage`, se connecter, remplir profil + consentement, filmer.
5. `/parler` (signe → voix) : filmer chaque signe 5 fois en cochant la portée « reconnaissance » du consentement. Nécessite `SUPABASE_SECRET_KEY` dans Vercel.

Pour donner le rôle de validateur·rice :
`update public.signeurs set role = 'validateur' where id = '<uuid>';`

## Scripts

| Commande | Rôle |
|---|---|
| `pnpm build` | build de production (ce que lance Vercel) |
| `pnpm type-check` / `pnpm lint` | vérifications avant de pousser |
| `pnpm seed:sql` | régénère `supabase/seed.sql` et `lib/categories.ts` depuis `data/signes-depart.json` |
