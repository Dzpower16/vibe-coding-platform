import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { COLORS, FONT_FAMILY } from '../theme'
import { enter, ramp, springAt, slowPush, SNAPPY, POP } from '../motion'
import { WordReveal, Eyebrow, Line } from '../ui/Type'
import { Card, Chip, CheckMark } from '../ui/Card'
import { useLayout } from '../useLayout'

/** A chat bubble that springs in from its own side of the thread. */
const Bubble: React.FC<{
  side: 'in' | 'out'
  delay: number
  tone?: 'violet' | 'surface' | 'success'
  children: React.ReactNode
  meta?: string
}> = ({ side, delay, tone = 'surface', children, meta }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const s = springAt({ frame, fps, delay, config: SNAPPY })
  if (frame < delay) return null

  const tones = {
    violet: { bg: `linear-gradient(145deg, ${COLORS.violetBright}, ${COLORS.violet})`, fg: '#FFF' },
    surface: { bg: 'rgba(148,163,184,0.13)', fg: COLORS.text },
    success: { bg: `linear-gradient(145deg, #34D399, #10B981)`, fg: '#04241A' },
  }[tone]

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: side === 'out' ? 'flex-end' : 'flex-start',
        opacity: s,
        transform: `translateY(${(1 - s) * 18}px) scale(${0.9 + s * 0.1})`,
        transformOrigin: side === 'out' ? 'right bottom' : 'left bottom',
      }}
    >
      <div
        style={{
          maxWidth: 268,
          padding: '13px 17px',
          borderRadius: 19,
          borderBottomRightRadius: side === 'out' ? 6 : 19,
          borderBottomLeftRadius: side === 'in' ? 6 : 19,
          background: tones.bg,
          color: tones.fg,
          fontFamily: FONT_FAMILY,
          fontSize: 17,
          fontWeight: tone === 'success' ? 700 : 400,
          lineHeight: 1.4,
        }}
      >
        {children}
      </div>
      {meta && (
        <div
          style={{
            fontFamily: FONT_FAMILY,
            fontSize: 13,
            color: COLORS.dim,
            marginTop: 6,
            paddingInline: 4,
          }}
        >
          {meta}
        </div>
      )}
    </div>
  )
}

/** The three pulsing dots that die the instant the reply lands. */
const TypingDots: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const frame = useCurrentFrame()
  if (frame < from || frame >= to) return null
  return (
    <div
      style={{
        alignSelf: 'flex-start',
        display: 'flex',
        gap: 7,
        padding: '15px 19px',
        borderRadius: 19,
        borderBottomLeftRadius: 6,
        background: 'rgba(148,163,184,0.13)',
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: COLORS.muted,
            opacity: 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(frame / 4 - i * 0.9)),
          }}
        />
      ))}
    </div>
  )
}

/** Phone shell holding the waitlist thread. */
const Phone: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      width: 392,
      height: 748,
      borderRadius: 46,
      padding: 13,
      background: 'linear-gradient(160deg, #1E293B, #0B1120)',
      border: '1px solid rgba(148,163,184,0.2)',
      boxShadow: '0 40px 90px rgba(3,6,12,0.75), 0 0 60px rgba(147,51,234,0.18)',
      flexShrink: 0,
    }}
  >
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: 34,
        background: COLORS.bg,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Notch */}
      <div
        style={{
          position: 'absolute',
          top: 11,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 104,
          height: 24,
          borderRadius: 14,
          background: '#05080E',
          zIndex: 3,
        }}
      />
      {children}
    </div>
  </div>
)

/**
 * Sequence 3 — Smart Waitlist SMS (22–34s).
 *
 * A causal chain, one link per beat: the cancellation arrives, the broadcast
 * goes out, a patient answers, the slot re-locks. Nobody picks up a phone —
 * that absence is the point, so the "0 appel" stat closes the scene.
 */
export const SceneWaitlist: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const layout = useLayout()
  const alertIn = springAt({ frame, fps, delay: 104, config: POP })
  const slotFill = springAt({ frame, fps, delay: 268, config: SNAPPY })
  const statIn = springAt({ frame, fps, delay: 300, config: SNAPPY })

  // Clock runs while the broadcast is out, freezes the moment "OUI" lands.
  const elapsed = Math.min(Math.max(frame - 150, 0), 88)
  const seconds = Math.round(ramp(elapsed, [0, 88], [0, 58]))

  return (
    <AbsoluteFill
      style={{
        flexDirection: layout.direction,
        alignItems: 'center',
        justifyContent: 'center',
        padding: `0 ${layout.gutter}px`,
        gap: layout.portrait ? 40 : 64,
        transform: `scale(${slowPush(frame, durationInFrames, 0.026)})`,
      }}
    >
      {/* Left — the claim and the closing stat. */}
      <div
        style={{
          flex: layout.portrait ? 'none' : 1,
          width: layout.portrait ? '100%' : undefined,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Eyebrow delay={0}>Smart Waitlist</Eyebrow>
        <div style={{ height: 30 }} />
        <WordReveal
          text="Une annulation ? Fauteuil comblé en 60 secondes."
          variant="headline"
          delay={14}
          stagger={3.8}
          scale={layout.headlineScale}
          accentWords={['60', 'secondes.']}
          style={{ maxWidth: layout.portrait ? '100%' : 700 }}
        />
        <div style={{ height: 36 }} />
        <Line delay={92} variant="body" style={{ maxWidth: 600 }}>
          Dès qu&apos;une plage se libère, SmileFlow texte les bons patients en liste
          d&apos;attente — et reverrouille le créneau tout seul.
        </Line>

        {/* The absence that sells the feature. */}
        <div
          style={{
            marginTop: 54,
            display: 'flex',
            alignItems: 'center',
            gap: 26,
            opacity: statIn,
            transform: `translateY(${(1 - statIn) * 20}px)`,
          }}
        >
          <div
            style={{
              fontFamily: FONT_FAMILY,
              fontSize: 92,
              fontWeight: 700,
              letterSpacing: '-0.045em',
              lineHeight: 1,
              color: COLORS.violetLight,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            0
          </div>
          <div
            style={{
              fontFamily: FONT_FAMILY,
              fontSize: 25,
              fontWeight: 500,
              lineHeight: 1.3,
              color: COLORS.muted,
            }}
          >
            appel téléphonique
            <br />
            <span style={{ color: COLORS.dim, fontSize: 21 }}>pour la secrétaire</span>
          </div>
        </div>
      </div>

      {/* Centre — the phone running the thread. */}
      <div style={{ ...enter(frame, fps, { delay: 68, y: 44, blur: 16, scale: 0.95 }) }}>
        <Phone>
          {/* Thread header */}
          <div
            style={{
              padding: '46px 20px 15px',
              borderBottom: `1px solid ${COLORS.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: `linear-gradient(145deg, ${COLORS.violetLight}, ${COLORS.violet})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: FONT_FAMILY,
                fontSize: 15,
                fontWeight: 700,
                color: '#FFF',
              }}
            >
              MT
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: FONT_FAMILY,
                  fontSize: 16,
                  fontWeight: 600,
                  color: COLORS.text,
                }}
              >
                Marie Tremblay
              </div>
              <div style={{ fontFamily: FONT_FAMILY, fontSize: 13, color: COLORS.dim }}>
                Liste d&apos;attente · Hygiène
              </div>
            </div>
            {frame > 150 && (
              <div
                style={{
                  fontFamily: FONT_FAMILY,
                  fontSize: 14,
                  fontWeight: 600,
                  color: frame > 238 ? COLORS.success : COLORS.violetLight,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                0:{String(seconds).padStart(2, '0')}
              </div>
            )}
          </div>

          {/* Cancellation alert drops in first. */}
          <div style={{ padding: '14px 16px 0' }}>
            <div
              style={{
                padding: '13px 15px',
                borderRadius: 15,
                background: 'rgba(244,63,94,0.12)',
                border: '1px solid rgba(244,63,94,0.34)',
                display: 'flex',
                alignItems: 'center',
                gap: 11,
                opacity: alertIn,
                transform: `translateY(${(1 - alertIn) * -22}px)`,
              }}
            >
              <span style={{ fontSize: 17 }}>⚠</span>
              <div>
                <div
                  style={{
                    fontFamily: FONT_FAMILY,
                    fontSize: 15,
                    fontWeight: 600,
                    color: '#FDA4AF',
                  }}
                >
                  Annulation détectée
                </div>
                <div style={{ fontFamily: FONT_FAMILY, fontSize: 13, color: COLORS.dim }}>
                  Aujourd&apos;hui · 14 h 30 · Hygiène
                </div>
              </div>
            </div>
          </div>

          {/* The thread itself. */}
          <div
            style={{
              flex: 1,
              padding: '18px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 13,
              justifyContent: 'flex-end',
            }}
          >
            <Bubble side="out" delay={152} tone="violet" meta="Envoyé à 6 patients · 14 h 31">
              Bonjour Marie ! Une place vient de se libérer aujourd&apos;hui à 14 h 30. Ça vous
              intéresse ? Répondez OUI.
            </Bubble>
            <TypingDots from={200} to={236} />
            <Bubble side="in" delay={238} tone="success" meta="Reçu à 14 h 32">
              OUI
            </Bubble>
          </div>

          {/* Slot re-locked. */}
          <div style={{ padding: '0 16px 20px' }}>
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 15,
                background: 'rgba(52,211,153,0.12)',
                border: '1px solid rgba(52,211,153,0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                opacity: slotFill,
                transform: `scale(${0.94 + slotFill * 0.06})`,
              }}
            >
              <CheckMark size={28} progress={ramp(frame, [276, 296])} />
              <div
                style={{
                  fontFamily: FONT_FAMILY,
                  fontSize: 15,
                  fontWeight: 600,
                  color: COLORS.success,
                }}
              >
                Créneau reverrouillé
                <div style={{ fontWeight: 400, fontSize: 13, color: COLORS.dim, marginTop: 2 }}>
                  Confirmé en 58 secondes
                </div>
              </div>
            </div>
          </div>
        </Phone>
      </div>

      {/* Right — the agenda answering in real time. Landscape only: at 1080
          wide a third column would crush both neighbours. */}
      <div
        style={{
          display: layout.portrait ? 'none' : 'block',
          width: 330,
          ...enter(frame, fps, { delay: 118, y: 34, blur: 12 }),
        }}
      >
        <Card padding={26} focus={frame > 268}>
          <div
            style={{
              fontFamily: FONT_FAMILY,
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: '0.13em',
              textTransform: 'uppercase',
              color: COLORS.dim,
              marginBottom: 20,
            }}
          >
            Agenda · Mardi
          </div>
          {[
            { t: '13 h 00', name: 'L. Gagnon', state: 'booked' },
            { t: '13 h 45', name: 'P. Roy', state: 'booked' },
            { t: '14 h 30', name: 'Marie Tremblay', state: 'target' },
            { t: '15 h 15', name: 'S. Bouchard', state: 'booked' },
          ].map((row) => {
            const isTarget = row.state === 'target'
            const filled = isTarget ? slotFill : 1
            return (
              <div
                key={row.t}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 13,
                  padding: '13px 14px',
                  marginBottom: 9,
                  borderRadius: 13,
                  background: isTarget
                    ? `rgba(52,211,153,${0.05 + filled * 0.1})`
                    : 'rgba(148,163,184,0.05)',
                  border: isTarget
                    ? `1px ${filled > 0.5 ? 'solid' : 'dashed'} rgba(52,211,153,${0.25 + filled * 0.3})`
                    : `1px solid ${COLORS.border}`,
                }}
              >
                <div
                  style={{
                    fontFamily: FONT_FAMILY,
                    fontSize: 14,
                    fontWeight: 600,
                    color: COLORS.dim,
                    width: 54,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {row.t}
                </div>
                <div
                  style={{
                    flex: 1,
                    fontFamily: FONT_FAMILY,
                    fontSize: 15,
                    fontWeight: isTarget ? 600 : 400,
                    color: isTarget
                      ? filled > 0.5
                        ? COLORS.success
                        : COLORS.dim
                      : COLORS.muted,
                  }}
                >
                  {isTarget && filled < 0.5 ? 'Libre' : row.name}
                </div>
                {isTarget && filled > 0.5 && <CheckMark size={20} progress={filled} />}
              </div>
            )
          })}
          <div style={{ marginTop: 16, opacity: ramp(frame, [300, 324]) }}>
            <Chip tone="success" style={{ fontSize: 16, padding: '8px 15px' }}>
              Aucun trou dans la journée
            </Chip>
          </div>
        </Card>
      </div>
    </AbsoluteFill>
  )
}
