#!/usr/bin/env python3
"""
add_audio.py — colle une piste audio sur une vidéo et réconcilie les durées.

    python3 scripts/add_audio.py video.mp4 audio.mp3 output.mp4

Le cœur du problème n'est pas le muxage (une ligne de ffmpeg) mais le fait que
la vidéo et l'audio ne font presque jamais la même durée. Quatre stratégies,
via --fit :

    freeze  (défaut)  la sortie dure aussi longtemps que l'audio ; si l'audio
                      dépasse, la dernière image est tenue ; s'il est plus
                      court, la vidéo est coupée.
    loop              la sortie dure aussi longtemps que l'audio ; la vidéo
                      boucle pour remplir.
    speed             la sortie dure aussi longtemps que l'audio ; la vidéo est
                      ré-cadencée (sa vitesse change).
    video             la sortie garde la durée de la VIDÉO ; l'audio est coupé
                      ou complété par du silence.

Le piège : si la vidéo porte DÉJÀ une piste audio (un sting de marque, par
exemple), la remplacer la fait disparaître. --existing mix superpose les deux
au lieu d'écraser.

Dépendances : ffmpeg sur le PATH, et `pip install ffmpeg-python`.
"""

from __future__ import annotations

import argparse
import shutil
import sys
from dataclasses import dataclass
from pathlib import Path

try:
    import ffmpeg  # type: ignore
except ImportError:
    sys.exit("Il manque ffmpeg-python. Installez-le avec :  pip install ffmpeg-python")


# --------------------------------------------------------------------------
# Sondage
# --------------------------------------------------------------------------


@dataclass
class MediaInfo:
    duration: float
    has_video: bool
    has_audio: bool
    width: int | None = None
    height: int | None = None
    fps: float | None = None


def probe(path: Path) -> MediaInfo:
    """Lit la durée et les flux présents. Lève une erreur claire si illisible."""
    if not path.exists():
        raise FileNotFoundError(f"Fichier introuvable : {path}")

    try:
        meta = ffmpeg.probe(str(path))
    except ffmpeg.Error as exc:  # pragma: no cover - dépend de ffmpeg
        detail = exc.stderr.decode("utf-8", "replace") if exc.stderr else str(exc)
        raise RuntimeError(f"ffprobe a échoué sur {path} :\n{detail}") from exc

    streams = meta.get("streams", [])
    video = next((s for s in streams if s.get("codec_type") == "video"), None)
    audio = next((s for s in streams if s.get("codec_type") == "audio"), None)

    # La durée du conteneur est la plus fiable ; on retombe sur celle du flux
    # quand elle manque (certains MP3 en VBR ne l'exposent pas au conteneur).
    duration = meta.get("format", {}).get("duration")
    if duration is None:
        source = video or audio or {}
        duration = source.get("duration")
    if duration is None:
        raise RuntimeError(f"Impossible de déterminer la durée de {path}")

    fps = None
    if video and video.get("r_frame_rate", "0/0") != "0/0":
        num, _, den = video["r_frame_rate"].partition("/")
        if den and float(den) != 0:
            fps = float(num) / float(den)

    return MediaInfo(
        duration=float(duration),
        has_video=video is not None,
        has_audio=audio is not None,
        width=video.get("width") if video else None,
        height=video.get("height") if video else None,
        fps=fps,
    )


# --------------------------------------------------------------------------
# Construction du graphe
# --------------------------------------------------------------------------


def build(
    video_path: Path,
    audio_path: Path,
    output_path: Path,
    *,
    fit: str = "freeze",
    existing: str = "replace",
    volume: float = 1.0,
    under_volume: float = 0.35,
    fade_in: float = 0.0,
    fade_out: float = 0.0,
    crf: int = 18,
    preset: str = "medium",
    exact: bool = False,
    video_info: MediaInfo,
    audio_info: MediaInfo,
):
    """Assemble la commande ffmpeg et renvoie (stream, durée_cible, réencode)."""

    v_dur = video_info.duration
    a_dur = audio_info.duration

    # 1. Quelle durée fait la sortie, et faut-il toucher aux images ?
    if fit == "video":
        target = v_dur
        reencode_video = False
    elif fit == "speed":
        target = a_dur
        # Ré-encodage obligatoire : on réécrit les timestamps de présentation.
        reencode_video = True
    elif fit == "loop":
        target = a_dur
        reencode_video = a_dur > v_dur
    else:  # freeze
        target = a_dur
        # On ne réencode que s'il faut fabriquer des images (tenir la dernière).
        reencode_video = a_dur > v_dur

    # En copie de flux, ffmpeg ne peut couper que sur une image-clé : la sortie
    # dépasse alors la cible de quelques dixièmes. --exact force le ré-encodage
    # pour obtenir une coupe à l'image près.
    if exact and target < v_dur:
        reencode_video = True

    # 2. Flux vidéo.
    if fit == "loop" and a_dur > v_dur:
        # stream_loop est un argument d'ENTRÉE : il relit le fichier en boucle.
        v_in = ffmpeg.input(str(video_path), stream_loop=-1)
    else:
        v_in = ffmpeg.input(str(video_path))

    v = v_in.video

    if fit == "freeze" and a_dur > v_dur:
        # tpad clone la dernière image pour combler le manque, ce qui évite le
        # noir en fin de plan quand la musique dépasse la vidéo.
        v = v.filter("tpad", stop_mode="clone", stop_duration=round(a_dur - v_dur, 3))
    elif fit == "speed" and abs(a_dur - v_dur) > 0.001:
        # setpts dilate ou comprime le temps ; >1 ralentit, <1 accélère.
        v = v.filter("setpts", f"{a_dur / v_dur:.9f}*PTS")

    # 3. Flux audio.
    a_in = ffmpeg.input(str(audio_path))
    a = a_in.audio

    if volume != 1.0:
        a = a.filter("volume", volume)

    if existing == "mix" and video_info.has_audio:
        # La piste d'origine reste devant ; la nouvelle passe dessous.
        original = v_in.audio
        bed = a.filter("volume", under_volume)
        # normalize=0 empêche amix de diviser le gain par le nombre d'entrées,
        # ce qui écraserait les deux pistes de moitié.
        a = ffmpeg.filter([original, bed], "amix", inputs=2, duration="longest", normalize=0)

    if fit == "video" and a_dur < v_dur:
        # apad complète avec du silence pour que l'audio couvre toute la vidéo.
        a = a.filter("apad", pad_dur=round(v_dur - a_dur, 3))

    if fade_in > 0:
        a = a.filter("afade", t="in", st=0, d=fade_in)
    if fade_out > 0:
        a = a.filter("afade", t="out", st=max(0.0, target - fade_out), d=fade_out)

    # 4. Sortie.
    out_kwargs: dict = {
        "acodec": "aac",
        "audio_bitrate": "192k",
        "ar": 48000,
        "t": round(target, 3),
        # faststart déplace l'index en tête : la lecture démarre sans attendre
        # le téléchargement complet, ce qui compte sur le web.
        "movflags": "+faststart",
    }

    if reencode_video:
        out_kwargs.update(
            vcodec="libx264",
            crf=crf,
            preset=preset,
            pix_fmt="yuv420p",
        )
    else:
        # Rien à recalculer côté image : copie bit à bit, donc instantané et
        # sans perte de qualité.
        out_kwargs["vcodec"] = "copy"

    stream = ffmpeg.output(v, a, str(output_path), **out_kwargs)
    return stream, target, reencode_video


# --------------------------------------------------------------------------
# API
# --------------------------------------------------------------------------


def add_audio(
    video_path: str | Path,
    audio_path: str | Path,
    output_path: str | Path,
    *,
    fit: str = "freeze",
    existing: str = "replace",
    volume: float = 1.0,
    under_volume: float = 0.35,
    fade_in: float = 0.0,
    fade_out: float = 0.0,
    crf: int = 18,
    preset: str = "medium",
    exact: bool = False,
    overwrite: bool = True,
    quiet: bool = False,
) -> Path:
    """Colle `audio_path` sur `video_path` et écrit `output_path`."""

    video_path, audio_path, output_path = map(Path, (video_path, audio_path, output_path))

    if shutil.which("ffmpeg") is None:
        raise RuntimeError("ffmpeg est introuvable sur le PATH.")

    v_info = probe(video_path)
    a_info = probe(audio_path)

    if not v_info.has_video:
        raise ValueError(f"{video_path} ne contient aucun flux vidéo.")
    if not a_info.has_audio:
        raise ValueError(f"{audio_path} ne contient aucun flux audio.")

    if output_path.resolve() in (video_path.resolve(), audio_path.resolve()):
        raise ValueError("La sortie ne peut pas écraser un fichier d'entrée.")

    output_path.parent.mkdir(parents=True, exist_ok=True)

    stream, target, reencode = build(
        video_path,
        audio_path,
        output_path,
        fit=fit,
        existing=existing,
        volume=volume,
        under_volume=under_volume,
        fade_in=fade_in,
        fade_out=fade_out,
        crf=crf,
        preset=preset,
        exact=exact,
        video_info=v_info,
        audio_info=a_info,
    )

    if not quiet:
        delta = a_info.duration - v_info.duration
        print(f"  vidéo   {v_info.duration:7.2f} s  {v_info.width}x{v_info.height}", end="")
        print(f" @ {v_info.fps:.0f} fps" if v_info.fps else "")
        print(f"  audio   {a_info.duration:7.2f} s  ({delta:+.2f} s vs vidéo)")
        print(f"  sortie  {target:7.2f} s  · fit={fit} · vidéo {'ré-encodée' if reencode else 'copiée'}")

        if not reencode and target < v_info.duration:
            print(
                "  ·  Coupe sur image-clé : la sortie peut dépasser la cible de ~0,1 s.\n"
                "     Pour une coupe à l'image près : --exact (ré-encode la vidéo)"
            )

        if v_info.has_audio and existing == "replace":
            print(
                "  ⚠  La vidéo portait déjà une piste audio : elle est REMPLACÉE.\n"
                "     Pour la conserver et glisser la nouvelle dessous : --existing mix"
            )

    if overwrite:
        stream = stream.overwrite_output()

    try:
        stream.run(quiet=True)
    except ffmpeg.Error as exc:  # pragma: no cover - dépend de ffmpeg
        detail = exc.stderr.decode("utf-8", "replace") if exc.stderr else str(exc)
        raise RuntimeError(f"ffmpeg a échoué :\n{detail}") from exc

    # Vérification : on relit la sortie plutôt que de faire confiance au code
    # de retour, car ffmpeg sort en 0 sur certains fichiers tronqués.
    result = probe(output_path)
    if not result.has_audio:
        raise RuntimeError("La sortie ne contient pas de piste audio.")
    tolerance = 0.05 if exact or reencode else 0.5
    if abs(result.duration - target) > tolerance:
        raise RuntimeError(
            f"Durée inattendue : {result.duration:.2f} s au lieu de {target:.2f} s attendues."
        )

    if not quiet:
        size_mb = output_path.stat().st_size / 1_048_576
        print(f"  ✓ {output_path}  ({size_mb:.1f} Mo, {result.duration:.2f} s)")

    return output_path


# --------------------------------------------------------------------------
# CLI
# --------------------------------------------------------------------------


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(
        description="Ajoute une piste audio à une vidéo en adaptant les durées.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Exemples :\n"
            "  %(prog)s video.mp4 audio.mp3 output.mp4\n"
            "  %(prog)s video.mp4 musique.mp3 out.mp4 --fit loop --fade-out 2\n"
            "  %(prog)s film.mp4 musique.mp3 out.mp4 --existing mix --under-volume 0.25\n"
        ),
    )
    p.add_argument("video", type=Path, help="vidéo d'entrée (ex. video.mp4)")
    p.add_argument("audio", type=Path, help="piste audio (ex. audio.mp3)")
    p.add_argument("output", type=Path, nargs="?", default=Path("output.mp4"))
    p.add_argument(
        "--fit",
        choices=["freeze", "loop", "speed", "video"],
        default="freeze",
        help="comment réconcilier les durées (défaut : freeze)",
    )
    p.add_argument(
        "--existing",
        choices=["replace", "mix"],
        default="replace",
        help="que faire de l'audio déjà présent dans la vidéo (défaut : replace)",
    )
    p.add_argument("--volume", type=float, default=1.0, help="gain de la nouvelle piste")
    p.add_argument(
        "--under-volume",
        type=float,
        default=0.35,
        help="gain de la nouvelle piste en mode mix (défaut : 0.35)",
    )
    p.add_argument("--fade-in", type=float, default=0.0, help="fondu d'entrée, en secondes")
    p.add_argument("--fade-out", type=float, default=0.0, help="fondu de sortie, en secondes")
    p.add_argument("--crf", type=int, default=18, help="qualité x264 si ré-encodage (défaut : 18)")
    p.add_argument("--preset", default="medium", help="preset x264 (défaut : medium)")
    p.add_argument(
        "--exact",
        action="store_true",
        help="coupe à l'image près (force le ré-encodage au lieu de la copie de flux)",
    )
    p.add_argument("-q", "--quiet", action="store_true")

    args = p.parse_args(argv)

    try:
        add_audio(
            args.video,
            args.audio,
            args.output,
            fit=args.fit,
            existing=args.existing,
            volume=args.volume,
            under_volume=args.under_volume,
            fade_in=args.fade_in,
            fade_out=args.fade_out,
            crf=args.crf,
            preset=args.preset,
            exact=args.exact,
            quiet=args.quiet,
        )
    except (FileNotFoundError, ValueError, RuntimeError) as exc:
        print(f"✗ {exc}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
