# SmileFlow — vidéo promotionnelle (Remotion)

Film produit de 60 s (1800 frames @ 30 fps), esthétique sombre haut de gamme,
dominante violet électrique. Rendu en 1920×1080 et 1080×1920.

## Structure

```
remotion/
  index.ts                    point d'entrée (registerRoot)
  Root.tsx                    enregistrement des deux compositions
components/video/
  SmileFlowPromoVideo.tsx     composition principale — orchestre les 5 séquences
  theme.ts                    couleurs, échelle typographique, découpage temporel
  motion.ts                   primitives d'animation (springs, reveals, ramps)
  fonts.ts                    chargement local d'Inter (400→900)
  useLayout.ts                bascule paysage / portrait
  ui/                         Backdrop, Type, Card, Logo
  scenes/                     une séquence par fichier
remotion.config.ts            réglages CLI (codec, CRF, format d'image)
public/fonts/                 Inter en .woff2 — chargé localement, jamais via CDN
```

## Découpage

| # | Séquence | Frames | Temps |
|---|----------|--------|-------|
| 1 | Le manifeste humain | 0–300 | 0–10 s |
| 2 | Scribe clinique IA & radios | 300–660 | 10–22 s |
| 3 | Smart Waitlist SMS | 660–1020 | 22–34 s |
| 4 | Réputation Google & dossiers | 1020–1380 | 34–46 s |
| 5 | Loi 25 & appel à l'action | 1380–1800 | 46–60 s |

Les séquences se chevauchent de 15 frames (`OVERLAP`), si bien que les repères
ci-dessus tombent au milieu de chaque fondu enchaîné. Le fond sombre et ses
halos violets vivent au niveau racine et tournent sans interruption sur les
60 s : seul le contenu des scènes change, ce qui fait lire les cinq temps
comme un seul film plutôt que comme cinq arrière-plans successifs.

## Commandes

```bash
npm run video:studio            # éditeur Remotion (prévisualisation, timeline)
npm run video:render            # → out/smileflow-promo-1920x1080.mp4
npm run video:render:vertical   # → out/smileflow-promo-1080x1920.mp4
```

Commande de rendu complète :

```bash
npx remotion render remotion/index.ts SmileFlowPromo out/smileflow-promo-1920x1080.mp4
```

### Environnement sans accès au CDN de Remotion

Remotion télécharge son propre Chrome Headless Shell au premier rendu. Si cet
hôte est bloqué par la politique réseau, pointer vers un binaire déjà présent :

```bash
npx remotion render remotion/index.ts SmileFlowPromo out/smileflow-promo-1920x1080.mp4 \
  --browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
```

## Parti pris techniques

- **Styles en ligne plutôt que Tailwind.** Sur un canevas fixe de 1920×1080,
  les utilitaires responsives de Tailwind ne veulent rien dire, et l'essentiel
  des propriétés ici change à chaque frame (`opacity: 0.4237`,
  `blur(6.8px)`) — ce qu'une classe utilitaire ne peut pas exprimer. Les
  jetons de design sont centralisés dans `theme.ts`.
- **Tout est fonction pure de la frame.** Remotion rend les frames dans le
  désordre et en parallèle : le moindre `Math.random()` ou `Date.now()`
  déchirerait la vidéo. Le bruit du waveform passe par `hashNoise(index)`.
- **Ressorts fortement amortis.** `damping: 200` par défaut — ça se pose sans
  rebond. Le seul dépassement autorisé (`POP`) est réservé aux confirmations.
- **Polices chargées localement.** Un webfont manqué retombe silencieusement
  sur une police système et ruine la typographie dans le MP4 ; ici le rendu
  échoue franchement si les fichiers manquent.
- **Capture en PNG.** Le sous-échantillonnage chromatique du JPEG marbre
  visiblement les dégradés violets sur fond quasi noir.

## Variante verticale

Les deux compositions utilisent le **même** composant. Les scènes lisent le
canevas via `useLayout()` et se réorganisent (colonnes côte à côte → empilées,
échelle typographique réduite) ; la version 9:16 n'est donc pas un recadrage
avec bandes noires du master 16:9. La séquence 3 masque sa troisième colonne
en portrait : à 1080 px de large, trois colonnes écraseraient les deux autres.
