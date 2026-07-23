---
format: 1920x1080
duration: 35s
message: "Récupérez les plages perdues de votre agenda — et vos fins de journée."
arc: "PAS — hook (stat de douleur) → solution tease (Smart Waitlist) → preuve produit (Scribe, Suivi) → CTA"
audience: "Propriétaires et gestionnaires de cliniques dentaires au Québec"
mode: autonomous
music: soft-corporate-underscore
---

## Video direction

- **Palette** (from `frame.md`, blue-professional remixed on SmileFlow violet) — canvas `bg` (#FFFFFF) throughout, never a dark frame; `text` (ink, #1A1A2E) for headlines/body; `primary` (violet #5B3DF5) as the SOLE accent — numbers, buttons, checkmarks, cursors, glows, underlines; tinted `card-bg`/`accent-light`/`accent-medium`/`border` (violet at 4–20%) for panels and mockup chrome; `positive` (#059669) reserved for success checkmarks/state flips only.
- **Motion grammar** — long-tail `power3` settles everywhere; no bounce/elastic/overshoot except a single controlled spring-pop on a confirmation checkmark (frames 2 & 3). Every frame reveals piece-by-piece **on its spoken cue** — nothing dumped in the first 25%; each Scene below is timed to the VO line it sits under.
- **Held / breather allocation** — Frame 1 opens on a deliberate quiet hold (the empty agenda, before the stat lands) so the cold open reads as stillness-before-a-number, not noise. Frame 5 ends held fully static (CTA line legible on a stopped frame) — this is the mandatory last-frame hold for muted LinkedIn autoplay. Frames 2–4 stay in continuous motion — they ARE the demonstration.
- **Negative list** — no dark/black canvases (this pack is light-only); no real browser chrome, real cursors, or stock screenshots — every UI is an invented on-brand mockup; no infinite/looping motion; nothing enters below the caption band (bottom ~17%); avoid both failure modes — slideshow (front-load-then-freeze) and screensaver (elements floating independently with no causal link).

## Frame 1 — Le trou dans l'agenda

- status: animated
- src: compositions/frames/01-agenda.html
- duration: 4.395s
- transition_in: cut
- scene: Agenda dentaire figé sur une plage libre ; salle d'attente vide en fond
- voiceover: "Une annulation de dernière minute... c'est 325 dollars qui partent."
- blueprint: dataviz-countup (Adapt, Hook variant)
- focal: Simulated agenda/waiting-room scene (invented, CSS/HTML only)
- roles: agenda/waiting-room scene = cutout
- sfx: none

Ouverture froide sur la douleur : un rendez-vous annulé, une plage d'hygiène
vide dans l'agenda, salle d'attente déserte. Le montant (325$) est le seul
repère chiffré — pas encore de produit à l'écran. Petit sous-titre discret
en coin : "fonctionne avec Progident et Dentitek" pour planter que SmileFlow
se pose à côté du PMS existant, sans être le sujet du frame.

Adapt: keep the count-up + transform-scale-grow signature on the stat; drop
the icon-cluster spread (no product to represent yet) for a single locked
establishing shot — no fling-outward, one focal stat instead.

Scene 1 (0.0–1.6s): agenda column, upper-third, centered — one row highlighted
empty (a canceled slot, dashed outline); waiting-room chairs blurred deep
background, layered-depth ~30% dim. Camera static. Deliberate quiet hold —
nothing else on screen yet (VO: "Une annulation de dernière minute...").
Scene 2 (1.6–3.0s): "325 $" COUNTS UP 0→325 dead-center over the agenda row,
transform-scale growing with the value (signature move); a soft violet
`accent-light` glow blooms behind it on the same ease (VO: "...c'est 325
dollars qui partent").
Scene 3 (3.0–4.395s): number settles at final size; small ink label "plage
d'hygiène perdue" fades up beneath it; slow camera lean-in (gentle push, not
push-through) to the held final read. Small `text-light` sub-title
bottom-left — "Fonctionne avec Progident et Dentitek" — fades up last, held
to the cut, top ~83% respected throughout.

## Frame 2 — Smart Waitlist comble le trou

- status: animated
- src: compositions/frames/02-waitlist.html
- duration: 9.088s
- transition_in: crossfade
- scene: Écran mobile — notification "Annulation détectée" → SMS envoyé → réponse "Marie Tremblay a répondu OUI"
- voiceover: "Annulation détectée. SmileFlow texte aussitôt les bons patients en attente... Marie Tremblay répond oui. Comblé en quatre minutes — sans un seul appel."
- blueprint: agent-progress-theater (Adapt, message-thread-payoff variant)
- focal: SMS thread mockup UI (invented, CSS/HTML only)
- roles: SMS thread mockup UI = cutout
- sfx: notification, chime

Séquence d'écran en 3 temps, réponses données par la voix off au fur et à
mesure (pas de wall of text) : (1) alerte "Annulation détectée" sur
l'agenda, (2) fil SMS qui s'anime avec l'envoi automatique, (3) réponse
"Marie Tremblay a répondu OUI" et confirmation du créneau comblé. Le chiffre
"4 min" et "sans appel" sont le closer du beat — la preuve, pas une
promesse.

Adapt: keep the "pulsing dots die the instant the result lands" mechanic and
the camera-push-in-on-confirmation signature; there is no click/menu trigger
here (the system fires itself) — no cursor appears anywhere in this frame.

Scene 1 (0.0–2.0s): a locked phone-frame mockup, centered, ~45% of canvas; an
"Annulation détectée" alert pill springs onto its top edge (spring-pop,
controlled — no overshoot) as the VO names it.
Scene 2 (2.0–5.0s): the SMS thread view slides up beneath the alert; an
outgoing bubble types on character-by-character ("Une place vient de se
libérer — ça vous intéresse?"), three pulsing dots follow as it "sends" (VO:
"SmileFlow texte aussitôt les bons patients en attente").
Scene 3 (5.0–7.2s): the pulsing dots vanish the instant the reply lands — an
incoming bubble spring-pops in, "Marie Tremblay — OUI 👍", with a small
avatar chip (VO names her).
Scene 4 (7.2–9.088s): camera pushes in tight on a confirmation card that
cascades in beneath the thread — "Comblé en 4 min" (violet, bold) + a
"Sans appel" line whose badge flips outline→solid `positive` check with a
slight scale bounce (the one sanctioned spring-pop of this frame); holds to
the cut.

## Frame 3 — Le Scribe rédige la note

- status: animated
- src: compositions/frames/03-scribe.html
- duration: 8.533s
- transition_in: crossfade
- scene: Note SOAP qui s'écrit à l'écran section par section, puis bouton "Valider et signer"
- voiceover: "Pendant la consultation, SmileFlow rédige un brouillon de note — Subjectif, Objectif, Analyse, Plan. Vous relisez. Vous signez. C'est tout."
- blueprint: agent-progress-theater (Adapt, checklist variant)
- focal: SOAP note draft mockup UI (invented, CSS/HTML only)
- roles: SOAP note draft mockup UI = cutout
- sfx: typing, chime

La note SOAP s'écrit en direct à l'écran, un bloc (S / O / A / P) à la fois,
au rythme des mots de la voix off. Le clic de validation/signature ferme le
beat — un geste, pas un formulaire. Réassurance discrète en petit texte
("toujours relu et signé par le dentiste") accolée au bouton de signature —
jamais un bloc légal qui casse le rythme.

Adapt: keep the rows-cascade-then-mutate-to-checked signature; the trigger is
the consult ending (no click/menu), and the payoff card IS the SOAP note
itself, not a findings list — 4 rows, not N.

Scene 1 (0.0–1.3s): a working-state pill "SmileFlow rédige…" with a violet
arc spinner, over a blank note card, centered ~50% of canvas (VO: "Pendant la
consultation, SmileFlow rédige un brouillon de note —").
Scene 2 (1.3–5.5s): four labeled rows cascade in one by one, staggered
slide-up + fade — S / O / A / P — each row's label types on then its content
line fills in as the VO names them ("Subjectif, Objectif, Analyse, Plan").
Scene 3 (5.5–7.2s): VO "Vous relisez" — rows hold, a soft `accent-light`
highlight sweeps top-to-bottom once across the four rows (a read-through
cue; no new content, no camera move).
Scene 4 (7.2–8.533s): VO "Vous signez. C'est tout." — a "Valider et signer"
pill gets a tactile press (compress then spring release), flips outline→solid
`positive` check; small `text-light` microcopy "Toujours relu et signé par le
dentiste" fades in beside it and holds to the cut.

## Frame 4 — Le suivi se fait tout seul

- status: animated
- src: compositions/frames/04-suivi.html
- duration: 6.677s
- transition_in: crossfade
- scene: Note validée → courriel de suivi patient généré → invitation avis Google
- voiceover: "Une fois la note validée, SmileFlow envoie un suivi au patient — et l'invite à laisser un avis Google."
- blueprint: grid-card-assemble (Adapt, item-field-to-payoff variant)
- focal: Patient follow-up email mockup UI (invented, CSS/HTML only)
- roles: Patient follow-up email mockup UI = cutout; Google review invite mockup UI = supporting
- sfx: none

Enchaînement rapide, cause → effet : la signature du frame 3 déclenche
visuellement ce beat (même geste qui continue son mouvement). Courriel qui
se compose, puis carte d'invitation à l'avis Google qui apparaît en second
temps — deux preuves, pas une leçon.

Adapt: only 2 cards, not a dense grid — a 2-item cause→effect cascade, not
breadth enumeration; keep the low-drama staggered-slide-into-slot signature.

Scene 1 (0.0–1.0s): frame 3's green checkmark (still visible top-of-frame at
entry, carried by the crossfade) shrinks and docks to a small corner badge —
the causal link between the two frames.
Scene 2 (1.0–3.6s): an email card slides + fades into its slot, upper area,
low drama; subject line types on — "Merci pour votre visite" (VO: "Une fois
la note validée, SmileFlow envoie un suivi au patient").
Scene 3 (3.6–6.677s): a second card cascades in beneath it — a Google-review
invite with a 5-star row whose stars fill left→right on one beat (VO: "et
l'invite à laisser un avis Google"); both cards hold, settled, to the cut.

## Frame 5 — SmileFlow

- status: animated
- src: compositions/frames/05-cta.html
- duration: 6.741s
- transition_in: crossfade
- scene: Logo/wordmark SmileFlow, tagline, CTA "Essai gratuit — smileflow.ca"
- voiceover: "Récupérez les plages perdues de votre agenda — et vos fins de journée. Essai gratuit. SmileFlow point c a."
- blueprint: logo-assemble-lockup (Adapt, settled-lockup-reveal + cta-button-wordmark-build)
- focal: SmileFlow wordmark (text logo, no image file — built as styled text in HTML)
- roles: SmileFlow wordmark = cutout
- sfx: whoosh-short

Clôture calme : le wordmark se pose, la tagline s'assemble mot à mot, le CTA
arrive en dernier et reste à l'écran (dernière frame tenue pour la lecture
en muet). Aucune nouvelle information — seulement la conclusion de ce qui
vient d'être montré.

Adapt: combine the null-assembly settle (mark present, no predecessor beat)
with the CTA button's glowing-outline-draw; drop the multi-beat orbit/parts
build (too long for 6.7s) for one continuous 3-beat settle.

Scene 1 (0.0–1.8s): "SmileFlow" wordmark spring-blooms from zero, dead-center,
violet on white (controlled settle, no overshoot); a thin `primary` accent
underline sweeps in beneath it, left→right.
Scene 2 (1.8–4.4s): wordmark slides up slightly to make room; the tagline
types/wipes in word-by-word beneath it as the VO speaks it — "Récupérez les
plages perdues de votre agenda — et vos fins de journée."
Scene 3 (4.4–6.741s): a CTA pill — "Essai gratuit — smileflow.ca" — rises
into place beneath the tagline; its border DRAWS ON as a glowing violet
outline stroke. Everything holds fully static to the end — the mandatory
last-frame hold for a muted LinkedIn read.
