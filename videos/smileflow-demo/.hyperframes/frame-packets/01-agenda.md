# Frame packet: 01-agenda

## Project inputs

- Project: /home/user/vibe-coding-platform/videos/smileflow-demo
- Design tokens: /home/user/vibe-coding-platform/videos/smileflow-demo/frame.md
- RULES_DIR: /home/user/vibe-coding-platform/.agents/skills/hyperframes-animation/rules

## Assigned storyboard block

## Frame 1 — Le trou dans l'agenda

- status: outline
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
