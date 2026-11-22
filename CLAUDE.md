# Entre-Mains — constitution du projet

Application temps réel **français ↔ langue des signes québécoise (LSQ)**.
Ce fichier est la référence pour toute personne (ou tout agent) qui travaille sur le code.
En cas de doute, ce document l'emporte sur les habitudes et les suppositions.

---

## 1. Mission et principes non négociables

1. **Rien sur nous sans nous.** Les personnes sourdes sont les autrices de la bibliothèque de signes
   et les juges de la qualité. Aucune décision linguistique (ordre des signes, choix d'une variante,
   validation d'une vidéo) n'est prise par le code ou par l'IA seule.
2. **La LSQ est une langue, pas du français signé.** Elle a sa grammaire (espace, expressions du
   visage, ordre temps-thème-commentaire, etc.). L'application produit une *aide* à la communication,
   pas une interprétation certifiée. L'interface le dit clairement et ne remplace jamais un·e
   interprète professionnel·le pour un contexte médical, juridique ou critique.
3. **On n'invente jamais un signe.** Le direct n'utilise **que** des signes filmés par des personnes
   sourdes et validés. Un mot sans signe validé est **épelé** (dactylologie LSQ) avec les vidéos de
   l'alphabet, ou signalé comme absent. Pas de signe généré, pas d'avatar inventé, pas de « signe
   probable ».
4. **Consentement écrit, éclairé, révocable.** Chaque vidéo est rattachée à un consentement signé
   (texte versionné conservé tel quel). La révocation retire immédiatement les vidéos du lexique.
   Les vidéos montrent des visages : ce sont des données personnelles sensibles (Loi 25, Québec).
5. **Visuel d'abord.** Les utilisateur·rice·s principaux·ales sont sourd·e·s : aucune information ne
   passe uniquement par le son ; textes courts, grands boutons, états visibles (couleurs + icônes +
   texte), compte à rebours visuel.
6. **Transparence.** Quand le système épelle, saute un mot ou hésite, ça se voit à l'écran
   (gloses affichées sous la vidéo, mots épelés marqués).

---

## 2. Feuille de route

| Étape | Contenu | État |
|---|---|---|
| **1a** | Constitution (ce fichier), squelette Next.js, schéma Supabase, liste de départ (~500 signes + alphabet + chiffres) | ✅ |
| **1b** | Page de tournage `/tournage` : consentement écrit, webcam, enregistrement vidéo + positions mains/visage/corps, envoi Supabase | ✅ |
| 1b+ | Liens « Mon dictionnaire LSQ » par signe (migration `0002`), liste portée à 803 signes (nombres 11–1000, temps habituels…) | ✅ |
| 1c | Validation des vidéos par des validateur·rice·s sourd·e·s (`/admin`) | à faire |
| 1d | Direct `/direct` : micro → Gladia (texte FR) → Claude (gloses LSQ, lexique filmé uniquement) → lecture enchaînée + épellation | à faire |
| 1e | Mode conversation sur téléphone `/conversation` (écran partagé face à face) | à faire |
| 2 | LSQ → français : caméra, reconnaissance de l'alphabet puis de signes isolés, entraînée sur les positions enregistrées | plus tard |
| 3 | Avatar 3D animé à partir des positions enregistrées | plus tard |

Les positions (landmarks) sont enregistrées **dès l'étape 1** parce que les étapes 2 et 3 en dépendent.

---

## 3. Déploiement : Vercel + Supabase, pas de local

- **Hébergement :** Vercel (projet relié au dépôt GitHub). Chaque push sur une branche crée un
  *preview deployment* : c'est là qu'on teste. `main` = production.
- **Données :** Supabase (Postgres + Auth + Storage). Les migrations SQL sont dans
  `supabase/migrations/` et s'appliquent via l'éditeur SQL de Supabase (ou le MCP Supabase),
  **dans l'ordre des numéros**. La liste de départ s'insère avec `supabase/seed.sql`.
- **Pas de développement local obligatoire.** Le critère « ça marche » est : `pnpm build` passe
  (Vercel le lance) et la fonctionnalité est vérifiée sur le preview. Avant de pousser, lancer
  au minimum `pnpm type-check` et `pnpm build`.
- La caméra et le micro exigent **HTTPS** : les previews Vercel le fournissent.

### Variables d'environnement (Vercel → Settings → Environment Variables)

| Variable | Côté | Usage |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | public | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | public | clé publique (anon / publishable) |
| `SUPABASE_SECRET_KEY` | serveur | clé secrète (service role) — routes serveur uniquement, jamais dans le navigateur |
| `GLADIA_API_KEY` | serveur | transcription temps réel (étape 1d) |
| `ANTHROPIC_API_KEY` | serveur | remise en ordre LSQ (étape 1d) |
| `CLAUDE_MODEL` | serveur | facultatif, défaut `claude-opus-5-5` |

Les clés secrètes ne sont **jamais** préfixées `NEXT_PUBLIC_`, jamais commitées, jamais loguées.
`.env.example` liste les noms, sans valeurs.

### Réglages Supabase à faire une fois
- Auth → URL Configuration : *Site URL* = URL de production Vercel ; *Redirect URLs* :
  `https://*-<compte>.vercel.app/**` et l'URL de production.
- Auth → Email Templates → *Magic Link* : ajouter `{{ .Token }}` dans le message pour que la
  personne puisse saisir le **code à 6 chiffres** (utile quand le courriel est ouvert sur un autre
  appareil que celui qui filme).
- Les buckets et politiques de stockage sont créés par la migration `0001`.

---

## 4. Stack technique

- **Next.js 16** (App Router, React 19, TypeScript strict), **Tailwind CSS 4**, gestionnaire **pnpm**.
  - En Next 16, le middleware s'appelle `proxy.ts` (fonction `proxy`).
- **Supabase** via `@supabase/ssr` (cookies) : `lib/supabase/client.ts` (navigateur),
  `lib/supabase/server.ts` (composants serveur / route handlers), `lib/supabase/admin.ts`
  (clé secrète, serveur seulement).
- **MediaPipe Tasks Vision** (`@mediapipe/tasks-vision`, `HolisticLandmarker`) dans le navigateur
  pour les positions corps (33) + mains (2 × 21) + visage (478). Le WASM est copié depuis
  `node_modules` vers `public/mediapipe/wasm` au `postinstall` (même version garantie, pas de CDN
  tiers) ; le modèle `.task` est chargé depuis `storage.googleapis.com/mediapipe-models`.
- **Gladia** (API live v2) pour la transcription française en continu : le serveur crée la session
  (`POST https://api.gladia.io/v2/live` avec la clé), le navigateur ne reçoit que l'URL WebSocket
  temporaire et y envoie l'audio PCM 16 kHz.
- **Claude** (`@anthropic-ai/sdk`) côté serveur uniquement, modèle `CLAUDE_MODEL`
  (défaut `claude-opus-5-5`, `effort: "low"` pour la latence), sortie structurée JSON
  (`output_config.format`). Pas de préremplissage assistant, pas de `budget_tokens`.

---

## 5. Arborescence

```
app/
  layout.tsx, page.tsx, globals.css
  connexion/            connexion par courriel (lien magique ou code à 6 chiffres)
  auth/callback/        échange du code de connexion
  tournage/             bibliothèque : choix du signe + studio de tournage
    consentement/       consentement écrit (obligatoire avant de filmer)
  direct/               (1d) micro → gloses → vidéos
  conversation/         (1e) mode téléphone face à face
  admin/                (1c) validation des vidéos
  api/                  route handlers (Gladia, Claude…)
components/             composants UI partagés
lib/
  supabase/             clients Supabase
  mediapipe/            chargement du HolisticLandmarker, compactage des positions
  consentement.ts       texte du consentement versionné (source de vérité)
  types.ts              types du domaine
data/signes-depart.json liste de départ (source de vérité, éditée à la main)
scripts/generer-seed.mjs  data/signes-depart.json → supabase/seed.sql
supabase/migrations/    schéma SQL numéroté
supabase/seed.sql       généré, ne pas éditer à la main
proxy.ts                rafraîchissement de session Supabase + protection des routes
```

---

## 6. Modèle de données (Supabase)

- **`signes`** — catalogue des concepts à filmer.
  `id`, `glose` (unique, MAJUSCULES : `MAISON`, `LETTRE-A`, `CHIFFRE-3`), `mots_fr text[]`
  (formes françaises qui mènent à ce signe : `{maison, domicile}`), `categorie`,
  `type` (`signe` | `lettre` | `chiffre`), `priorite` (1 = le plus courant), `notes`,
  `reference_url` (lien vers la page du mot dans un dictionnaire LSQ externe, voir §6bis).
- **`signeurs`** — profil de chaque contributeur·rice (`id` = `auth.users.id`) :
  `nom_affiche`, `identite` (sourd·e, malentendant·e, CODA, interprète…), `region`,
  `main_dominante` (`droite` | `gauche`), `role` (`contributeur` | `validateur` | `admin`).
- **`consentements`** — un par signature : `version`, `texte` (copie intégrale signée),
  `nom_signature`, `portee_*` (booléens par usage), `signe_le`, `revoque_le`.
- **`enregistrements`** — une prise vidéo : `signe_id`, `signeur_id`, `consentement_id`,
  `video_path`, `positions_path`, `mime`, `duree_ms`, `largeur`, `hauteur`, `fps`,
  `debut_ms` / `fin_ms` (rognage suggéré : du premier au dernier instant où une main est visible),
  `main_dominante`, `variante` (régionale, facultatif), `commentaire`,
  `statut` (`en_attente` | `valide` | `rejete`), `valide_par`, `valide_le`.
- **Vue `lexique`** — signes ayant au moins un enregistrement `valide` dont le consentement n'est
  pas révoqué. **C'est la seule source de vocabulaire que Claude a le droit d'utiliser.**

Plusieurs enregistrements par signe sont encouragés (variantes, plusieurs signeur·euse·s) : c'est
aussi ce dont la reconnaissance (étape 2) aura besoin.

### Stockage
- Bucket privé **`videos-signes`** : `{signeur_id}/{glose}/{enregistrement_id}.mp4|webm`.
- Bucket privé **`positions-signes`** : `{signeur_id}/{glose}/{enregistrement_id}.json.gz`.
- Lecture via **URL signées** générées côté serveur. Écriture : chaque personne seulement dans
  son dossier `{auth.uid()}/…`, et seulement si elle a un consentement actif (RLS).

### Format des positions (`positions-signes`, version 1)
JSON compressé gzip :
```json
{
  "version": 1,
  "modele": "mediapipe-holistic/tasks-vision@1.2.3",
  "largeur": 1280, "hauteur": 720,
  "miroir": false,
  "frames": [
    { "t": 0, "corps": [[x,y,z,v], …33] | null,
      "main_g": [[x,y,z], …21] | null, "main_d": [[x,y,z], …21] | null,
      "visage": [[x,y,z], …478] | null }
  ]
}
```
- Coordonnées normalisées (0–1) dans l'image **non miroir** (la vidéo enregistrée n'est pas
  inversée ; seul l'aperçu à l'écran l'est). `main_g` / `main_d` = `leftHandLandmarks` /
  `rightHandLandmarks` tels que fournis par MediaPipe. `t` = ms depuis le début de la vidéo.
- Arrondi à 4 décimales. Toute évolution du format incrémente `version`.

### 6bis. Sources externes (dictionnaires LSQ)
- **« Mon dictionnaire LSQ »** (https://lsq-fr.ca), porté par l'AQEPA, l'UQAR et Multi Groupe
  Conseil. Ses mentions légales : tout le contenu (vidéos LSQ, textes, traductions des
  définitions) appartient à l'AQEPA ; les définitions empruntées (USITO, TLFi, GDT) exigent
  l'autorisation de leurs titulaires.
- **Ce qu'on en fait :** un **lien** par signe (`reference_url`) pour vérifier le sens du mot, et
  la comparaison de sa liste de mots-vedettes avec la nôtre pour repérer des concepts manquants
  (nos entrées restent rédigées par nous). Les liens sont des suggestions automatiques (comparaison
  des formes françaises) : à corriger quand ils pointent vers le mauvais sens.
- **Ce qu'on n'en fait pas :** copier ses vidéos, ses définitions ou ses traductions, ou les
  montrer dans le direct. Ses signeur·euse·s n'ont pas consenti à Entre-Mains (§1.3, §1.4).
- **Piste :** un partenariat avec l'AQEPA (info@aqepa.org) — liste de mots, contacts dans la
  communauté sourde, éventuellement leurs vidéos avec licence et consentement des signeur·euse·s.
  Utiliser des vidéos externes exigerait de modifier cette constitution et le schéma (source,
  licence, consentement) : décision à prendre explicitement, pas par défaut.

---

## 7. Gloses LSQ : conventions

- Une glose = un identifiant de signe en MAJUSCULES ASCII sans accents, mots composés reliés
  par `-` : `POMME-DE-TERRE`, `QUOI`, `HIER`.
- Épellation : `DACTYLO:MONTREAL` → lecture lettre par lettre de `LETTRE-M`, `LETTRE-O`, …
  (accents retirés pour l'épellation).
- Nombres : `CHIFFRE-0` … `CHIFFRE-9` ; au-delà, composition chiffre par chiffre tant qu'il n'y a
  pas de signe filmé dédié.
- Les gloses servent d'**identifiants techniques** ; ce n'est pas une transcription linguistique
  complète de la LSQ (pas de notation des expressions faciales, de l'espace, etc.).

## 8. Règles pour Claude (remise en ordre français → gloses)

Le prompt système vit dans `lib/lsq/prompt.ts` (étape 1d). Il impose :
1. N'utiliser **que** les gloses du lexique fourni dans la requête (liste issue de la vue `lexique`).
   Tout autre mot → `DACTYLO:MOT` (noms propres, mots sans signe) ou omission s'il s'agit d'un mot
   grammatical sans équivalent signé (articles, copule « être », certaines prépositions).
2. Ordre LSQ habituel : repère de **temps** d'abord, puis **thème/lieu**, puis commentaire/action ;
   mots interrogatifs (QUOI, OÙ, QUI…) en fin d'énoncé ; négation après le verbe.
   *Ces règles sont des approximations à faire valider et corriger par des linguistes et
   locuteur·rice·s sourd·e·s ; elles évolueront avec leurs retours.*
3. Sortie JSON stricte : `{ "gloses": string[], "epeles": string[], "remarques"?: string }`.
   Le serveur **revalide** chaque glose contre le lexique et remplace toute glose inconnue par
   de l'épellation : on ne fait jamais confiance aveuglément à la sortie du modèle.
4. Latence : une phrase finale Gladia = un appel. Texte du lexique en tête du prompt pour profiter
   du cache de prompt.

---

## 9. Conventions de code

- **Langue :** interface 100 % français (québécois). Noms du domaine en français dans le code et la
  base (`signe`, `enregistrement`, `glose`, `consentement`) ; vocabulaire technique standard en
  anglais accepté (`fetch`, `stream`, `props`).
- TypeScript strict, pas de `any` non justifié. Validation des entrées serveur avec `zod`.
- Composants serveur par défaut ; `"use client"` seulement si nécessaire (caméra, micro, état).
- Accès aux données : la sécurité repose sur **RLS** Supabase, pas seulement sur le code.
  Toute nouvelle table a RLS activé et des politiques explicites dans sa migration.
- La clé secrète Supabase n'est utilisée que dans `lib/supabase/admin.ts`, importé uniquement
  depuis du code serveur (`import "server-only"`).
- Migrations : nouveau fichier numéroté, jamais modifier une migration déjà appliquée.
- Liste de signes : éditer `data/signes-depart.json` puis `pnpm seed:sql` (le seed fait un
  *upsert* sur `glose`, il peut être relancé).
- Accessibilité : contraste AA, cibles tactiles ≥ 44 px, focus visible, `aria-live` pour les états,
  aucune alerte uniquement sonore.
- Commits en français, courts, à l'impératif.

## 10. Vie privée et consentement

- Texte du consentement : `lib/consentement.ts`, constante `CONSENTEMENT_VERSION`. Changer le texte
  = nouvelle version ; les personnes déjà inscrites doivent re-signer pour continuer à filmer.
- Portées séparées (cases distinctes, aucune précochée) : (1) utilisation des vidéos dans
  l'application pour traduire — obligatoire pour filmer ; (2) utilisation des positions pour
  entraîner la reconnaissance (étape 2) ; (3) utilisation pour un avatar 3D (étape 3) ;
  (4) crédit public du nom.
- 14 ans et plus seulement (en deçà, consentement parental requis — non géré pour l'instant).
- Révocation en un clic depuis `/tournage/consentement` : les vidéos sortent du lexique
  immédiatement ; la suppression physique des fichiers est faite sur demande (à automatiser).
- **À faire valider par un·e juriste** avant l'ouverture publique : application de la Loi 25 aux
  vidéos et aux positions du visage (données biométriques ?), déclaration éventuelle à la CAI,
  durée de conservation, hébergement des données (région Supabase : choisir le Canada si possible).
- **À produire avec la communauté :** une version **vidéo LSQ** du consentement, affichée à côté du
  texte.

## 11. Ce qu'on ne fait pas

- Pas de synthèse/génération de signes, pas de traduction « devinée » d'un mot non filmé.
- Pas de vidéos publiques sans URL signée ; pas de clé secrète côté client.
- Pas de dépendance ajoutée sans raison claire ; versions épinglées.
- Pas de collecte de données non nécessaires (pas d'IP, pas de pistage publicitaire).
