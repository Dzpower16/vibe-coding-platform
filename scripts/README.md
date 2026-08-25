# scripts/

## `add_audio.py`

Colle une piste audio sur une vidéo et réconcilie les deux durées.

```bash
pip install ffmpeg-python        # + ffmpeg sur le PATH
python3 scripts/add_audio.py video.mp4 audio.mp3 output.mp4
```

### Adapter la durée — `--fit`

| Valeur | Durée de sortie | Comportement |
|---|---|---|
| `freeze` *(défaut)* | celle de l'audio | audio plus long → la dernière image est tenue ; plus court → la vidéo est coupée |
| `loop` | celle de l'audio | la vidéo boucle pour remplir |
| `speed` | celle de l'audio | la vidéo est ré-cadencée (sa vitesse change) |
| `video` | celle de la vidéo | l'audio est coupé, ou complété par du silence |

### Le piège : une vidéo qui a déjà du son

`smileflow-brand-film-1920x1080.mp4` porte l'audio du sting sur ses 10
premières secondes. En `--existing replace` (le défaut), cette piste
**disparaît**. Mesuré sur le fichier réel :

```
replace : niveau plat -32 dB  → le sting a été écrasé
mix     : -27 dB à 1 s, pic -21 dB à 6 s, puis -47 dB → sting intact, musique dessous
```

Pour garder le sting et glisser la musique dessous :

```bash
python3 scripts/add_audio.py \
  videos/smileflow-promo/smileflow-brand-film-1920x1080.mp4 \
  musique.mp3 out.mp4 \
  --existing mix --under-volume 0.25 --fade-out 3
```

### Autres options

- `--volume` / `--under-volume` — gain de la nouvelle piste (globalement / en mode mix)
- `--fade-in` / `--fade-out` — fondus, en secondes
- `--exact` — coupe à l'image près. Sans lui, la vidéo est **copiée** (instantané,
  sans perte) mais ffmpeg ne peut couper que sur une image-clé : la sortie
  dépasse la cible de ~0,1 s. Avec, la vidéo est ré-encodée et la coupe tombe
  sous l'image (mesuré : 30,133 s → 30,067 s pour une cible de 30,04 s).
- `--crf` / `--preset` — qualité x264 quand un ré-encodage est nécessaire

### Notes

- Le script **copie** le flux vidéo dès qu'aucune image n'a besoin d'être
  fabriquée : muxer une piste sur une vidéo plus longue est alors instantané et
  sans perte. Il ne ré-encode que pour `freeze` (audio plus long), `loop`,
  `speed` et `--exact`.
- En `--fit loop`, si la vidéo a son propre son, **il boucle aussi** — le sting
  se rejouera à chaque tour.
- La sortie est vérifiée après écriture (présence de la piste audio et durée
  effective) : ffmpeg sort parfois en code 0 sur un fichier tronqué.
- Importable : `from scripts.add_audio import add_audio`.
