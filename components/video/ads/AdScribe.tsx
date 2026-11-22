import React from 'react'
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import '../fonts'
import { LIGHT, FONT } from '../brand/lightTheme'
import { SmileFlowLockup } from '../brand/LogoSmileFlow'
import { enter, hashNoise, ramp, springAt, SMOOTH, SNAPPY, POP } from '../motion'
import { BRAND, BrandBackdrop } from './shared'

/**
 * Pub Meta n°1 — Scribe IA (9:16, 25 s).
 *
 * AIDA as a literal night-to-day film:
 *   A  21 h 47, a laptop glowing in the dark, still typing notes.
 *   I  The unfinished notes pile up — then everything freezes.
 *   D  Daylight floods in: dictation writes the SOAP note, the dentist
 *      signs, the clock rolls back to 17 h 00. Loi 25 trust strip.
 *   A  Logo, « Reprenez vos soirées », démo gratuite.
 *
 * Every beat is cued to a phrase boundary measured in the voice-over clips
 * (silencedetect), so captions and motion land on the spoken word.
 */

export const AD_SCRIBE_FPS = 30
export const AD_SCRIBE_FRAMES = 750 // 25 s

const s = (sec: number) => Math.round(sec * AD_SCRIBE_FPS)

// ── Voice-over: clip start in the film + phrase bounds inside each clip ──────
type Phrase = { from: number; to: number; text: string }
const VO: { file: string; at: number; phrases: Phrase[] }[] = [
  {
    file: 'ads/scribe/vo1.mp3',
    at: 0.5,
    phrases: [
      { from: 0.13, to: 1.71, text: '21 h 47…' },
      { from: 2.18, to: 4.17, text: 'Pis vous êtes encore en train de taper vos notes?' },
    ],
  },
  {
    file: 'ads/scribe/vo2.mp3',
    at: 5.6,
    phrases: [
      { from: 0.0, to: 2.19, text: 'Et si vos notes s’écrivaient toutes seules…' },
      { from: 2.7, to: 3.71, text: 'pendant la consultation?' },
    ],
  },
  {
    file: 'ads/scribe/vo3.mp3',
    at: 10.4,
    phrases: [
      { from: 0.0, to: 1.2, text: 'Trente secondes de dictée,' },
      { from: 1.38, to: 3.11, text: 'pis le brouillon SOAP est prêt.' },
      { from: 3.47, to: 4.19, text: 'Vous relisez,' },
      { from: 4.37, to: 4.9, text: 'vous signez.' },
      { from: 5.25, to: 5.99, text: 'Et à cinq heures…' },
      { from: 6.29, to: 6.87, text: 'vous êtes chez vous.' },
    ],
  },
  {
    file: 'ads/scribe/vo4.mp3',
    at: 18.6,
    phrases: [
      { from: 0.0, to: 0.88, text: 'SmileFlow,' },
      { from: 1.13, to: 2.6, text: 'conforme à la Loi 25.' },
      { from: 2.91, to: 4.28, text: 'Réservez votre démo gratuite.' },
    ],
  },
]

/** Absolute (film-time) windows where a voice is speaking. */
const SPEECH = VO.flatMap((c) => c.phrases.map((p) => [c.at + p.from, c.at + p.to] as const))

/**
 * Music bed: always on, so the prospect never hits a hole in the sound, but
 * ducked under every spoken phrase so the voice stays effortless to follow.
 */
function musicVolume(f: number) {
  const t = f / AD_SCRIBE_FPS
  const BED = 0.34
  const UNDER = 0.13
  const RAMP = 0.22 // seconds
  let duck = 0
  for (const [a, b] of SPEECH) {
    const v = Math.min(
      interpolate(t, [a - RAMP, a], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
      interpolate(t, [b, b + RAMP + 0.15], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
    )
    duck = Math.max(duck, v)
  }
  const level = BED + (UNDER - BED) * duck
  const fadeIn = interpolate(f, [0, 10], [0.4, 1], { extrapolateRight: 'clamp' })
  const fadeOut = interpolate(f, [AD_SCRIBE_FRAMES - 50, AD_SCRIBE_FRAMES - 2], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  return level * fadeIn * fadeOut
}

// ── Palettes ─────────────────────────────────────────────────────────────────
// Evening beats now live in the SmileFlow brand violet (same hook world as
// the Waitlist and Avis ads) instead of a neutral navy night.
const NIGHT = {
  bg: BRAND.deep,
  screen: '#2A1468',
  card: '#2F1872',
  ink: '#FFFFFF',
  dim: '#C9B8F2',
  warm: BRAND.lilac,
}

// Reels UI covers roughly the top 220 px and bottom 420 px; everything that
// matters lives between those bands.
const SAFE_TOP = 250

/** 0→1 as the film moves from night to day (the Desire beat). */
function dayAmount(f: number) {
  return interpolate(f, [s(9.7), s(10.9)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (x) => x * x * (3 - 2 * x),
  })
}

// ── Captions ─────────────────────────────────────────────────────────────────
const Captions: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = frame / fps
  const all = VO.flatMap((c) => c.phrases.map((p) => ({ ...p, a: c.at + p.from, b: c.at + p.to })))
  // Hold each caption until the next phrase starts (or 0.6 s), so the eye never
  // sees a blank flash between two lines.
  const idx = all.findIndex((p, i) => {
    const next = all[i + 1]
    const end = next ? Math.min(next.a, p.b + 0.6) : p.b + 0.6
    return t >= p.a - 0.05 && t < end
  })
  if (idx < 0) return null
  const p = all[idx]
  const local = frame - s(p.a - 0.05)
  const pop = springAt({ frame: local, fps, config: SNAPPY })

  return (
    <div
      style={{
        position: 'absolute',
        left: 70,
        right: 150,
        top: 1330,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          padding: '18px 30px',
          borderRadius: 22,
          background: 'rgba(18, 10, 38, 0.80)',
          color: '#FFFFFF',
          fontFamily: FONT,
          fontSize: 46,
          fontWeight: 700,
          lineHeight: 1.22,
          letterSpacing: '-0.015em',
          textAlign: 'center',
          opacity: pop,
          transform: `translateY(${(1 - pop) * 14}px) scale(${0.96 + pop * 0.04})`,
          boxShadow: '0 12px 34px rgba(0,0,0,0.28)',
        }}
      >
        {p.text}
      </div>
    </div>
  )
}

// ── Night (Attention + Interest) ─────────────────────────────────────────────
const NOTE_TEXT = 'Patiente se plaint de sensibilité au froid, quadrant inf. droit. Examen : '

const NightScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const clockIn = springAt({ frame: frame - s(0.55), fps, config: SMOOTH })
  const colon = Math.floor(frame / 15) % 2 === 0 ? 1 : 0.25
  // Clock creeps on while the notes pile up: 21:47 → 22:13.
  const minutes = Math.round(interpolate(frame, [s(5.6), s(8.6)], [47, 73], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))
  const hh = 21 + Math.floor(minutes / 60)
  const mm = String(minutes % 60).padStart(2, '0')

  // Slow, tired typing with a backspace in the middle — someone at the end of a long day.
  const typedChars = Math.floor(interpolate(frame, [s(2.6), s(5.2)], [0, NOTE_TEXT.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))
  const backspace = frame > s(4.1) && frame < s(4.5) ? 6 : 0
  const typed = NOTE_TEXT.slice(0, Math.max(0, typedChars - backspace))

  const laptopIn = enter(frame, fps, { delay: s(2.3), y: 60, blur: 14 })

  // Interest: unfinished notes stack up behind the laptop.
  const pile = Math.round(interpolate(frame, [s(5.7), s(8.2)], [1, 12], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))

  // Pattern interrupt on « pendant la consultation? »: freeze, blur, brighten.
  const freeze = interpolate(frame, [s(8.4), s(9.6)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ filter: `blur(${freeze * 10}px) brightness(${1 + freeze * 0.6})` }}>
      {/* Room: the brand's deep violet, with the screen's glow behind the laptop. */}
      <BrandBackdrop />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 60% 36% at 50% 62%, rgba(196,160,255,0.22), transparent 72%)`,
          opacity: 0.6 + 0.4 * Number(laptopIn.opacity ?? 1),
        }}
      />

      {/* The clock — the hook. */}
      <div
        style={{
          position: 'absolute',
          top: SAFE_TOP + 40,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: clockIn,
          transform: `scale(${0.86 + clockIn * 0.14})`,
          filter: `blur(${(1 - clockIn) * 12}px)`,
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontSize: 250,
            fontWeight: 200,
            letterSpacing: '-0.04em',
            color: NIGHT.ink,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}
        >
          {hh}
          <span style={{ opacity: colon }}>:</span>
          {mm}
        </div>
        <div
          style={{
            marginTop: 18,
            fontFamily: FONT,
            fontSize: 30,
            fontWeight: 500,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: NIGHT.warm,
            ...enter(frame, fps, { delay: s(1.2), y: 10, blur: 6 }),
          }}
        >
          Mardi soir · Encore au bureau
        </div>
      </div>

      {/* Unfinished notes stacking behind the laptop. */}
      {new Array(12).fill(0).map((_, i) => {
        if (i >= pile) return null
        const appear = springAt({ frame: frame - s(5.7) - i * 6, fps, config: POP })
        const rot = (hashNoise(i, 7) - 0.5) * 14
        const dx = (hashNoise(i, 3) - 0.5) * 160
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 540 - 280 + dx,
              top: 740 - i * 8,
              width: 560,
              height: 200,
              borderRadius: 18,
              background: NIGHT.card,
              border: '1px solid rgba(255,255,255,0.14)',
              transform: `rotate(${rot}deg) scale(${0.7 + appear * 0.3})`,
              opacity: appear * 0.9,
              padding: 26,
              boxShadow: '0 18px 40px rgba(0,0,0,0.45)',
            }}
          >
            <div style={{ fontFamily: FONT, fontSize: 22, fontWeight: 600, color: NIGHT.dim }}>
              Note clinique #{i + 1} — à compléter
            </div>
            {[0.8, 0.65, 0.9].map((w, j) => (
              <div key={j} style={{ marginTop: 18, height: 12, width: `${w * 100}%`, borderRadius: 6, background: 'rgba(255,255,255,0.12)' }} />
            ))}
          </div>
        )
      })}

      {/* Laptop screen, dark mode, the tired typing. */}
      <div style={{ position: 'absolute', left: 90, right: 90, top: 960, ...laptopIn }}>
        <div
          style={{
            borderRadius: 26,
            background: NIGHT.screen,
            border: '1px solid rgba(255,255,255,0.16)',
            padding: '30px 34px',
            boxShadow: '0 30px 80px rgba(0,0,0,0.55), 0 0 90px rgba(110,140,255,0.18)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontFamily: FONT, fontSize: 26, fontWeight: 600, color: NIGHT.ink }}>Note — Mme Gagnon</div>
            <div
              style={{
                fontFamily: FONT,
                fontSize: 22,
                fontWeight: 600,
                color: '#FF8A8A',
                padding: '6px 14px',
                borderRadius: 999,
                background: 'rgba(255,138,138,0.12)',
              }}
            >
              {pile > 1 ? `${pile} notes en retard` : '1 note en retard'}
            </div>
          </div>
          <div style={{ fontFamily: FONT, fontSize: 28, lineHeight: 1.5, color: NIGHT.dim, minHeight: 130 }}>
            {typed}
            <span
              style={{
                display: 'inline-block',
                width: 3,
                height: 30,
                marginLeft: 3,
                verticalAlign: -5,
                background: NIGHT.ink,
                opacity: Math.floor(frame / 9) % 2 === 0 ? 1 : 0,
              }}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}

// ── Day (Desire) ─────────────────────────────────────────────────────────────
const SOAP = [
  { k: 'S', label: 'Subjectif', text: 'Sensibilité au froid, quadrant inf. droit.' },
  { k: 'O', label: 'Objectif', text: 'Dent 46 : restauration défectueuse.' },
  { k: 'A', label: 'Analyse', text: 'Carie récurrente sous restauration.' },
  { k: 'P', label: 'Plan', text: 'Couronne céramique. Suivi 3 semaines.' },
]

const DayScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const T = (sec: number) => s(sec)

  const dictating = frame >= T(10.4) && frame < T(11.7)
  const timer = Math.round(interpolate(frame, [T(10.4), T(11.6)], [0, 30], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))
  const cardIn = enter(frame, fps, { delay: T(10.6), y: 60, blur: 14, scale: 0.96 })

  // « Vous relisez » — one highlight pass down the note.
  const sweep = interpolate(frame, [T(13.85), T(14.6)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  // « vous signez » — the button press.
  const press = springAt({ frame: frame - T(14.75), fps, config: POP })
  const signed = frame >= T(14.85)

  // « Et à cinq heures… vous êtes chez vous » — the clock rolls back.
  const rollT = interpolate(frame, [T(15.6), T(16.6)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: (x) => 1 - Math.pow(1 - x, 3) })
  const minsFrom = 22 * 60 + 13
  const minsTo = 17 * 60
  const mins = Math.round(minsFrom + (minsTo - minsFrom) * rollT)
  const clockShow = interpolate(frame, [T(15.45), T(15.75)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const trustIn = enter(frame, fps, { delay: T(16.2), y: 24, blur: 8 })

  return (
    <AbsoluteFill>
      {/* Daylight studio — the brand's own room. */}
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${LIGHT.bgHigh} 0%, ${LIGHT.bg} 55%, ${LIGHT.bgFloor} 100%)` }} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 45% at 50% 40%, rgba(147,51,234,0.12), transparent 70%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: '58%',
          width: 360,
          height: '140%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)',
          transform: 'rotate(22deg)',
          filter: 'blur(40px)',
        }}
      />

      {/* Header: dictation status + 30 s timer. Clears out when the clock returns. */}
      <div style={{ position: 'absolute', top: SAFE_TOP + 20, left: 80, right: 80, opacity: 1 - clockShow }}>
      <div style={{ ...enter(frame, fps, { delay: T(10.2), y: 18, blur: 8 }) }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              fontFamily: FONT,
              fontSize: 26,
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: dictating ? LIGHT.violet : LIGHT.success,
            }}
          >
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: dictating ? '#E11D48' : LIGHT.success,
                opacity: dictating ? 0.55 + 0.45 * Math.sin(frame / 4) : 1,
              }}
            />
            {dictating ? 'Dictée en cours' : 'Note générée'}
          </div>
          <div style={{ fontFamily: FONT, fontSize: 40, fontWeight: 700, color: LIGHT.ink, fontVariantNumeric: 'tabular-nums' }}>
            0:{String(timer).padStart(2, '0')}
          </div>
        </div>
        {/* Waveform */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 110, marginTop: 18 }}>
          {new Array(52).fill(0).map((_, i) => {
            const a = hashNoise(i, 3)
            const b = hashNoise(i, 11)
            const w = 0.5 + 0.5 * Math.sin(frame / (4 + a * 4) + i * (0.5 + b * 0.5)) * Math.sin(frame / 19 + i * 0.13)
            const env = Math.sin((i / 51) * Math.PI) ** 0.6
            const h = dictating ? 10 + w * env * 96 : 6 + env * 26
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: h,
                  borderRadius: 4,
                  background: `linear-gradient(180deg, ${LIGHT.violetLight}, ${LIGHT.violet})`,
                  opacity: dictating ? 0.95 : 0.3,
                }}
              />
            )
          })}
        </div>
      </div>
      </div>

      {/* SOAP card */}
      <div style={{ position: 'absolute', top: 560, left: 70, right: 70, ...cardIn }}>
        <div
          style={{
            borderRadius: 30,
            background: '#FFFFFF',
            border: `1px solid ${signed ? 'rgba(15,157,110,0.35)' : 'rgba(124,58,237,0.22)'}`,
            boxShadow: '0 36px 80px rgba(36,20,66,0.16), 0 0 70px rgba(147,51,234,0.12)',
            padding: '34px 38px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* read-through highlight */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${sweep * 100}%`,
              height: 120,
              transform: 'translateY(-50%)',
              background: 'linear-gradient(180deg, transparent, rgba(124,58,237,0.10), transparent)',
              opacity: sweep > 0 && sweep < 1 ? 1 : 0,
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
            <div style={{ fontFamily: FONT, fontSize: 32, fontWeight: 700, color: LIGHT.ink }}>Note SOAP</div>
            <div
              style={{
                fontFamily: FONT,
                fontSize: 22,
                fontWeight: 600,
                color: LIGHT.violet,
                padding: '8px 16px',
                borderRadius: 999,
                background: 'rgba(124,58,237,0.09)',
                ...enter(frame, fps, { delay: T(12.2), y: 0, blur: 4, scale: 0.8, config: POP }),
              }}
            >
              ◎ Dent 46 détectée
            </div>
          </div>
          {SOAP.map((row, i) => {
            const d = T(11.8) + i * 9
            const chars = Math.floor(interpolate(frame, [d, d + 16], [0, row.text.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))
            const done = chars >= row.text.length
            return (
              <div key={row.k} style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginTop: 18, ...enter(frame, fps, { delay: d, y: 14, blur: 6, fade: 8 }) }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: FONT,
                    fontSize: 28,
                    fontWeight: 800,
                    color: done ? '#FFF' : LIGHT.violet,
                    background: done ? `linear-gradient(145deg, ${LIGHT.violetLight}, ${LIGHT.violet})` : 'rgba(124,58,237,0.10)',
                  }}
                >
                  {row.k}
                </div>
                <div>
                  <div style={{ fontFamily: FONT, fontSize: 19, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: LIGHT.dim }}>{row.label}</div>
                  <div style={{ fontFamily: FONT, fontSize: 29, lineHeight: 1.35, color: LIGHT.ink, marginTop: 4 }}>{row.text.slice(0, chars)}</div>
                </div>
              </div>
            )
          })}

          {/* Validate & sign */}
          <div style={{ marginTop: 30, display: 'flex', alignItems: 'center', gap: 18, ...enter(frame, fps, { delay: T(13.3), y: 16, blur: 6 }) }}>
            <div
              style={{
                padding: '20px 34px',
                borderRadius: 999,
                fontFamily: FONT,
                fontSize: 30,
                fontWeight: 700,
                color: '#FFF',
                background: signed ? `linear-gradient(145deg, #10B981, ${LIGHT.success})` : `linear-gradient(145deg, ${LIGHT.violetLight}, ${LIGHT.violet})`,
                transform: `scale(${frame >= T(14.75) && frame < T(14.95) ? 0.94 : 1})`,
                boxShadow: '0 14px 30px rgba(36,20,66,0.18)',
              }}
            >
              {signed ? '✓ Signée' : 'Valider et signer'}
            </div>
            <div style={{ fontFamily: FONT, fontSize: 22, color: LIGHT.dim, lineHeight: 1.3, opacity: press }}>
              Toujours relue et
              <br />
              signée par vous
            </div>
          </div>
        </div>
      </div>

      {/* The clock comes back — rolling from 22:13 to 17:00. */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: SAFE_TOP + 10,
          textAlign: 'center',
          opacity: clockShow,
        }}
      >
        <div
          style={{
            display: 'inline-block',
            padding: '18px 46px',
            borderRadius: 999,
            background: '#FFFFFF',
            boxShadow: '0 18px 44px rgba(36,20,66,0.14)',
            fontFamily: FONT,
            fontSize: 96,
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: rollT >= 1 ? LIGHT.violet : LIGHT.ink,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {Math.floor(mins / 60)}:{String(mins % 60).padStart(2, '0')}
        </div>
      </div>

      {/* Loi 25 trust strip */}
      <div style={{ position: 'absolute', left: 70, right: 70, top: 1180, ...trustIn }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 14,
            flexWrap: 'wrap',
          }}
        >
          {['🛡 Conforme Loi 25', 'Hébergé au Québec', 'Consentement patient'].map((label) => (
            <div
              key={label}
              style={{
                padding: '12px 22px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.92)',
                border: '1px solid rgba(124,58,237,0.22)',
                fontFamily: FONT,
                fontSize: 24,
                fontWeight: 600,
                color: LIGHT.ink,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  )
}

// ── Action ───────────────────────────────────────────────────────────────────
const ActionScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const T = (sec: number) => s(sec) - s(18.3) // scene-local

  const draw = springAt({ frame: frame - T(18.6), fps, config: SMOOTH })
  const word = springAt({ frame: frame - T(18.9), fps, config: SMOOTH })
  const cta = springAt({ frame: frame - T(21.4), fps, config: SNAPPY })
  const glow = ramp(frame, [T(21.6), T(22.6)])

  return (
    <AbsoluteFill style={{ alignItems: 'center' }}>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${LIGHT.bgHigh} 0%, ${LIGHT.bg} 60%, ${LIGHT.bgFloor} 100%)` }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 40% at 50% 45%, rgba(147,51,234,0.16), transparent 70%)` }} />

      <div style={{ position: 'absolute', top: 360, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <SmileFlowLockup size={118} draw={draw} wordmark={word} />

        <div
          style={{
            marginTop: 90,
            fontFamily: FONT,
            fontSize: 104,
            fontWeight: 800,
            letterSpacing: '-0.045em',
            lineHeight: 1.02,
            textAlign: 'center',
            color: LIGHT.ink,
            ...enter(frame, fps, { delay: T(19.0), y: 30, blur: 14 }),
          }}
        >
          Reprenez
          <br />
          <span style={{ color: LIGHT.violet }}>vos soirées.</span>
        </div>

        <div
          style={{
            marginTop: 40,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 24px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.9)',
            border: '1px solid rgba(124,58,237,0.25)',
            fontFamily: FONT,
            fontSize: 26,
            fontWeight: 600,
            color: LIGHT.ink,
            ...enter(frame, fps, { delay: T(19.75), y: 16, blur: 8, scale: 0.9 }),
          }}
        >
          🛡 Conforme à la Loi 25 · Données au Québec
        </div>

        <div style={{ marginTop: 70, position: 'relative', opacity: cta, transform: `translateY(${(1 - cta) * 30}px)` }}>
          <div
            style={{
              position: 'absolute',
              inset: -20,
              borderRadius: 999,
              background: 'radial-gradient(ellipse, rgba(147,51,234,0.55), transparent 70%)',
              filter: 'blur(22px)',
              opacity: glow * 0.8,
            }}
          />
          <div
            style={{
              position: 'relative',
              padding: '32px 60px',
              borderRadius: 999,
              background: `linear-gradient(145deg, ${LIGHT.violetLight}, ${LIGHT.violetBright} 50%, ${LIGHT.violet})`,
              fontFamily: FONT,
              fontSize: 44,
              fontWeight: 700,
              color: '#FFF',
              letterSpacing: '-0.015em',
              boxShadow: '0 22px 50px rgba(124,58,237,0.38), inset 0 1px 0 rgba(255,255,255,0.3)',
            }}
          >
            Réservez votre démo gratuite →
          </div>
        </div>
        <div style={{ marginTop: 34, fontFamily: FONT, fontSize: 36, fontWeight: 600, color: LIGHT.muted, ...enter(frame, fps, { delay: T(22.2), y: 12, blur: 6 }) }}>
          smileflow.ca
        </div>
      </div>
    </AbsoluteFill>
  )
}

// ── Film ─────────────────────────────────────────────────────────────────────
export const AdScribe: React.FC = () => {
  const frame = useCurrentFrame()
  const day = dayAmount(frame)
  const actionIn = interpolate(frame, [s(18.1), s(18.6)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ backgroundColor: NIGHT.bg }}>
      {/* Music bed — continuous, ducked under the voice. */}
      <Audio src={staticFile('ads/scribe/music.mp3')} volume={musicVolume} />
      {VO.map((c) => (
        <Sequence key={c.file} from={s(c.at)}>
          <Audio src={staticFile(c.file)} volume={1} />
        </Sequence>
      ))}

      {day < 1 && (
        <AbsoluteFill style={{ opacity: 1 - day }}>
          <NightScene />
        </AbsoluteFill>
      )}
      {day > 0 && actionIn < 1 && (
        <AbsoluteFill style={{ opacity: day * (1 - actionIn) }}>
          <DayScene />
        </AbsoluteFill>
      )}
      {/* The daylight flash that carries the cut from night to day. */}
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse 90% 60% at 50% 35%, #FFFFFF, rgba(255,255,255,0) 75%)',
          opacity: interpolate(frame, [s(9.5), s(10.1), s(10.9)], [0, 0.95, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}
      />
      {actionIn > 0 && (
        <Sequence from={s(18.3)}>
          <AbsoluteFill style={{ opacity: actionIn }}>
            <ActionScene />
          </AbsoluteFill>
        </Sequence>
      )}

      <Captions />
    </AbsoluteFill>
  )
}
