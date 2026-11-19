import React from 'react'
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import '../fonts'
import { LIGHT, FONT } from '../brand/lightTheme'
import { SmileFlowLockup, SmileMark } from '../brand/LogoSmileFlow'
import { enter, ramp, springAt, SMOOTH, SNAPPY } from '../motion'

/**
 * Shared building blocks for the SmileFlow Meta ads (9:16 Reels/Stories).
 *
 * Every ad is driven by its voice-over: a list of clips placed in film time,
 * each with phrase bounds measured with silencedetect. Captions, the music
 * duck and the scene cues all read from that one list, so a re-timed clip
 * moves everything that hangs off it.
 */

export const AD_FPS = 30
export const sec = (t: number) => Math.round(t * AD_FPS)

/** Reels UI covers roughly the top 220 px and bottom 420 px. */
export const SAFE_TOP = 250
export const CAPTION_TOP = 1330

export type Phrase = { from: number; to: number; text: string }
export type VOClip = { file: string; at: number; phrases: Phrase[] }

/** Film-time (seconds) start of phrase `p` in clip `c`. */
export const cueOf = (vo: VOClip[]) => (c: number, p = 0) => vo[c].at + vo[c].phrases[p].from
/** Film-time (seconds) end of phrase `p` in clip `c`. */
export const endOf = (vo: VOClip[]) => (c: number, p = 0) => vo[c].at + vo[c].phrases[p].to

/**
 * SmileFlow brand palette for the ads, built on the logo's violet.
 * Hooks play on the deep brand gradient, product beats in the light studio.
 */
export const BRAND = {
  deep: '#1E0B4B',
  royal: '#3B1A8F',
  violet: LIGHT.violet,
  bright: LIGHT.violetBright,
  light: LIGHT.violetLight,
  lilac: '#E9DDFF',
  white: '#FFFFFF',
  coral: '#FF7A6B',
  gold: '#FBBF24',
}

// ── Audio ────────────────────────────────────────────────────────────────────

/**
 * Music bed: always on (no holes in the sound), ducked under every phrase so
 * the voice is effortless to follow.
 */
export function makeMusicVolume(vo: VOClip[], frames: number) {
  const speech = vo.flatMap((c) => c.phrases.map((p) => [c.at + p.from, c.at + p.to] as const))
  return (f: number) => {
    const t = f / AD_FPS
    const BED = 0.34
    const UNDER = 0.13
    const RAMP = 0.22
    let duck = 0
    for (const [a, b] of speech) {
      const v = Math.min(
        interpolate(t, [a - RAMP, a], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        interpolate(t, [b, b + RAMP + 0.15], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
      )
      duck = Math.max(duck, v)
    }
    const level = BED + (UNDER - BED) * duck
    const fadeIn = interpolate(f, [0, 10], [0.4, 1], { extrapolateRight: 'clamp' })
    const fadeOut = interpolate(f, [frames - 50, frames - 2], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    return level * fadeIn * fadeOut
  }
}

/** `musicTrim` skips a slow intro (in frames) so the bed is audible from frame 0. */
export const AdAudio: React.FC<{ music: string; vo: VOClip[]; frames: number; musicTrim?: number }> = ({ music, vo, frames, musicTrim = 0 }) => {
  const vol = React.useMemo(() => makeMusicVolume(vo, frames), [vo, frames])
  return (
    <>
      <Audio src={staticFile(music)} volume={vol} trimBefore={musicTrim} />
      {vo.map((c) => (
        <Sequence key={c.file} from={sec(c.at)}>
          <Audio src={staticFile(c.file)} volume={1} />
        </Sequence>
      ))}
    </>
  )
}

// ── Captions ─────────────────────────────────────────────────────────────────

export const Captions: React.FC<{ vo: VOClip[] }> = ({ vo }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = frame / fps
  const all = vo.flatMap((c) => c.phrases.map((p) => ({ ...p, a: c.at + p.from, b: c.at + p.to })))
  // Hold each caption until the next phrase (or 0.6 s) — no blank flashes.
  const idx = all.findIndex((p, i) => {
    const next = all[i + 1]
    const end = next ? Math.min(next.a, p.b + 0.6) : p.b + 0.6
    return t >= p.a - 0.05 && t < end
  })
  if (idx < 0) return null
  const p = all[idx]
  const pop = springAt({ frame: frame - sec(p.a - 0.05), fps, config: SNAPPY })

  return (
    <div style={{ position: 'absolute', left: 70, right: 150, top: CAPTION_TOP, display: 'flex', justifyContent: 'center' }}>
      <div
        style={{
          padding: '18px 30px',
          borderRadius: 22,
          background: 'rgba(18, 10, 38, 0.82)',
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

// ── Backdrops ────────────────────────────────────────────────────────────────

/** Deep SmileFlow violet with a slow-drifting light, for the hook beats. */
export const BrandBackdrop: React.FC = () => {
  const frame = useCurrentFrame()
  const drift = Math.sin(frame / 70) * 6
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(165deg, ${BRAND.royal} 0%, ${BRAND.deep} 55%, #12062E 100%)` }} />
      <AbsoluteFill
        style={{ background: `radial-gradient(ellipse 75% 45% at ${50 + drift}% 30%, rgba(168,85,247,0.45), transparent 70%)` }}
      />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 35% at 50% 100%, rgba(124,58,237,0.35), transparent 70%)` }} />
      {/* Giant watermark of the mark — the brand present before the logo is. */}
      <div style={{ position: 'absolute', right: -260, bottom: -340, opacity: 0.06 }}>
        <SmileMark size={900} glass={false} color="#FFFFFF" />
      </div>
    </AbsoluteFill>
  )
}

/** The light studio of the brand film, with a violet bloom behind the hero. */
export const StudioBackdrop: React.FC<{ bloomY?: number }> = ({ bloomY = 42 }) => (
  <AbsoluteFill>
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${LIGHT.bgHigh} 0%, ${LIGHT.bg} 60%, ${LIGHT.bgFloor} 100%)` }} />
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 38% at 50% ${bloomY}%, rgba(147,51,234,0.16), transparent 70%)` }} />
  </AbsoluteFill>
)

// ── UI pieces ────────────────────────────────────────────────────────────────

/** A phone screen floating in the studio. Children render inside the screen. */
export const Phone: React.FC<{
  top: number
  height: number
  title: string
  subtitle?: string
  style?: React.CSSProperties
  children: React.ReactNode
}> = ({ top, height, title, subtitle, style, children }) => (
  <div
    style={{
      position: 'absolute',
      left: 540 - 330,
      top,
      width: 660,
      height,
      borderRadius: 64,
      background: '#FFFFFF',
      border: '10px solid #1B1230',
      boxShadow: '0 40px 90px rgba(36,20,66,0.22), 0 8px 20px rgba(36,20,66,0.10)',
      overflow: 'hidden',
      transformOrigin: 'top center',
      ...style,
      transform: `scale(1.1) ${style?.transform ?? ''}`,
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 14 }}>
      <div style={{ width: 150, height: 34, borderRadius: 20, background: '#1B1230' }} />
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 34px 18px', borderBottom: `1px solid ${LIGHT.border}` }}>
      <div
        style={{
          width: 62,
          height: 62,
          borderRadius: 31,
          background: BRAND.lilac,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <SmileMark size={40} />
      </div>
      <div>
        <div style={{ fontFamily: FONT, fontSize: 28, fontWeight: 700, color: LIGHT.ink }}>{title}</div>
        {subtitle && <div style={{ fontFamily: FONT, fontSize: 21, color: LIGHT.dim }}>{subtitle}</div>}
      </div>
    </div>
    <div style={{ padding: '26px 30px', display: 'flex', flexDirection: 'column', gap: 18 }}>{children}</div>
  </div>
)

/** A chat bubble that pops in at `at` (frames, scene-local). */
export const Bubble: React.FC<{ at: number; out?: boolean; children: React.ReactNode; meta?: string }> = ({
  at,
  out = true,
  children,
  meta,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  if (frame < at) return null
  const pop = springAt({ frame: frame - at, fps, config: SNAPPY })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: out ? 'flex-end' : 'flex-start' }}>
      <div
        style={{
          maxWidth: 480,
          padding: '18px 24px',
          borderRadius: 30,
          borderBottomRightRadius: out ? 8 : 30,
          borderBottomLeftRadius: out ? 30 : 8,
          background: out ? `linear-gradient(145deg, ${BRAND.light}, ${BRAND.violet})` : '#EFEDF5',
          color: out ? '#FFFFFF' : LIGHT.ink,
          fontFamily: FONT,
          fontSize: 27,
          lineHeight: 1.35,
          fontWeight: 500,
          opacity: pop,
          transform: `translateY(${(1 - pop) * 22}px) scale(${0.9 + pop * 0.1})`,
          transformOrigin: out ? 'bottom right' : 'bottom left',
        }}
      >
        {children}
      </div>
      {meta && (
        <div style={{ marginTop: 6, fontFamily: FONT, fontSize: 19, color: LIGHT.dim, opacity: ramp(frame, [at + 8, at + 18]) }}>
          {meta}
        </div>
      )}
    </div>
  )
}

/** Three typing dots, visible between `from` and `to` (scene-local frames). */
export const TypingDots: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const frame = useCurrentFrame()
  if (frame < from || frame >= to) return null
  return (
    <div style={{ display: 'flex' }}>
      <div style={{ display: 'flex', gap: 8, padding: '20px 24px', borderRadius: 30, borderBottomLeftRadius: 8, background: '#EFEDF5' }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              background: LIGHT.dim,
              opacity: 0.35 + 0.65 * (0.5 + 0.5 * Math.sin((frame - from) / 3.2 - i * 1.1)),
            }}
          />
        ))}
      </div>
    </div>
  )
}

/** A row of reassurance chips (Loi 25 and friends). */
export const TrustChips: React.FC<{ labels: string[]; top: number; at: number }> = ({ labels, top, at }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return (
    <div style={{ position: 'absolute', left: 60, right: 60, top, display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
      {labels.map((label, i) => (
        <div
          key={label}
          style={{
            padding: '12px 22px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.94)',
            border: '1px solid rgba(124,58,237,0.24)',
            fontFamily: FONT,
            fontSize: 24,
            fontWeight: 600,
            color: LIGHT.ink,
            boxShadow: '0 8px 20px rgba(36,20,66,0.06)',
            ...enter(frame, fps, { delay: at + i * 5, y: 14, blur: 6, scale: 0.92, config: SNAPPY }),
          }}
        >
          {label}
        </div>
      ))}
    </div>
  )
}

// ── Action ───────────────────────────────────────────────────────────────────

/**
 * Closing beat shared by every ad: logo draws on, a two-line promise, the
 * Loi 25 line, then the demo CTA. Render it inside a <Sequence from={start}>;
 * `vo` is the closer clip's start in scene-local seconds.
 */
export const ActionScene: React.FC<{ line1: string; line2: string; vo: number; size?: number }> = ({ line1, line2, vo, size = 100 }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const T = (t: number) => sec(vo + t) // relative to the closer VO

  const draw = springAt({ frame: frame - T(0), fps, config: SMOOTH })
  const word = springAt({ frame: frame - T(0.3), fps, config: SMOOTH })
  const cta = springAt({ frame: frame - T(2.8), fps, config: SNAPPY })
  const glow = ramp(frame, [T(3.0), T(4.0)])

  return (
    <AbsoluteFill style={{ alignItems: 'center' }}>
      <StudioBackdrop bloomY={45} />

      <div style={{ position: 'absolute', top: 360, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <SmileFlowLockup size={118} draw={draw} wordmark={word} />

        <div
          style={{
            marginTop: 90,
            fontFamily: FONT,
            fontSize: size,
            fontWeight: 800,
            letterSpacing: '-0.045em',
            lineHeight: 1.03,
            textAlign: 'center',
            color: LIGHT.ink,
            ...enter(frame, fps, { delay: T(0.4), y: 30, blur: 14 }),
          }}
        >
          {line1}
          <br />
          <span style={{ color: LIGHT.violet }}>{line2}</span>
        </div>

        <div
          style={{
            marginTop: 40,
            padding: '12px 24px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.9)',
            border: '1px solid rgba(124,58,237,0.25)',
            fontFamily: FONT,
            fontSize: 26,
            fontWeight: 600,
            color: LIGHT.ink,
            ...enter(frame, fps, { delay: T(1.15), y: 16, blur: 8, scale: 0.9 }),
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
        <div style={{ marginTop: 34, fontFamily: FONT, fontSize: 36, fontWeight: 600, color: LIGHT.muted, ...enter(frame, fps, { delay: T(3.6), y: 12, blur: 6 }) }}>
          smileflow.ca
        </div>
      </div>
    </AbsoluteFill>
  )
}

/** Brief white bloom used to carry a cut from the brand violet into the studio. */
export const LightFlash: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame()
  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(ellipse 90% 60% at 50% 40%, #FFFFFF, rgba(255,255,255,0) 75%)',
        opacity: interpolate(frame, [sec(at - 0.5), sec(at), sec(at + 0.7)], [0, 0.95, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }),
      }}
    />
  )
}

/** 0→1 crossfade helper in seconds. */
export const fadeBetween = (frame: number, a: number, b: number) =>
  interpolate(frame, [sec(a), sec(b)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
