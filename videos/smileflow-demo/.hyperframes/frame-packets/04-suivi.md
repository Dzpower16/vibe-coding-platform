# Frame packet: 04-suivi

## Project inputs

- Project: /home/user/vibe-coding-platform/videos/smileflow-demo
- Design tokens: /home/user/vibe-coding-platform/videos/smileflow-demo/frame.md
- RULES_DIR: /home/user/vibe-coding-platform/.agents/skills/hyperframes-animation/rules

## Assigned storyboard block

## Frame 4 — Le suivi se fait tout seul

- status: outline
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
