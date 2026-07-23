# Frame packet: 03-scribe

## Project inputs

- Project: /home/user/vibe-coding-platform/videos/smileflow-demo
- Design tokens: /home/user/vibe-coding-platform/videos/smileflow-demo/frame.md
- RULES_DIR: /home/user/vibe-coding-platform/.agents/skills/hyperframes-animation/rules

## Assigned storyboard block

## Frame 3 — Le Scribe rédige la note

- status: outline
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
