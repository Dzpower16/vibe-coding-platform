import React from 'react'
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import { LIGHT, FONT } from '../brand/lightTheme'
import { SmileMark } from '../brand/LogoSmileFlow'
import { enter, hashNoise, ramp, springAt, SMOOTH, SNAPPY, POP } from '../motion'
import {
  AD_FPS,
  ActionScene,
  AdAudio,
  BRAND,
  BrandBackdrop,
  Bubble,
  Captions,
  LightFlash,
  Phone,
  StudioBackdrop,
  TrustChips,
  VOClip,
  cueOf,
  endOf,
  fadeBetween,
  sec,
} from './shared'

/**
 * Pub Meta n°3 — Avis Google (9:16).
 *
 *   A  Patients' love floats up in brand violet… « mais Google, lui, le sait
 *      pas » — a dull 3,9 ★ listing with 23 reviews lands in the middle of it.
 *   I  After the visit everyone's happy… and nobody leaves a review.
 *   D  Daylight studio: SmileFlow's thank-you text after every appointment,
 *      one tap, five stars — the rating climbs to 4,8. Loi 25 strip.
 *   A  « Laissez vos patients parler pour vous. » Démo gratuite.
 *
 * Every patient gets the same invitation (no review gating — Google policy).
 */

export const AD_AVIS_FPS = AD_FPS

const VO: VOClip[] = [
  {
    file: 'ads/avis/vo1.mp3',
    at: 0.4,
    phrases: [
      { from: 0.0, to: 1.6, text: 'Vos patients vous adorent…' },
      { from: 2.0, to: 3.8, text: 'mais Google, lui, le sait pas.' },
    ],
  },
  {
    file: 'ads/avis/vo2.mp3',
    at: 4.7,
    phrases: [
      { from: 0.0, to: 1.11, text: 'Après la visite,' },
      { from: 1.21, to: 2.13, text: 'tout le monde est content…' },
      { from: 2.69, to: 5.05, text: 'pis personne pense à laisser un avis.' },
    ],
  },
  {
    file: 'ads/avis/vo3.mp3',
    at: 10.3,
    phrases: [
      { from: 0.0, to: 3.0, text: 'SmileFlow envoie un petit merci après chaque rendez-vous,' },
      { from: 3.2, to: 5.0, text: 'avec le lien vers vos avis Google.' },
      { from: 5.4, to: 6.0, text: 'Un clic…' },
      { from: 6.4, to: 8.2, text: 'pis votre note monte toute seule.' },
    ],
  },
  {
    file: 'ads/avis/vo4.mp3',
    at: 19.0,
    phrases: [
      { from: 0.0, to: 0.88, text: 'SmileFlow,' },
      { from: 1.13, to: 2.6, text: 'conforme à la Loi 25.' },
      { from: 2.91, to: 4.28, text: 'Réservez votre démo gratuite.' },
    ],
  },
]

const cue = cueOf(VO)
const end = endOf(VO)

export const AD_AVIS_FRAMES = sec(VO[3].at + 5.4)

const DEMO_AT = VO[2].at - 0.45
const ACTION_AT = VO[3].at - 0.3

// ── Stars ────────────────────────────────────────────────────────────────────
/** Five stars; `value` 0–5 fills them left to right (fractional allowed). */
const Stars: React.FC<{ value: number; size: number; on?: string; off?: string }> = ({ value, size, on = BRAND.gold, off = '#D9D5E3' }) => (
  <div style={{ display: 'flex', gap: size * 0.12 }}>
    {[0, 1, 2, 3, 4].map((i) => {
      const fill = Math.max(0, Math.min(1, value - i))
      return (
        <div key={i} style={{ position: 'relative', width: size, height: size, fontSize: size, lineHeight: 1 }}>
          <span style={{ position: 'absolute', inset: 0, color: off }}>★</span>
          <span style={{ position: 'absolute', inset: 0, color: on, clipPath: `inset(0 ${(1 - fill) * 100}% 0 0)` }}>★</span>
        </div>
      )
    })}
  </div>
)

/** The listing card as it shows in a Google search — plain, no logo. */
const ListingCard: React.FC<{ rating: number; count: number; dull?: number; lastReview?: string; pulse?: number }> = ({
  rating,
  count,
  dull = 0,
  lastReview,
  pulse = 0,
}) => (
  <div
    style={{
      padding: '30px 34px',
      borderRadius: 30,
      background: '#FFFFFF',
      boxShadow: '0 30px 70px rgba(10,0,40,0.35)',
      filter: `saturate(${1 - dull * 0.8})`,
    }}
  >
    <div style={{ fontFamily: FONT, fontSize: 20, fontWeight: 700, letterSpacing: '0.12em', color: LIGHT.dim }}>AVIS GOOGLE</div>
    <div style={{ marginTop: 8, fontFamily: FONT, fontSize: 36, fontWeight: 700, color: LIGHT.ink }}>Clinique Dentaire Sourire</div>
    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
      <span style={{ fontFamily: FONT, fontSize: 44, fontWeight: 800, color: LIGHT.ink, fontVariantNumeric: 'tabular-nums' }}>
        {rating.toFixed(1).replace('.', ',')}
      </span>
      <Stars value={rating} size={40} />
      <span style={{ fontFamily: FONT, fontSize: 28, color: LIGHT.muted, fontVariantNumeric: 'tabular-nums' }}>({count} avis)</span>
    </div>
    <div style={{ marginTop: 6, fontFamily: FONT, fontSize: 24, color: LIGHT.dim }}>Dentiste · Laval</div>
    {lastReview && (
      <div
        style={{
          marginTop: 18,
          display: 'inline-block',
          padding: '10px 18px',
          borderRadius: 999,
          background: `rgba(255,122,107,${0.12 + pulse * 0.18})`,
          fontFamily: FONT,
          fontSize: 23,
          fontWeight: 600,
          color: '#C2410C',
        }}
      >
        {lastReview}
      </div>
    )}
  </div>
)

// ── Hook + Interest (brand violet) ───────────────────────────────────────────
const LOVE = ['Merci Dre Tremblay! 😊', 'Meilleure clinique en ville 🦷', 'Mes enfants ont même pas eu peur!']

const HookScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const google = springAt({ frame: frame - sec(cue(0, 1) + 0.15), fps, config: SMOOTH })
  const visit = springAt({ frame: frame - sec(cue(1, 0) - 0.1), fps, config: SMOOTH })
  const happy = springAt({ frame: frame - sec(cue(1, 1)), fps, config: POP })
  const nobody = ramp(frame, [sec(cue(1, 2)), sec(cue(1, 2) + 0.4)])
  const pulse = 0.5 + 0.5 * Math.sin((frame - sec(cue(1, 2))) / 4)
  const exit = ramp(frame, [sec(cue(1, 2) + 0.6), sec(end(1, 2) + 0.2)])

  return (
    <AbsoluteFill>
      <BrandBackdrop />

      {/* Love rising — little smile marks floating up, deterministic. */}
      {new Array(22).fill(0).map((_, i) => {
        const born = sec(0.2) + i * 4
        const life = frame - born
        if (life < 0) return null
        const x = 80 + hashNoise(i, 1) * 920
        const speed = 3.2 + hashNoise(i, 2) * 2.4
        const y = 1500 - life * speed
        const size = 34 + hashNoise(i, 3) * 40
        const fade = Math.min(1, life / 12) * interpolate(y, [250, 450], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              opacity: fade * 0.55 * (1 - google * 0.7),
              transform: `rotate(${(hashNoise(i, 4) - 0.5) * 30}deg)`,
            }}
          >
            {i % 3 === 0 ? (
              <span style={{ fontSize: size, color: '#F9A8D4' }}>♥</span>
            ) : (
              <SmileMark size={size} glass={false} color="#E9DDFF" />
            )}
          </div>
        )
      })}

      {/* Patient love notes */}
      {LOVE.map((txt, i) => {
        const at = sec(cue(0, 0) + i * 0.45)
        const pop = springAt({ frame: frame - at, fps, config: SNAPPY })
        const left = [90, 300, 140][i]
        const top = [330, 470, 610][i]
        return (
          <div
            key={txt}
            style={{
              position: 'absolute',
              left,
              top,
              padding: '18px 26px',
              borderRadius: 30,
              borderBottomLeftRadius: 8,
              background: 'rgba(255,255,255,0.95)',
              fontFamily: FONT,
              fontSize: 30,
              fontWeight: 600,
              color: LIGHT.ink,
              boxShadow: '0 16px 40px rgba(10,0,40,0.35)',
              opacity: pop * (1 - google * 0.55) * (1 - visit),
              transform: `translateY(${(1 - pop) * 26 - visit * 40}px) scale(${0.9 + pop * 0.1})`,
            }}
          >
            {txt}
          </div>
        )
      })}

      {/* Interest: the happy patient leaving */}
      <div
        style={{
          position: 'absolute',
          left: 90,
          right: 90,
          top: 360,
          opacity: visit * (1 - exit),
          transform: `translateY(${(1 - visit) * 40}px)`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '26px 30px', borderRadius: 30, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}>
          <div style={{ width: 96, height: 96, borderRadius: 48, background: BRAND.lilac, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 + happy * 16 }}>
            {happy > 0.3 ? '😊' : '🙂'}
          </div>
          <div>
            <div style={{ fontFamily: FONT, fontSize: 32, fontWeight: 700, color: BRAND.white }}>Julie L.</div>
            <div style={{ fontFamily: FONT, fontSize: 25, color: BRAND.lilac }}>Nettoyage · terminé ✓</div>
          </div>
          <div style={{ marginLeft: 'auto', fontFamily: FONT, fontSize: 24, fontWeight: 600, color: BRAND.lilac, opacity: ramp(frame, [sec(cue(1, 1)), sec(cue(1, 1) + 0.3)]) }}>
            Au revoir! 👋
          </div>
        </div>
      </div>

      {/* The listing — the gap between reality and Google. */}
      <div
        style={{
          position: 'absolute',
          left: 70,
          right: 70,
          top: 760,
          opacity: google * (1 - exit * 0.3),
          transform: `translateY(${(1 - google) * 90}px) scale(${0.94 + google * 0.06})`,
        }}
      >
        <ListingCard
          rating={3.9}
          count={23}
          dull={google}
          lastReview={nobody > 0 ? 'Dernier avis : il y a 5 mois' : undefined}
          pulse={nobody * pulse}
        />
      </div>
    </AbsoluteFill>
  )
}

// ── Desire (light studio) ────────────────────────────────────────────────────
const REVIEW = 'Équipe super douce, je recommande!'

const DemoScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const L = (t: number) => sec(t - DEMO_AT)

  const phoneIn = enter(frame, fps, { delay: L(DEMO_AT + 0.1), y: 80, blur: 14 })
  const sysChip = springAt({ frame: frame - L(cue(2, 0)), fps, config: SNAPPY })
  const linkIn = springAt({ frame: frame - L(cue(2, 1)), fps, config: SNAPPY })
  const tap = frame >= L(cue(2, 2)) && frame < L(cue(2, 2)) + 5
  const sheet = springAt({ frame: frame - L(cue(2, 2) + 0.15), fps, config: SMOOTH })
  const stars = interpolate(frame, [L(cue(2, 2) + 0.35), L(cue(2, 2) + 1.0)], [0, 5], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const typed = REVIEW.slice(0, Math.floor(interpolate(frame, [L(cue(2, 2) + 0.9), L(cue(2, 3) + 0.4)], [0, REVIEW.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })))

  // « votre note monte toute seule » — the listing returns, rating climbing.
  const climbIn = springAt({ frame: frame - L(cue(2, 3)), fps, config: SMOOTH })
  const climb = interpolate(frame, [L(cue(2, 3) + 0.2), L(end(2, 3) + 0.4)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (x) => 1 - Math.pow(1 - x, 3),
  })

  return (
    <AbsoluteFill>
      <StudioBackdrop bloomY={40} />

      <Phone
        top={270}
        height={850}
        title="Clinique Dentaire Sourire"
        subtitle="via SmileFlow"
        style={{ ...phoneIn, transform: `${phoneIn.transform ?? ''} scale(${1 - climbIn * 0.06})`, filter: climbIn > 0 ? `blur(${climbIn * 3}px)` : phoneIn.filter }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', opacity: sysChip, transform: `scale(${0.9 + sysChip * 0.1})` }}>
          <div style={{ padding: '10px 20px', borderRadius: 999, background: BRAND.lilac, fontFamily: FONT, fontSize: 21, fontWeight: 600, color: LIGHT.violet }}>
            ✓ Rendez-vous terminé · Julie L.
          </div>
        </div>

        <Bubble at={L(cue(2, 0) + 0.4)} meta="Envoyé automatiquement · 11 h 42">
          Merci de votre visite aujourd’hui, Julie! 😊 Si vous avez 30 secondes, votre avis aide d’autres familles à nous trouver.
        </Bubble>

        {/* Review link card */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', opacity: linkIn, transform: `translateY(${(1 - linkIn) * 20}px)` }}>
          <div
            style={{
              width: 440,
              padding: '20px 24px',
              borderRadius: 26,
              background: '#FFFFFF',
              border: `2px solid ${tap ? LIGHT.violet : 'rgba(124,58,237,0.22)'}`,
              boxShadow: '0 10px 26px rgba(36,20,66,0.10)',
              transform: `scale(${tap ? 0.96 : 1})`,
            }}
          >
            <Stars value={5} size={30} />
            <div style={{ marginTop: 8, fontFamily: FONT, fontSize: 26, fontWeight: 700, color: LIGHT.ink }}>Laisser un avis Google</div>
            <div style={{ fontFamily: FONT, fontSize: 20, color: LIGHT.dim }}>g.page/sourire-laval</div>
          </div>
        </div>

        {/* The review sheet, sliding up over the thread */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            padding: '30px 34px 44px',
            borderTopLeftRadius: 36,
            borderTopRightRadius: 36,
            background: '#FFFFFF',
            boxShadow: '0 -20px 50px rgba(36,20,66,0.16)',
            transform: `translateY(${(1 - sheet) * 110}%)`,
          }}
        >
          <div style={{ fontFamily: FONT, fontSize: 24, fontWeight: 700, color: LIGHT.dim, letterSpacing: '0.08em' }}>VOTRE AVIS</div>
          <div style={{ marginTop: 14 }}>
            <Stars value={stars} size={64} />
          </div>
          <div
            style={{
              marginTop: 20,
              minHeight: 70,
              padding: '16px 20px',
              borderRadius: 18,
              background: '#F6F4FB',
              fontFamily: FONT,
              fontSize: 27,
              color: LIGHT.ink,
            }}
          >
            {typed}
            <span style={{ opacity: Math.floor(frame / 8) % 2 ? 1 : 0, color: LIGHT.violet }}>|</span>
          </div>
        </div>
      </Phone>

      {/* Rating climbing */}
      <div
        style={{
          position: 'absolute',
          left: 70,
          right: 70,
          top: 560,
          opacity: climbIn,
          transform: `translateY(${(1 - climbIn) * 60}px) scale(${0.92 + climbIn * 0.08})`,
        }}
      >
        <ListingCard rating={3.9 + climb * 0.9} count={Math.round(23 + climb * 124)} />
      </div>

      <TrustChips labels={['🛡 Conforme Loi 25', 'Consentement patient', 'Désabonnement en 1 clic']} top={1232} at={L(cue(2, 3) + 0.3)} />
    </AbsoluteFill>
  )
}

// ── Film ─────────────────────────────────────────────────────────────────────
export const AdAvis: React.FC = () => {
  const frame = useCurrentFrame()
  const demo = fadeBetween(frame, DEMO_AT - 0.2, DEMO_AT + 0.25)
  const action = fadeBetween(frame, ACTION_AT - 0.2, ACTION_AT + 0.3)

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.deep }}>
      <AdAudio music="ads/avis/music.mp3" vo={VO} frames={AD_AVIS_FRAMES} />

      {demo < 1 && (
        <AbsoluteFill style={{ opacity: 1 - demo }}>
          <HookScene />
        </AbsoluteFill>
      )}
      {demo > 0 && action < 1 && (
        <Sequence from={sec(DEMO_AT)}>
          <AbsoluteFill style={{ opacity: demo * (1 - action) }}>
            <DemoScene />
          </AbsoluteFill>
        </Sequence>
      )}
      <LightFlash at={DEMO_AT} />
      {action > 0 && (
        <Sequence from={sec(ACTION_AT)}>
          <AbsoluteFill style={{ opacity: action }}>
            <ActionScene line1="Laissez vos patients" line2="parler pour vous." vo={0.3} size={84} />
          </AbsoluteFill>
        </Sequence>
      )}

      <Captions vo={VO} />
    </AbsoluteFill>
  )
}
