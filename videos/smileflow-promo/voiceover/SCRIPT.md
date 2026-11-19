# Voix off — film de marque SmileFlow (FR-QC)

Voix : **Mathieu – Warm French Canadian Narrator** (ElevenLabs, `ea8mX8XjQt6IYaKiIshC`)
Modèle : `eleven_v4`

| Clip | Placé à | Durée | Texte |
|---|---|---|---|
| `01-scribe.mp3` | 10,6 s | 8,2 s | Trente secondes de dictée, pis votre note clinique est prête. SmileFlow rédige le brouillon SOAP pour vous… vous avez juste à relire, pis à signer. |
| `02-waitlist.mp3` | 22,6 s | 9,2 s | Un patient annule à la dernière minute? SmileFlow texte votre liste d'attente, et le fauteuil est comblé en moins d'une minute. Sans un seul appel. |
| `03-reputation.mp3` | 34,6 s | 9,4 s | Après chaque visite, un petit mot de remerciement part tout seul, avec une invitation à laisser un avis Google. Votre réputation grandit, sans effort. |
| `04-outro.mp3` | 45,6 s | 8,1 s | Conforme à la Loi 25, vos données restent au Québec. SmileFlow… réservez votre démo gratuite sur smileflow point ca. |

Chaque clip démarre 0,6 s après le début de sa scène, au moment où le titre
apparaît. Le sting (0–10 s) reste seul : la voix ne parle jamais par-dessus
le logo.

## Reconstruire

```bash
cd videos/smileflow-promo/voiceover
ffmpeg -y -i 01-scribe.mp3 -i 02-waitlist.mp3 -i 03-reputation.mp3 -i 04-outro.mp3 \
  -filter_complex "[0:a]aresample=48000,adelay=10600|10600[a0];[1:a]aresample=48000,adelay=22600|22600[a1];[2:a]aresample=48000,adelay=34600|34600[a2];[3:a]aresample=48000,adelay=45600|45600[a3];[a0][a1][a2][a3]amix=inputs=4:duration=longest:normalize=0,apad=whole_dur=56.042667[out]" \
  -map "[out]" -ac 2 -c:a pcm_s16le voix_off_timeline.wav
cd ../../..
python3 scripts/add_audio.py \
  videos/smileflow-promo/smileflow-brand-film-1920x1080.mp4 \
  videos/smileflow-promo/voiceover/voix_off_timeline.wav \
  videos/smileflow-promo/smileflow-brand-film-voix-off-qc-1920x1080.mp4 \
  --fit video --existing mix --under-volume 1.0
```
