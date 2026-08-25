import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { COLORS } from '../theme'
import { enter, ramp, springAt, slowPush, SMOOTH } from '../motion'
import { WordReveal, Line } from '../ui/Type'
import { LogoMark } from '../ui/Logo'
import { FONT_FAMILY } from '../theme'
import { useLayout } from '../useLayout'

/**
 * Sequence 1 — Le Manifeste Humain (0–10s).
 *
 * The thesis beat. It opens on almost nothing — a violet halo breathing in the
 * dark — then the mark draws itself, then the claim lands word by word. Nothing
 * competes with the sentence; this is the only scene in the film with no UI.
 */
export const SceneManifesto: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const layout = useLayout()

  // The halo breathes for the whole scene — the "pulse" the brief asks for.
  const breathe = 0.5 + 0.5 * Math.sin(frame / 34)
  const haloIn = springAt({ frame, fps, delay: 0, config: SMOOTH })
  const haloScale = 0.72 + haloIn * 0.28 + breathe * 0.045
  const haloOpacity = ramp(frame, [0, 34]) * (0.5 + breathe * 0.5)

  // The mark's smile strokes on, then the whole lockup settles upward as the
  // headline takes the centre of the frame.
  const drawSpring = springAt({ frame, fps, delay: 12, config: SMOOTH })
  const markLift = springAt({ frame, fps, delay: 74, config: SMOOTH })

  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        transform: `scale(${slowPush(frame, durationInFrames, 0.03)})`,
      }}
    >
      {/* Breathing halo behind the mark. */}
      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          transform: `translateY(${-markLift * 150}px)`,
        }}
      >
        <div
          style={{
            width: 760,
            height: 760,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${COLORS.violetBright} 0%, rgba(124,58,237,0.35) 38%, transparent 68%)`,
            opacity: haloOpacity * 0.5,
            transform: `scale(${haloScale})`,
            filter: 'blur(12px)',
          }}
        />
      </AbsoluteFill>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: 1420,
          textAlign: 'center',
        }}
      >
        {/* The mark: draws on, then lifts and shrinks to make room for the claim. */}
        <div
          style={{
            transform: `translateY(${-markLift * 34}px) scale(${1 - markLift * 0.26})`,
            marginBottom: 54,
            opacity: ramp(frame, [4, 22]),
          }}
        >
          <LogoMark size={128} draw={drawSpring} />
        </div>

        <WordReveal
          text="L'IA ne remplacera jamais votre équipe."
          variant="hero"
          delay={82}
          stagger={4.5}
          scale={layout.heroScale}
          style={{
            textAlign: 'center',
            justifyContent: 'center',
            maxWidth: layout.portrait ? '100%' : 1320,
          }}
        />

        <div style={{ height: 34 }} />

        <Line delay={186} variant="subtitle" scale={layout.portrait ? 0.8 : 1} style={{ maxWidth: 1000 }}>
          Elle est là pour lui{' '}
          <span style={{ color: COLORS.text, fontWeight: 500 }}>redonner du temps.</span>
        </Line>

        {/* Wordmark signature, last in and quiet — it closes the statement. */}
        <div
          style={{
            marginTop: 62,
            fontFamily: FONT_FAMILY,
            fontSize: 25,
            fontWeight: 500,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            color: COLORS.dim,
            ...enter(frame, fps, { delay: 236, y: 12, blur: 8 }),
          }}
        >
          SmileFlow
        </div>
      </div>
    </AbsoluteFill>
  )
}
