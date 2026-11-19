import React from 'react'
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import { LIGHT, FONT } from '../brand/lightTheme'
import { enter, ramp, springAt, SMOOTH, SNAPPY, POP } from '../motion'
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
  SAFE_TOP,
  StudioBackdrop,
  TrustChips,
  TypingDots,
  VOClip,
  cueOf,
  endOf,
  fadeBetween,
  sec,
} from './shared'

/**
 * Pub Meta n°2 — Smart Waitlist (9:16).
 *
 *   A  8 h 52, mercredi matin. A text lands: the 9 h patient cancels — the
 *      slot tears out of the agenda. (Brand violet.)
 *   I  « Une chaise vide » — the empty slot fills the frame, −325 $ counts up…
 *      « à moins que votre agenda se remplisse tout seul. »
 *   D  Daylight studio: SmileFlow texts the waitlist, Marie answers OUI, the
 *      slot is confirmed — 4 min, 0 appel. Loi 25 strip.
 *   A  « Plus jamais de chaise vide. » Démo gratuite.
 */

export const AD_WAITLIST_FPS = AD_FPS

const VO: VOClip[] = [
  {
    file: 'ads/waitlist/vo1.mp3',
    at: 0.4,
    phrases: [
      { from: 0.0, to: 1.09, text: '8 h 52.' },
      { from: 1.49, to: 2.81, text: 'Votre patiente de 9 h…' },
      { from: 3.09, to: 3.52, text: 'annule.' },
    ],
  },
  {
    file: 'ads/waitlist/vo2.mp3',
    at: 4.5,
    phrases: [
      { from: 0.09, to: 1.34, text: 'Une chaise vide,' },
      { from: 1.43, to: 3.25, text: 'c’est 325 $ qui partent…' },
      { from: 3.66, to: 5.9, text: 'à moins que votre agenda se remplisse tout seul.' },
    ],
  },
  {
    file: 'ads/waitlist/vo3.mp3',
    at: 11.0,
    phrases: [
      { from: 0.0, to: 2.1, text: 'SmileFlow texte votre liste d’attente.' },
      { from: 2.4, to: 3.6, text: 'Marie répond oui.' },
      { from: 4.0, to: 5.9, text: 'Plage comblée en 4 minutes…' },
      { from: 6.3, to: 8.2, text: 'pis personne a touché au téléphone.' },
    ],
  },
  {
    file: 'ads/waitlist/vo4.mp3',
    at: 19.7,
    phrases: [
      { from: 0.0, to: 0.88, text: 'SmileFlow,' },
      { from: 1.13, to: 2.6, text: 'conforme à la Loi 25.' },
      { from: 2.91, to: 4.28, text: 'Réservez votre démo gratuite.' },
    ],
  },
]

const cue = cueOf(VO)
const end = endOf(VO)

export const AD_WAITLIST_FRAMES = sec(VO[3].at + 5.4)

const DEMO_AT = VO[2].at - 0.45 // light flash peak
const ACTION_AT = VO[3].at - 0.3

// ── Hook + Interest (brand violet) ───────────────────────────────────────────
const ROWS = [
  { time: '8 h 00', who: 'M. Côté', what: 'Examen' },
  { time: '9 h 00', who: 'Mme Roy', what: 'Nettoyage' },
  { time: '10 h 00', who: 'J. Pelletier', what: 'Obturation' },
]

const HookScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const clockIn = springAt({ frame: frame - sec(cue(0, 0) - 0.1), fps, config: SMOOTH })
  const colon = Math.floor(frame / 15) % 2 === 0 ? 1 : 0.3
  const notif = springAt({ frame: frame - sec(cue(0, 1) - 0.15), fps, config: SNAPPY })
  const agendaIn = enter(frame, fps, { delay: sec(cue(0, 0) + 0.5), y: 50, blur: 12 })

  // « annule. » — the 9 h row tears out.
  const tear = springAt({ frame: frame - sec(cue(0, 2)), fps, config: POP })
  const shake = frame >= sec(cue(0, 2)) && frame < sec(cue(0, 2)) + 9 ? Math.sin(frame * 2.4) * 7 * (1 - (frame - sec(cue(0, 2))) / 9) : 0

  // Interest: everything else steps back, the empty slot takes the frame.
  const focus = springAt({ frame: frame - sec(cue(1, 0) - 0.1), fps, config: SMOOTH })
  const loss = Math.round(interpolate(frame, [sec(cue(1, 1)), sec(cue(1, 1) + 1.2)], [0, 325], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))
  const lossIn = springAt({ frame: frame - sec(cue(1, 1)), fps, config: SNAPPY })
  // « à moins que… » — the hole starts to glow violet: hope.
  const hope = ramp(frame, [sec(cue(1, 2)), sec(end(1, 2))])

  const ROW_H = 118
  const AGENDA_TOP = 800

  return (
    <AbsoluteFill>
      <BrandBackdrop />

      {/* Clock */}
      <div
        style={{
          position: 'absolute',
          top: SAFE_TOP + 20,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: clockIn * (1 - focus),
          transform: `scale(${0.88 + clockIn * 0.12}) translateY(${-focus * 40}px)`,
          filter: `blur(${(1 - clockIn) * 12}px)`,
        }}
      >
        <div style={{ fontFamily: FONT, fontSize: 230, fontWeight: 200, letterSpacing: '-0.04em', color: BRAND.white, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          8<span style={{ opacity: colon }}>:</span>52
        </div>
        <div style={{ marginTop: 16, fontFamily: FONT, fontSize: 30, fontWeight: 600, letterSpacing: '0.18em', color: BRAND.lilac, textTransform: 'uppercase' }}>
          Mercredi matin
        </div>
      </div>

      {/* The cancellation text */}
      <div
        style={{
          position: 'absolute',
          left: 70,
          right: 70,
          top: 590,
          opacity: notif * (1 - focus),
          transform: `translateY(${(1 - notif) * -60 - focus * 40}px) scale(${0.94 + notif * 0.06})`,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 20,
            alignItems: 'center',
            padding: '24px 28px',
            borderRadius: 34,
            background: 'rgba(255,255,255,0.94)',
            boxShadow: '0 24px 60px rgba(10,0,40,0.45)',
          }}
        >
          <div style={{ width: 70, height: 70, borderRadius: 18, background: '#34C759', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38 }}>💬</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: FONT, fontSize: 25, fontWeight: 700, color: LIGHT.ink }}>
              <span>Mme Roy</span>
              <span style={{ fontWeight: 500, color: LIGHT.dim, fontSize: 21 }}>maintenant</span>
            </div>
            <div style={{ fontFamily: FONT, fontSize: 26, color: LIGHT.muted, marginTop: 4 }}>Désolée, je pourrai pas venir à 9 h ce matin 😕</div>
          </div>
        </div>
      </div>

      {/* Agenda */}
      <div style={{ position: 'absolute', left: 90, right: 90, top: AGENDA_TOP, ...agendaIn }}>
        <div style={{ fontFamily: FONT, fontSize: 24, fontWeight: 700, letterSpacing: '0.14em', color: BRAND.lilac, opacity: 0.8 * (1 - focus), marginBottom: 16 }}>
          AGENDA · FAUTEUIL 2
        </div>
        {ROWS.map((r, i) => {
          const isHole = i === 1
          if (isHole) return <div key={r.time} style={{ height: ROW_H }} />
          return (
            <div
              key={r.time}
              style={{
                height: ROW_H - 14,
                marginBottom: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 26,
                padding: '0 30px',
                borderRadius: 24,
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.14)',
                opacity: 1 - focus,
              }}
            >
              <span style={{ fontFamily: FONT, fontSize: 28, fontWeight: 600, color: BRAND.lilac, width: 120 }}>{r.time}</span>
              <span style={{ fontFamily: FONT, fontSize: 30, fontWeight: 600, color: BRAND.white }}>{r.who}</span>
              <span style={{ fontFamily: FONT, fontSize: 26, color: 'rgba(255,255,255,0.6)' }}>· {r.what}</span>
            </div>
          )
        })}
      </div>

      {/* The 9 h slot — booked, then torn, then the hero of the Interest beat. */}
      {(() => {
        const baseTop = AGENDA_TOP + 40 + ROW_H
        const top = baseTop + (500 - baseTop) * focus
        const scale = 1 + focus * 0.05
        return (
          <div
            style={{
              position: 'absolute',
              left: 90,
              right: 90,
              top,
              height: ROW_H - 14,
              transform: `translateX(${shake}px) scale(${scale})`,
              opacity: Number(agendaIn.opacity ?? 1),
            }}
          >
            {/* Booked state */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 26,
                padding: '0 30px',
                borderRadius: 24,
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.14)',
                opacity: 1 - tear,
                transform: `translateY(${tear * 30}px) rotate(${tear * -4}deg)`,
              }}
            >
              <span style={{ fontFamily: FONT, fontSize: 28, fontWeight: 600, color: BRAND.lilac, width: 120 }}>9 h 00</span>
              <span style={{ fontFamily: FONT, fontSize: 30, fontWeight: 600, color: BRAND.white }}>Mme Roy</span>
              <span style={{ fontFamily: FONT, fontSize: 26, color: 'rgba(255,255,255,0.6)' }}>· Nettoyage</span>
            </div>
            {/* Empty state */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 26,
                padding: '0 30px',
                borderRadius: 24,
                border: `3px dashed ${hope > 0 ? `rgba(196,160,255,${0.6 + hope * 0.4})` : 'rgba(255,122,107,0.85)'}`,
                background: `rgba(255,122,107,${0.10 * (1 - hope)})`,
                boxShadow: hope > 0 ? `0 0 ${50 * hope}px rgba(168,85,247,${0.7 * hope})` : 'none',
                opacity: Math.min(1, tear * 1.4),
              }}
            >
              <span style={{ fontFamily: FONT, fontSize: 28, fontWeight: 600, color: BRAND.lilac, width: 120 }}>9 h 00</span>
              <span style={{ fontFamily: FONT, fontSize: 30, fontWeight: 700, color: hope > 0.5 ? BRAND.lilac : BRAND.coral }}>
                {hope > 0.5 ? 'Plage à combler…' : 'Annulé · plage libre'}
              </span>
            </div>
          </div>
        )
      })()}

      {/* −325 $ */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 720,
          textAlign: 'center',
          opacity: lossIn * (1 - hope * 0.55),
          transform: `translateY(${(1 - lossIn) * 30}px) scale(${0.9 + lossIn * 0.1})`,
        }}
      >
        <div style={{ fontFamily: FONT, fontSize: 210, fontWeight: 800, letterSpacing: '-0.05em', color: BRAND.coral, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          −{loss} $
        </div>
        <div style={{ marginTop: 18, fontFamily: FONT, fontSize: 32, fontWeight: 500, color: BRAND.lilac }}>par plage d’hygiène perdue</div>
      </div>
    </AbsoluteFill>
  )
}

// ── Desire (light studio) ────────────────────────────────────────────────────
const DemoScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  // Scene-local frames: this scene is mounted at DEMO_AT.
  const L = (t: number) => sec(t - DEMO_AT)

  const phoneIn = enter(frame, fps, { delay: L(DEMO_AT + 0.1), y: 80, blur: 14 })
  const sysChip = springAt({ frame: frame - L(cue(2, 0)), fps, config: SNAPPY })
  const confirm = springAt({ frame: frame - L(cue(2, 1) + 0.55), fps, config: SMOOTH })
  const check = springAt({ frame: frame - L(cue(2, 1) + 0.75), fps, config: POP })
  const statA = springAt({ frame: frame - L(cue(2, 2)), fps, config: SNAPPY })
  const statB = springAt({ frame: frame - L(cue(2, 3)), fps, config: SNAPPY })
  const minutes = Math.round(interpolate(frame, [L(cue(2, 2)), L(cue(2, 2) + 0.9)], [0, 4], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))

  return (
    <AbsoluteFill>
      <StudioBackdrop bloomY={40} />

      <Phone top={270} height={850} title="SmileFlow" subtitle="Liste d’attente intelligente" style={phoneIn}>
        <div style={{ display: 'flex', justifyContent: 'center', opacity: sysChip, transform: `scale(${0.9 + sysChip * 0.1})` }}>
          <div style={{ padding: '10px 20px', borderRadius: 999, background: BRAND.lilac, fontFamily: FONT, fontSize: 21, fontWeight: 600, color: LIGHT.violet }}>
            ⚡ Annulation 9 h 00 · 3 patients contactés
          </div>
        </div>

        <Bubble at={L(cue(2, 0) + 0.45)} meta="Envoyé · 8 h 53">
          Bonjour Marie! Une place s’est libérée ce matin à 9 h avec Dre Tremblay. Ça vous intéresse? Répondez OUI 😊
        </Bubble>

        <TypingDots from={L(cue(2, 0) + 1.4)} to={L(cue(2, 1))} />
        <Bubble at={L(cue(2, 1))} out={false} meta="Marie Gagnon · 8 h 56">
          OUI! J’arrive 🙌
        </Bubble>

        {/* Confirmation */}
        <div
          style={{
            marginTop: 4,
            padding: '22px 26px',
            borderRadius: 26,
            background: '#F3FBF7',
            border: '1px solid rgba(15,157,110,0.25)',
            opacity: confirm,
            transform: `translateY(${(1 - confirm) * 24}px)`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                background: LIGHT.success,
                color: '#FFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                fontWeight: 800,
                transform: `scale(${check})`,
              }}
            >
              ✓
            </div>
            <div>
              <div style={{ fontFamily: FONT, fontSize: 27, fontWeight: 700, color: LIGHT.ink }}>9 h 00 · Marie Gagnon</div>
              <div style={{ fontFamily: FONT, fontSize: 21, color: LIGHT.success, fontWeight: 600 }}>Confirmée · agenda mis à jour</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
            <div style={{ flex: 1, padding: '12px 14px', borderRadius: 16, background: '#FFF', textAlign: 'center', opacity: statA, transform: `scale(${0.85 + statA * 0.15})` }}>
              <div style={{ fontFamily: FONT, fontSize: 34, fontWeight: 800, color: LIGHT.violet, fontVariantNumeric: 'tabular-nums' }}>{minutes} min</div>
              <div style={{ fontFamily: FONT, fontSize: 19, color: LIGHT.dim, fontWeight: 600 }}>pour combler</div>
            </div>
            <div style={{ flex: 1, padding: '12px 14px', borderRadius: 16, background: '#FFF', textAlign: 'center', opacity: statB, transform: `scale(${0.85 + statB * 0.15})` }}>
              <div style={{ fontFamily: FONT, fontSize: 34, fontWeight: 800, color: LIGHT.violet }}>0 appel</div>
              <div style={{ fontFamily: FONT, fontSize: 19, color: LIGHT.dim, fontWeight: 600 }}>à la réception</div>
            </div>
          </div>
        </div>
      </Phone>

      <TrustChips labels={['🛡 Conforme Loi 25', 'Consentement SMS', 'Hébergé au Québec']} top={1232} at={L(cue(2, 3) + 0.2)} />
    </AbsoluteFill>
  )
}

// ── Film ─────────────────────────────────────────────────────────────────────
export const AdWaitlist: React.FC = () => {
  const frame = useCurrentFrame()
  const demo = fadeBetween(frame, DEMO_AT - 0.2, DEMO_AT + 0.25)
  const action = fadeBetween(frame, ACTION_AT - 0.2, ACTION_AT + 0.3)

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.deep }}>
      <AdAudio music="ads/waitlist/music.mp3" vo={VO} frames={AD_WAITLIST_FRAMES} />

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
            <ActionScene line1="Plus jamais de" line2="chaise vide." vo={0.3} />
          </AbsoluteFill>
        </Sequence>
      )}

      <Captions vo={VO} />
    </AbsoluteFill>
  )
}
