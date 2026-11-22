import React from 'react'
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import { LIGHT, FONT } from '../brand/lightTheme'
import { SmileMark } from '../brand/LogoSmileFlow'
import { enter, ramp, springAt, SMOOTH, SNAPPY, POP } from '../motion'
import {
  AD_FPS,
  ActionScene,
  AdAudio,
  BRAND,
  BrandBackdrop,
  Captions,
  LightFlash,
  StudioBackdrop,
  TrustChips,
  VOClip,
  cueOf,
  endOf,
  fadeBetween,
  sec,
} from './shared'

/**
 * Pub Meta n°4 — Récap 3-en-1 (9:16).
 *
 *   A  Three pains drop in on brand violet, one per spoken beat: an empty
 *      chair, a pile of notes, a dull 3,9 ★ listing.
 *   I  « …mais Google, lui, le sait pas. » — the three cards hang there.
 *   D  Daylight studio: each card flips into its fix in turn — Smart
 *      Waitlist, Scribe IA, Avis Google — then « fonctionne avec votre
 *      logiciel » and the Loi 25 strip.
 *   A  « Trois tracas, une seule app. » Démo gratuite.
 *
 * The voice-over is assembled from phrases Mathieu already recorded for the
 * three single-feature ads (cut on silencedetect bounds), so the campaign
 * shares one voice and one script language.
 */

export const AD_RECAP_FPS = AD_FPS

const VO: VOClip[] = [
  { file: 'ads/recap/r1.mp3', at: 0.4, phrases: [{ from: 0.0, to: 1.3, text: 'Une chaise vide,' }] },
  { file: 'ads/recap/r2.mp3', at: 1.85, phrases: [{ from: 0.06, to: 2.05, text: 'pis vous êtes encore en train de taper vos notes?' }] },
  {
    file: 'ads/recap/r3.mp3',
    at: 4.45,
    phrases: [
      { from: 0.0, to: 1.64, text: 'Vos patients vous adorent…' },
      { from: 1.94, to: 4.2, text: 'mais Google, lui, le sait pas.' },
    ],
  },
  { file: 'ads/recap/r4.mp3', at: 9.4, phrases: [{ from: 0.0, to: 2.17, text: 'SmileFlow texte votre liste d’attente.' }] },
  {
    file: 'ads/recap/r6.mp3',
    at: 12.1,
    phrases: [
      { from: 0.0, to: 1.2, text: 'Trente secondes de dictée,' },
      { from: 1.38, to: 3.11, text: 'pis le brouillon SOAP est prêt.' },
    ],
  },
  {
    file: 'ads/recap/r7.mp3',
    at: 15.8,
    phrases: [
      { from: 0.0, to: 2.51, text: 'SmileFlow envoie un petit merci après chaque rendez-vous,' },
      { from: 2.73, to: 4.34, text: 'avec le lien vers vos avis Google.' },
    ],
  },
  {
    file: 'ads/recap/vo4.mp3',
    at: 20.75,
    phrases: [
      { from: 0.0, to: 0.88, text: 'SmileFlow,' },
      { from: 1.13, to: 2.6, text: 'conforme à la Loi 25.' },
      { from: 2.91, to: 4.28, text: 'Réservez votre démo gratuite.' },
    ],
  },
]

const cue = cueOf(VO)
const end = endOf(VO)

export const AD_RECAP_FRAMES = sec(VO[6].at + 5.1)

const DEMO_AT = VO[3].at - 0.4
const ACTION_AT = VO[6].at - 0.3

// Three slots shared by the pain cards and their fixes, so each fix lands
// exactly where its problem was.
const SLOT_TOP = [270, 555, 840]
const SLOT_H = 290
const LABEL = ['Smart Waitlist', 'Scribe IA', 'Avis Google']

const Stars: React.FC<{ value: number; size: number; off?: string }> = ({ value, size, off = '#D9D5E3' }) => (
  <div style={{ display: 'flex', gap: size * 0.1 }}>
    {[0, 1, 2, 3, 4].map((i) => {
      const fill = Math.max(0, Math.min(1, value - i))
      return (
        <div key={i} style={{ position: 'relative', width: size, height: size, fontSize: size, lineHeight: 1 }}>
          <span style={{ position: 'absolute', inset: 0, color: off }}>★</span>
          <span style={{ position: 'absolute', inset: 0, color: BRAND.gold, clipPath: `inset(0 ${(1 - fill) * 100}% 0 0)` }}>★</span>
        </div>
      )
    })}
  </div>
)

// ── Attention + Interest (brand violet) ──────────────────────────────────────
const PainCard: React.FC<{ i: number; at: number; pulse?: number; children: React.ReactNode }> = ({ i, at, pulse = 0, children }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const drop = springAt({ frame: frame - at, fps, config: POP })
  const rot = [-2.2, 1.6, -1.2][i]
  return (
    <div
      style={{
        position: 'absolute',
        left: 80,
        right: 80,
        top: SLOT_TOP[i],
        height: SLOT_H - 25,
        borderRadius: 34,
        background: 'rgba(255,255,255,0.10)',
        border: `1px solid rgba(255,255,255,${0.16 + pulse * 0.3})`,
        boxShadow: pulse > 0 ? `0 0 ${40 * pulse}px rgba(255,122,107,${0.45 * pulse})` : '0 24px 50px rgba(10,0,40,0.35)',
        display: 'flex',
        alignItems: 'center',
        gap: 30,
        padding: '0 40px',
        opacity: Math.min(1, drop * 1.3),
        transform: `translateY(${(1 - drop) * -120}px) rotate(${rot * drop}deg) scale(${0.9 + drop * 0.1})`,
      }}
    >
      {children}
    </div>
  )
}

const HookScene: React.FC = () => {
  const frame = useCurrentFrame()
  const google = ramp(frame, [sec(cue(2, 1)), sec(cue(2, 1) + 0.3)])
  const pulse = google * (0.5 + 0.5 * Math.sin((frame - sec(cue(2, 1))) / 4))
  const notes = Math.round(interpolate(frame, [sec(cue(1, 0)), sec(cue(1, 0) + 1.6)], [3, 12], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))

  return (
    <AbsoluteFill>
      <BrandBackdrop />

      <PainCard i={0} at={sec(cue(0, 0))}>
        <div style={{ fontSize: 86 }}>💺</div>
        <div>
          <div style={{ fontFamily: FONT, fontSize: 30, fontWeight: 600, color: BRAND.lilac }}>9 h 00 · Annulé</div>
          <div style={{ fontFamily: FONT, fontSize: 82, fontWeight: 800, letterSpacing: '-0.04em', color: BRAND.coral, lineHeight: 1.05 }}>−325 $</div>
        </div>
      </PainCard>

      <PainCard i={1} at={sec(cue(1, 0))}>
        <div style={{ fontSize: 86 }}>📄</div>
        <div>
          <div style={{ fontFamily: FONT, fontSize: 30, fontWeight: 600, color: BRAND.lilac }}>22 h 13 · encore au bureau</div>
          <div style={{ fontFamily: FONT, fontSize: 66, fontWeight: 800, letterSpacing: '-0.035em', color: BRAND.white, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
            {notes} notes en retard
          </div>
        </div>
      </PainCard>

      <PainCard i={2} at={sec(cue(2, 0))} pulse={pulse}>
        <div style={{ fontSize: 86, color: BRAND.gold }}>★</div>
        <div>
          <div style={{ fontFamily: FONT, fontSize: 30, fontWeight: 600, color: BRAND.lilac }}>Avis Google</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <span style={{ fontFamily: FONT, fontSize: 70, fontWeight: 800, color: BRAND.white }}>3,9</span>
            <Stars value={3.9} size={40} off="rgba(255,255,255,0.25)" />
          </div>
          <div style={{ fontFamily: FONT, fontSize: 26, color: google > 0.5 ? BRAND.coral : 'rgba(255,255,255,0.65)', fontWeight: 600 }}>
            23 avis · dernier il y a 5 mois
          </div>
        </div>
      </PainCard>
    </AbsoluteFill>
  )
}

// ── Desire (light studio) ────────────────────────────────────────────────────
const FixCard: React.FC<{ i: number; at: number; done: number; doneLabel: string; children: React.ReactNode }> = ({
  i,
  at,
  done,
  doneLabel,
  children,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const flip = springAt({ frame: frame - at, fps, config: SMOOTH })
  const active = frame >= at
  return (
    <div
      style={{
        position: 'absolute',
        left: 80,
        right: 80,
        top: SLOT_TOP[i],
        height: SLOT_H - 25,
        borderRadius: 34,
        background: '#FFFFFF',
        border: `2px solid ${active ? `rgba(124,58,237,${0.18 + 0.5 * (1 - done)})` : LIGHT.border}`,
        boxShadow: active ? '0 26px 60px rgba(36,20,66,0.14)' : '0 10px 24px rgba(36,20,66,0.05)',
        padding: '24px 34px',
        opacity: flip,
        transform: `perspective(1400px) rotateX(${(1 - flip) * 70}deg) scale(${0.94 + flip * 0.06})`,
        transformOrigin: 'center top',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <SmileMark size={34} />
          <span style={{ fontFamily: FONT, fontSize: 26, fontWeight: 700, color: LIGHT.violet }}>{LABEL[i]}</span>
        </div>
        <div
          style={{
            padding: '8px 16px',
            borderRadius: 999,
            background: '#E8F7F0',
            fontFamily: FONT,
            fontSize: 22,
            fontWeight: 700,
            color: LIGHT.success,
            opacity: done,
            transform: `scale(${0.7 + done * 0.3})`,
          }}
        >
          ✓ {doneLabel}
        </div>
      </div>
      <div style={{ marginTop: 16, opacity: flip }}>{children}</div>
    </div>
  )
}

const DemoScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const L = (t: number) => sec(t - DEMO_AT)

  // Waitlist
  const smsOut = springAt({ frame: frame - L(cue(3, 0) + 0.3), fps, config: SNAPPY })
  const smsIn = springAt({ frame: frame - L(end(3, 0) - 0.2), fps, config: SNAPPY })
  const waitDone = springAt({ frame: frame - L(end(3, 0) + 0.4), fps, config: POP })

  // Scribe
  const t = interpolate(frame, [L(cue(4, 0)), L(end(4, 0))], [0, 30], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const soap = (k: number) => springAt({ frame: frame - L(cue(4, 1) + k * 0.28), fps, config: SNAPPY })
  const scribeDone = springAt({ frame: frame - L(end(4, 1) - 0.1), fps, config: POP })

  // Avis
  const thanks = springAt({ frame: frame - L(cue(5, 0) + 0.3), fps, config: SNAPPY })
  const climb = interpolate(frame, [L(cue(5, 1)), L(end(5, 1) + 0.3)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (x) => 1 - Math.pow(1 - x, 3),
  })
  const avisDone = springAt({ frame: frame - L(end(5, 1)), fps, config: POP })

  const pmsIn = enter(frame, fps, { delay: L(end(4, 1) + 0.3), y: 14, blur: 6, scale: 0.94 })

  return (
    <AbsoluteFill>
      <StudioBackdrop bloomY={38} />

      <FixCard i={0} at={L(cue(3, 0))} done={waitDone} doneLabel="Comblée en 4 min">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ alignSelf: 'flex-end', maxWidth: 560, padding: '12px 20px', borderRadius: 24, borderBottomRightRadius: 6, background: `linear-gradient(145deg, ${BRAND.light}, ${BRAND.violet})`, color: '#FFF', fontFamily: FONT, fontSize: 25, fontWeight: 500, opacity: smsOut, transform: `translateY(${(1 - smsOut) * 14}px)` }}>
            Une place s’est libérée à 9 h — ça vous intéresse?
          </div>
          <div style={{ alignSelf: 'flex-start', padding: '12px 20px', borderRadius: 24, borderBottomLeftRadius: 6, background: '#EFEDF5', color: LIGHT.ink, fontFamily: FONT, fontSize: 25, fontWeight: 600, opacity: smsIn, transform: `translateY(${(1 - smsIn) * 14}px)` }}>
            Marie : OUI! J’arrive 🙌
          </div>
        </div>
      </FixCard>

      <FixCard i={1} at={L(cue(4, 0))} done={scribeDone} doneLabel="Brouillon prêt">
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ fontFamily: FONT, fontSize: 44, fontWeight: 800, color: LIGHT.ink, fontVariantNumeric: 'tabular-nums', width: 120 }}>
            0:{String(Math.round(t)).padStart(2, '0')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, height: 70, flex: 1 }}>
            {new Array(30).fill(0).map((_, k) => {
              const live = frame >= L(cue(4, 0)) && frame < L(end(4, 0) + 0.2)
              const h = live ? 10 + Math.abs(Math.sin(frame / 3 + k * 0.7) * Math.sin(k * 1.3 + frame / 7)) * 56 : 8
              return <div key={k} style={{ width: 8, height: h, borderRadius: 4, background: LIGHT.violetLight, opacity: 0.8 }} />
            })}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
          {['S', 'O', 'A', 'P'].map((l, k) => (
            <div
              key={l}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                borderRadius: 14,
                background: LIGHT.violetWash,
                opacity: soap(k),
                transform: `translateY(${(1 - soap(k)) * 14}px)`,
              }}
            >
              <span style={{ width: 34, height: 34, borderRadius: 10, background: LIGHT.violet, color: '#FFF', fontFamily: FONT, fontWeight: 800, fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{l}</span>
              <span style={{ flex: 1, height: 10, borderRadius: 5, background: 'rgba(124,58,237,0.22)' }} />
            </div>
          ))}
        </div>
      </FixCard>

      <FixCard i={2} at={L(cue(5, 0))} done={avisDone} doneLabel="Note en hausse">
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <div style={{ flex: 1, padding: '12px 18px', borderRadius: 20, background: '#F6F4FB', fontFamily: FONT, fontSize: 23, color: LIGHT.ink, opacity: thanks, transform: `translateY(${(1 - thanks) * 14}px)` }}>
            Merci de votre visite, Julie! 😊 Un avis nous aiderait beaucoup.
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: FONT, fontSize: 56, fontWeight: 800, color: LIGHT.ink, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {(3.9 + climb * 0.9).toFixed(1).replace('.', ',')}
            </div>
            <Stars value={3.9 + climb * 0.9} size={28} />
            <div style={{ fontFamily: FONT, fontSize: 20, color: LIGHT.dim, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{Math.round(23 + climb * 124)} avis</div>
          </div>
        </div>
      </FixCard>

      <div style={{ position: 'absolute', left: 0, right: 0, top: 1128, display: 'flex', justifyContent: 'center', ...pmsIn }}>
        <div style={{ padding: '12px 26px', borderRadius: 999, background: LIGHT.violet, color: '#FFF', fontFamily: FONT, fontSize: 25, fontWeight: 700, boxShadow: '0 12px 28px rgba(124,58,237,0.3)' }}>
          Fonctionne avec Progident et Dentitek
        </div>
      </div>
      <TrustChips labels={['🛡 Conforme Loi 25', 'Hébergé au Québec', 'Consentement patient']} top={1200} at={L(cue(5, 1))} />
    </AbsoluteFill>
  )
}

// ── Film ─────────────────────────────────────────────────────────────────────
export const AdRecap: React.FC = () => {
  const frame = useCurrentFrame()
  const demo = fadeBetween(frame, DEMO_AT - 0.2, DEMO_AT + 0.25)
  const action = fadeBetween(frame, ACTION_AT - 0.2, ACTION_AT + 0.3)

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.deep }}>
      <AdAudio music="ads/recap/music.mp3" vo={VO} frames={AD_RECAP_FRAMES} />

      {demo < 1 && (
        <AbsoluteFill style={{ opacity: 1 - demo }}>
          <HookScene />
        </AbsoluteFill>
      )}
      {demo > 0 && action < 1 && (
        <Sequence from={sec(DEMO_AT)}>
          <AbsoluteFill style={{ opacity: demo }}>
            <DemoScene />
          </AbsoluteFill>
        </Sequence>
      )}
      <LightFlash at={DEMO_AT} />
      {action > 0 && (
        <Sequence from={sec(ACTION_AT)}>
          <AbsoluteFill style={{ opacity: action }}>
            <ActionScene line1="Trois tracas," line2="une seule app." vo={0.3} />
          </AbsoluteFill>
        </Sequence>
      )}

      <Captions vo={VO} />
    </AbsoluteFill>
  )
}
