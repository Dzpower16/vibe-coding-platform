import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { LIGHT, FONT } from './lightTheme'
import { enter, ramp, springAt, SNAPPY, SMOOTH } from '../motion'
import { LightWords, LightEyebrow, LightLine } from './LightType'
import { LightChip } from './LightStudio'
import { SmileFlowLockup } from './LogoSmileFlow'

/** Shield that strokes its own outline on, then stamps its check. */
const Shield: React.FC<{ draw: number; size?: number }> = ({ draw, size = 104 }) => (
  <div style={{ position: 'relative', width: size, height: size }}>
    <div
      style={{
        position: 'absolute',
        inset: -20,
        borderRadius: '50%',
        background: `radial-gradient(circle, rgba(147,51,234,0.30), transparent 66%)`,
        opacity: draw * 0.7,
        filter: 'blur(14px)',
      }}
    />
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={{ position: 'relative' }}>
      <path
        d="M24 4L40 10V23C40 33.5 33 41.5 24 44C15 41.5 8 33.5 8 23V10L24 4Z"
        fill={`rgba(124,58,237,${draw * 0.10})`}
        stroke={LIGHT.violet}
        strokeWidth={2.2}
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - draw}
      />
      <path
        d="M17 24L22 29L31.5 19"
        stroke={LIGHT.violet}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - Math.max(0, (draw - 0.55) / 0.45)}
      />
    </svg>
  </div>
)

/**
 * Loi 25 & l'appel à l'action.
 *
 * Two beats. The trust half answers the objection a Québec clinic actually has
 * — where does my data live, and do I have to migrate? — then clears so the ask
 * owns an empty frame. The mark redraws itself here, echoing the opening sting,
 * and the last second is fully still for a muted autoplay read.
 */
export const SceneOutroLight: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const trustOut = ramp(frame, [150, 176], [1, 0])
  const shield = springAt({ frame, fps, delay: 62, config: SMOOTH })

  // The mark strokes itself on again — the callback to the 3D sting.
  const markDraw = springAt({ frame, fps, delay: 186, config: SMOOTH })
  const wordmark = springAt({ frame, fps, delay: 214, config: SMOOTH })
  const ctaIn = springAt({ frame, fps, delay: 258, config: SNAPPY })
  const glow = ramp(frame, [262, 296])

  return (
    <AbsoluteFill>
      {/* Beat A — trust */}
      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          opacity: trustOut,
          transform: `scale(${1 - (1 - trustOut) * 0.05})`,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            maxWidth: 1320,
          }}
        >
          <div style={{ ...enter(frame, fps, { delay: 54, y: 18, blur: 11 }), marginBottom: 34 }}>
            <Shield draw={shield} size={100} />
          </div>
          <LightEyebrow delay={0} style={{ justifyContent: 'center' }}>
            Souveraineté des données
          </LightEyebrow>
          <div style={{ height: 24 }} />
          <LightWords
            text="100 % conforme Loi 25."
            variant="hero"
            delay={12}
            stagger={4.2}
            style={{ textAlign: 'center', justifyContent: 'center' }}
          />
          <div style={{ height: 20 }} />
          <LightLine delay={62}>
            Données hébergées{' '}
            <span style={{ color: LIGHT.ink, fontWeight: 500 }}>au Québec</span>, consentement
            patient explicite.
          </LightLine>

          <div
            style={{
              display: 'flex',
              gap: 13,
              marginTop: 44,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {['Zéro migration', 'Progident', 'Dentitek', 'LogiDent'].map((label, i) => {
              const s = springAt({ frame, fps, delay: 100 + i * 10, config: SNAPPY })
              return (
                <div key={label} style={{ opacity: s, transform: `translateY(${(1 - s) * 14}px)` }}>
                  <LightChip
                    tone={i === 0 ? 'success' : 'neutral'}
                    style={{ fontSize: 21, padding: '12px 24px' }}
                  >
                    {i === 0 ? '✓ ' : ''}
                    {label}
                  </LightChip>
                </div>
              )
            })}
          </div>
        </div>
      </AbsoluteFill>

      {/* Beat B — the ask */}
      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          opacity: ramp(frame, [170, 198]),
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <div style={{ marginBottom: 42 }}>
            <SmileFlowLockup size={86} draw={markDraw} wordmark={wordmark} />
          </div>

          <LightWords
            text="Rejoignez la nouvelle ère clinique."
            variant="hero"
            delay={222}
            stagger={4.2}
            accentWords={['nouvelle', 'ère']}
            style={{ textAlign: 'center', justifyContent: 'center', maxWidth: 1240 }}
          />

          <div
            style={{
              marginTop: 50,
              position: 'relative',
              opacity: ctaIn,
              transform: `translateY(${(1 - ctaIn) * 22}px)`,
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: -16,
                borderRadius: 999,
                background: 'radial-gradient(ellipse, rgba(147,51,234,0.5), transparent 70%)',
                opacity: glow * 0.6,
                filter: 'blur(20px)',
              }}
            />
            <div
              style={{
                position: 'relative',
                padding: '25px 56px',
                borderRadius: 999,
                background: `linear-gradient(145deg, ${LIGHT.violetLight} 0%, ${LIGHT.violetBright} 50%, ${LIGHT.violet} 100%)`,
                fontFamily: FONT,
                fontSize: 31,
                fontWeight: 600,
                letterSpacing: '-0.018em',
                color: '#FFFFFF',
                boxShadow: `0 18px 44px rgba(124,58,237,${0.34 * glow}), inset 0 1px 0 rgba(255,255,255,0.32)`,
                display: 'flex',
                alignItems: 'center',
                gap: 15,
              }}
            >
              Réserver une démo gratuite de 14 jours
              <span
                style={{
                  display: 'inline-block',
                  transform: `translateX(${ramp(frame, [280, 304], [-6, 0])}px)`,
                }}
              >
                →
              </span>
            </div>
          </div>

          <div
            style={{
              marginTop: 34,
              fontFamily: FONT,
              fontSize: 29,
              fontWeight: 500,
              letterSpacing: '0.03em',
              color: LIGHT.muted,
              ...enter(frame, fps, { delay: 292, y: 12, blur: 7 }),
            }}
          >
            smileflow.ca
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
