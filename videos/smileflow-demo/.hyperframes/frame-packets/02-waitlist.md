# Frame packet: 02-waitlist

## Project inputs

- Project: /home/user/vibe-coding-platform/videos/smileflow-demo
- Design tokens: /home/user/vibe-coding-platform/videos/smileflow-demo/frame.md
- RULES_DIR: /home/user/vibe-coding-platform/.agents/skills/hyperframes-animation/rules

## Assigned storyboard block

## Frame 2 — Smart Waitlist comble le trou

- status: outline
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
