import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { COLORS, FONT_FAMILY } from '../theme'
import { enter, ramp, springAt, SNAPPY, SMOOTH } from '../motion'
import { WordReveal, Eyebrow, Line } from '../ui/Type'
import { Chip } from '../ui/Card'
import { LogoLockup } from '../ui/Logo'
import { useLayout } from '../useLayout'

/** Shield that strokes its own outline on, then fills. */
const Shield: React.FC<{ draw: number; size?: number }> = ({ draw, size = 116 }) => (
  <div style={{ position: 'relative', width: size, height: size }}>
    <div
      style={{
        position: 'absolute',
        inset: -22,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${COLORS.violetBright}, transparent 66%)`,
        opacity: draw * 0.42,
        filter: 'blur(14px)',
      }}
    />
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={{ position: 'relative' }}>
      <path
        d="M24 4L40 10V23C40 33.5 33 41.5 24 44C15 41.5 8 33.5 8 23V10L24 4Z"
        fill={`rgba(147,51,234,${draw * 0.16})`}
        stroke={COLORS.violetLight}
        strokeWidth={2.2}
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - draw}
      />
      <path
        d="M17 24L22 29L31.5 19"
        stroke={COLORS.violetLight}
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
 * Sequence 5 — Souveraineté, Loi 25 & Appel à l'action (46–60s).
 *
 * Two beats in one scene. The trust half answers the objection a Québec clinic
 * actually has (where does my data live, and do I have to migrate?), then
 * clears out so the ask owns an empty frame. The last two seconds are fully
 * still — the CTA has to survive a muted, autoplaying feed.
 */
export const SceneOutro: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const layout = useLayout()

  // The trust half owns 0–210, then hands the frame over.
  const trustOut = ramp(frame, [196, 222], [1, 0])
  const shieldDraw = springAt({ frame, fps, delay: 84, config: SMOOTH })

  const ctaGlow = springAt({ frame, fps, delay: 318, config: SNAPPY })
  const buttonBorder = ramp(frame, [322, 358])
  const logoIn = springAt({ frame, fps, delay: 288, config: SMOOTH })

  return (
    <AbsoluteFill>
      {/* ── Beat A — the trust answer ───────────────────────────────── */}
      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          opacity: trustOut,
          transform: `scale(${1 - (1 - trustOut) * 0.06})`,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            maxWidth: 1340,
          }}
        >
          <div style={{ ...enter(frame, fps, { delay: 76, y: 20, blur: 12 }), marginBottom: 40 }}>
            <Shield draw={shieldDraw} size={112} />
          </div>

          <Eyebrow delay={0} style={{ justifyContent: 'center' }}>
            Souveraineté des données
          </Eyebrow>
          <div style={{ height: 28 }} />

          <WordReveal
            text="100 % conforme Loi 25."
            variant="hero"
            delay={16}
            stagger={4.5}
            scale={layout.heroScale}
            style={{ textAlign: 'center', justifyContent: 'center' }}
          />
          <div style={{ height: 22 }} />
          <Line delay={78} variant="subtitle">
            Données hébergées{' '}
            <span style={{ color: COLORS.text, fontWeight: 500 }}>au Québec</span>, consentement
            patient explicite.
          </Line>

          {/* Compatibility — the objection killer. */}
          <div
            style={{
              display: 'flex',
              gap: 14,
              marginTop: 52,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {['Zéro migration', 'Progident', 'Dentitek', 'LogiDent'].map((label, i) => {
              const s = springAt({ frame, fps, delay: 132 + i * 11, config: SNAPPY })
              return (
                <div
                  key={label}
                  style={{ opacity: s, transform: `translateY(${(1 - s) * 16}px)` }}
                >
                  <Chip
                    tone={i === 0 ? 'success' : 'neutral'}
                    style={{ fontSize: 22, padding: '13px 26px' }}
                  >
                    {i === 0 ? '✓ ' : ''}
                    {label}
                  </Chip>
                </div>
              )
            })}
          </div>
        </div>
      </AbsoluteFill>

      {/* ── Beat B — the ask, on an empty frame ─────────────────────── */}
      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          opacity: ramp(frame, [216, 246]),
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
          {/* Logo lands first and holds — the mark owns the close. */}
          <div
            style={{
              opacity: logoIn,
              transform: `translateY(${(1 - logoIn) * 20}px) scale(${0.92 + logoIn * 0.08})`,
              marginBottom: 46,
            }}
          >
            <LogoLockup size={78} draw={1} />
          </div>

          <WordReveal
            text="Rejoignez la nouvelle ère clinique."
            variant="hero"
            delay={230}
            stagger={4.5}
            scale={layout.heroScale}
            accentWords={['nouvelle', 'ère']}
            style={{
              textAlign: 'center',
              justifyContent: 'center',
              maxWidth: layout.portrait ? '100%' : 1280,
            }}
          />

          {/* CTA button — border strokes on, glow blooms a beat behind. */}
          <div
            style={{
              marginTop: 58,
              position: 'relative',
              opacity: ctaGlow,
              transform: `translateY(${(1 - ctaGlow) * 26}px)`,
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: -18,
                borderRadius: 999,
                background: `radial-gradient(ellipse, ${COLORS.violetBright}, transparent 70%)`,
                opacity: buttonBorder * 0.55,
                filter: 'blur(22px)',
              }}
            />
            <div
              style={{
                position: 'relative',
                padding: layout.portrait ? '22px 34px' : '26px 58px',
                borderRadius: 999,
                background: `linear-gradient(145deg, ${COLORS.violetLight} 0%, ${COLORS.violetBright} 50%, ${COLORS.violet} 100%)`,
                fontFamily: FONT_FAMILY,
                fontSize: layout.portrait ? 25 : 32,
                fontWeight: 600,
                letterSpacing: '-0.018em',
                textAlign: 'center',
                color: '#FFFFFF',
                boxShadow: `0 20px 54px rgba(124,58,237,${0.36 * buttonBorder}), inset 0 1px 0 rgba(255,255,255,0.28)`,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              Réserver une démo gratuite de 14 jours
              <span
                style={{
                  display: 'inline-block',
                  transform: `translateX(${ramp(frame, [340, 366], [-6, 0])}px)`,
                }}
              >
                →
              </span>
            </div>
          </div>

          <div
            style={{
              marginTop: 40,
              fontFamily: FONT_FAMILY,
              fontSize: 30,
              fontWeight: 500,
              letterSpacing: '0.03em',
              color: COLORS.muted,
              ...enter(frame, fps, { delay: 352, y: 14, blur: 8 }),
            }}
          >
            smileflow.ca
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
