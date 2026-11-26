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
   6. `supabase/migrations/0006_validation.sql`
   7. `supabase/migrations/0007_consentement_commercial.sql`
   8. `supabase/seed.sql` (803 signes : alphabet, chiffres et nombres, ~740 signes courants, 477 liens vers « Mon dictionnaire LSQ »)
2. **Supabase Auth** — *URL Configuration* : Site URL = URL Vercel de production ; Redirect URLs :
   l'URL de production et celle des previews (`https://*-<compte>.vercel.app/**`).
   *Email Templates → Magic Link* : ajouter `{{ .Token }}` au message (code à 6 chiffres).
3. **Vercel** — importer le dépôt, ajouter les variables de `.env.example`
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`), déployer.
4. Ouvrir `/tournage`, se connecter, remplir profil + consentement, filmer.
5. `/direct` (français → LSQ) : ajouter `GLADIA_API_KEY` (micro → texte) et `ANTHROPIC_API_KEY` (remise en ordre) dans Vercel. Sans eux, la saisie au clavier marche quand même : les mots sont épelés.
6. `/parler` (signe → voix) : filmer chaque signe 5 fois en cochant la portée « reconnaissance » du consentement. Nécessite `SUPABASE_SECRET_KEY` dans Vercel.

Pour donner le rôle de validateur·rice :
`update public.signeurs set role = 'validateur' where id = '<uuid>';`

## Scripts

| Commande | Rôle |
|---|---|
| `pnpm build` | build de production (ce que lance Vercel) |
| `pnpm type-check` / `pnpm lint` | vérifications avant de pousser |
| `pnpm seed:sql` | régénère `supabase/seed.sql` et `lib/categories.ts` depuis `data/signes-depart.json` |
| `pnpm smoke:roboflow [image]` | test de fumée du workflow Roboflow (exige `ROBOFLOW_API_KEY`) |

## Roboflow (pilote, serveur uniquement)

Workflow **« LSQ — Mains, visage et signes Logic »** (`smiles-workspace-wudvp/lsq-mains-visage-et-signes-logic`) :
une entrée `image`, aucun paramètre, une sortie `predictions` (région des mains, visage, signes connus du
modèle `lsq-mains-visage-et-signes/4`, classes `main_active` et `visage`).

- **Clé** : `ROBOFLOW_API_KEY` = la clé **privée** (app.roboflow.com → Settings → API Keys ; une clé
  « publishable » `rf_…` est refusée par l'inférence serverless). Dans Vercel, côté serveur, jamais `NEXT_PUBLIC_`.
- **Code** : `lib/roboflow/workflow.ts` → `detecterMainsVisageEtSignes(image)` (URL `https://` ou base64)
  et `detecterMainsVisageEtSignesLot(images)` (8 images par requête, 2 requêtes en parallèle, résultats dans l'ordre).
  Options : `confianceMin` (0–1), `cache: false`, `delaiMs`, `dossierImages`. Résultat indexé par les noms de sortie.
- **Optimisations** : cache en mémoire (15 min, 256 images, clé = empreinte SHA-256 ; seules les détections sont gardées,
  jamais l'image), appels simultanés sur la même image fusionnés, doublons d'un lot envoyés une fois.
  Délai de 30 s par requête, 2 nouvelles tentatives (réseau, 429, 5xx) avec attente aléatoire, `Retry-After` respecté
  (plafond 10 s). Erreurs typées `ErreurRoboflow` (`configuration`, `entree`, `reseau`, `http`, `reponse`).
- **Test** : `ROBOFLOW_API_KEY=… pnpm smoke:roboflow` (mire générée par défaut, ou un chemin d'image) : vérifie aussi le cache, un lot et le seuil.
  Dans un environnement cloud dont le proxy injecte la clé : `NODE_USE_ENV_PROXY=1 ROBOFLOW_API_KEY=proxy-injected pnpm smoke:roboflow`.
- **Vie privée** : les images partent chez Roboflow (hors Canada). Seulement des images dont le consentement
  ou l'accord couvre la reconnaissance — jamais la caméra de « Signer → voix » (voir `CLAUDE.md` §8ter).
