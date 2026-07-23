# Frame packet: 05-cta

## Project inputs

- Project: /home/user/vibe-coding-platform/videos/smileflow-demo
- Design tokens: /home/user/vibe-coding-platform/videos/smileflow-demo/frame.md
- RULES_DIR: /home/user/vibe-coding-platform/.agents/skills/hyperframes-animation/rules

## Assigned storyboard block

## Frame 5 — SmileFlow

- status: outline
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
