import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { LIGHT, FONT } from './lightTheme'
import { enter, ramp, springAt, slowPush, SNAPPY, POP } from '../motion'
import { LightWords, LightEyebrow, LightLine } from './LightType'
import { GlassCard, LightChip, LightCheck } from './LightStudio'

const Bubble: React.FC<{
  side: 'in' | 'out'
  delay: number
  tone?: 'violet' | 'grey' | 'success'
  children: React.ReactNode
  meta?: string
}> = ({ side, delay, tone = 'grey', children, meta }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const s = springAt({ frame, fps, delay, config: SNAPPY })
  if (frame < delay) return null

  const t = {
    violet: { bg: `linear-gradient(145deg, ${LIGHT.violetBright}, ${LIGHT.violet})`, fg: '#FFF' },
    grey: { bg: '#EFEEF4', fg: LIGHT.ink },
    success: { bg: `linear-gradient(145deg, #10B981, ${LIGHT.success})`, fg: '#FFFFFF' },
  }[tone]

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: side === 'out' ? 'flex-end' : 'flex-start',
        opacity: s,
        transform: `translateY(${(1 - s) * 16}px) scale(${0.92 + s * 0.08})`,
        transformOrigin: side === 'out' ? 'right bottom' : 'left bottom',
      }}
    >
      <div
        style={{
          maxWidth: 262,
          padding: '13px 17px',
          borderRadius: 19,
          borderBottomRightRadius: side === 'out' ? 6 : 19,
          borderBottomLeftRadius: side === 'in' ? 6 : 19,
          background: t.bg,
          color: t.fg,
          fontFamily: FONT,
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
            fontFamily: FONT,
            fontSize: 13,
            color: LIGHT.dim,
            marginTop: 5,
            paddingInline: 4,
          }}
        >
          {meta}
        </div>
      )}
    </div>
  )
}

const Typing: React.FC<{ from: number; to: number }> = ({ from, to }) => {
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
        background: '#EFEEF4',
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: LIGHT.dim,
            opacity: 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(frame / 4 - i * 0.9)),
          }}
        />
      ))}
    </div>
  )
}

/**
 * Smart Waitlist — a cancellation refills itself.
 *
 * One causal chain per beat: the alert lands, the broadcast goes out, a patient
 * answers, the slot re-locks. Nobody picks up a phone — that absence is the
 * argument, so the "0 appel" figure closes the scene.
 */
export const SceneWaitlistLight: React.FC<{ durationInFrames: number }> = ({
  durationInFrames,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const alertIn = springAt({ frame, fps, delay: 100, config: POP })
  const slot = springAt({ frame, fps, delay: 264, config: SNAPPY })
  const stat = springAt({ frame, fps, delay: 296, config: SNAPPY })
  const seconds = Math.round(ramp(Math.min(Math.max(frame - 146, 0), 88), [0, 88], [0, 58]))

  return (
    <AbsoluteFill
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 112px',
        gap: 60,
        transform: `scale(${slowPush(frame, durationInFrames, 0.024)})`,
      }}
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <LightEyebrow delay={0}>Smart Waitlist</LightEyebrow>
        <div style={{ height: 28 }} />
        <LightWords
          text="Une annulation ? Fauteuil comblé en 60 secondes."
          variant="headline"
          delay={12}
          stagger={3.8}
          accentWords={['60', 'secondes.']}
          style={{ maxWidth: 690 }}
        />
        <div style={{ height: 32 }} />
        <LightLine delay={88} variant="body" style={{ maxWidth: 590 }}>
          Dès qu&apos;une plage se libère, SmileFlow texte les bons patients en liste
          d&apos;attente — et reverrouille le créneau tout seul.
        </LightLine>

        <div
          style={{
            marginTop: 50,
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            opacity: stat,
            transform: `translateY(${(1 - stat) * 18}px)`,
          }}
        >
          <div
            style={{
              fontFamily: FONT,
              fontSize: 90,
              fontWeight: 700,
              letterSpacing: '-0.045em',
              lineHeight: 1,
              color: LIGHT.violet,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            0
          </div>
          <div style={{ fontFamily: FONT, fontSize: 24, fontWeight: 500, lineHeight: 1.3, color: LIGHT.muted }}>
            appel téléphonique
            <br />
            <span style={{ color: LIGHT.dim, fontSize: 20 }}>pour la secrétaire</span>
          </div>
        </div>
      </div>

      {/* Phone */}
      <div style={{ ...enter(frame, fps, { delay: 64, y: 40, blur: 16, scale: 0.95 }) }}>
        <div
          style={{
            width: 384,
            height: 736,
            borderRadius: 46,
            padding: 12,
            background: 'linear-gradient(160deg, #FFFFFF, #E8E6EF)',
            border: '1px solid rgba(36,20,66,0.10)',
            boxShadow: '0 40px 84px rgba(36,20,66,0.18), 0 0 50px rgba(147,51,234,0.10)',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 35,
              background: '#FBFBFD',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 10,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 102,
                height: 23,
                borderRadius: 14,
                background: '#DCDAE4',
                zIndex: 3,
              }}
            />
            <div
              style={{
                padding: '44px 19px 14px',
                borderBottom: `1px solid ${LIGHT.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: 11,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: `linear-gradient(145deg, ${LIGHT.violetLight}, ${LIGHT.violet})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: FONT,
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#FFF',
                }}
              >
                MT
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 600, color: LIGHT.ink }}>
                  Marie Tremblay
                </div>
                <div style={{ fontFamily: FONT, fontSize: 13, color: LIGHT.dim }}>
                  Liste d&apos;attente · Hygiène
                </div>
              </div>
              {frame > 146 && (
                <div
                  style={{
                    fontFamily: FONT,
                    fontSize: 14,
                    fontWeight: 600,
                    color: frame > 234 ? LIGHT.success : LIGHT.violet,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  0:{String(seconds).padStart(2, '0')}
                </div>
              )}
            </div>

            <div style={{ padding: '13px 15px 0' }}>
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 15,
                  background: 'rgba(225,29,72,0.07)',
                  border: '1px solid rgba(225,29,72,0.26)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  opacity: alertIn,
                  transform: `translateY(${(1 - alertIn) * -20}px)`,
                }}
              >
                <span style={{ fontSize: 16 }}>⚠</span>
                <div>
                  <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 600, color: '#BE123C' }}>
                    Annulation détectée
                  </div>
                  <div style={{ fontFamily: FONT, fontSize: 13, color: LIGHT.dim }}>
                    Aujourd&apos;hui · 14 h 30 · Hygiène
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                flex: 1,
                padding: '16px 15px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                justifyContent: 'flex-end',
              }}
            >
              <Bubble side="out" delay={148} tone="violet" meta="Envoyé à 6 patients · 14 h 31">
                Bonjour Marie ! Une place vient de se libérer aujourd&apos;hui à 14 h 30. Ça vous
                intéresse ? Répondez OUI.
              </Bubble>
              <Typing from={196} to={232} />
              <Bubble side="in" delay={234} tone="success" meta="Reçu à 14 h 32">
                OUI
              </Bubble>
            </div>

            <div style={{ padding: '0 15px 18px' }}>
              <div
                style={{
                  padding: '13px 15px',
                  borderRadius: 15,
                  background: 'rgba(15,157,110,0.08)',
                  border: '1px solid rgba(15,157,110,0.28)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 11,
                  opacity: slot,
                  transform: `scale(${0.95 + slot * 0.05})`,
                }}
              >
                <LightCheck size={26} progress={ramp(frame, [272, 292])} />
                <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 600, color: LIGHT.success }}>
                  Créneau reverrouillé
                  <div style={{ fontWeight: 400, fontSize: 13, color: LIGHT.dim, marginTop: 2 }}>
                    Confirmé en 58 secondes
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Agenda answering live */}
      <div style={{ width: 322, ...enter(frame, fps, { delay: 114, y: 32, blur: 12 }) }}>
        <GlassCard padding={24} focus={frame > 264}>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: '0.13em',
              textTransform: 'uppercase',
              color: LIGHT.dim,
              marginBottom: 18,
            }}
          >
            Agenda · Mardi
          </div>
          {[
            { t: '13 h 00', name: 'L. Gagnon', target: false },
            { t: '13 h 45', name: 'P. Roy', target: false },
            { t: '14 h 30', name: 'Marie Tremblay', target: true },
            { t: '15 h 15', name: 'S. Bouchard', target: false },
          ].map((r) => {
            const filled = r.target ? slot : 1
            return (
              <div
                key={r.t}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 13px',
                  marginBottom: 8,
                  borderRadius: 13,
                  background: r.target
                    ? `rgba(15,157,110,${0.04 + filled * 0.07})`
                    : 'rgba(36,20,66,0.035)',
                  border: r.target
                    ? `1px ${filled > 0.5 ? 'solid' : 'dashed'} rgba(15,157,110,${0.22 + filled * 0.28})`
                    : `1px solid ${LIGHT.border}`,
                }}
              >
                <div
                  style={{
                    fontFamily: FONT,
                    fontSize: 14,
                    fontWeight: 600,
                    color: LIGHT.dim,
                    width: 64,
                    whiteSpace: 'nowrap',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {r.t}
                </div>
                <div
                  style={{
                    flex: 1,
                    fontFamily: FONT,
                    fontSize: 15,
                    fontWeight: r.target ? 600 : 400,
                    color: r.target ? (filled > 0.5 ? LIGHT.success : LIGHT.dim) : LIGHT.muted,
                  }}
                >
                  {r.target && filled < 0.5 ? 'Libre' : r.name}
                </div>
                {r.target && filled > 0.5 && <LightCheck size={19} progress={filled} />}
              </div>
            )
          })}
          <div style={{ marginTop: 14, opacity: ramp(frame, [296, 320]) }}>
            <LightChip tone="success" style={{ fontSize: 15, padding: '8px 14px' }}>
              Aucun trou dans la journée
            </LightChip>
          </div>
        </GlassCard>
      </div>
    </AbsoluteFill>
  )
}
