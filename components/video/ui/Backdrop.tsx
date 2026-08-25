import React from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { COLORS } from '../theme'

interface BackdropProps {
  /** Drives the ambient drift. Pass the scene-local frame. */
  frame?: number
  /** 0 = no glow, 1 = full. Scenes dim this when a card should dominate. */
  glow?: number
  /**
   * 0→1 across the whole film. The two blooms travel continuously through a
   * set of layouts instead of jumping per scene, so the ground reads as one
   * uninterrupted camera rather than five separate backgrounds.
   */
  progress?: number
  children?: React.ReactNode
}

/**
 * The shared ground for every scene: a deep slate gradient, two slowly
 * breathing violet blooms, and a fine grid that keeps the dark from reading
 * as flat black. The blooms drift on a sine of the frame, which stays
 * deterministic under Remotion's out-of-order rendering.
 */
const LAYOUTS: Array<{ ax: number; ay: number; bx: number; by: number }> = [
  { ax: 50, ay: 44, bx: 50, by: 50 },
  { ax: 26, ay: 36, bx: 80, by: 72 },
  { ax: 76, ay: 32, bx: 22, by: 76 },
  { ax: 32, ay: 74, bx: 72, by: 28 },
  { ax: 50, ay: 60, bx: 50, by: 24 },
]

/** Blend between the layout keyframes so the blooms glide instead of cutting. */
function layoutAt(progress: number) {
  const t = Math.min(Math.max(progress, 0), 1) * (LAYOUTS.length - 1)
  const i = Math.min(Math.floor(t), LAYOUTS.length - 2)
  const f = t - i
  // Smoothstep keeps the drift from starting and stopping abruptly.
  const e = f * f * (3 - 2 * f)
  const a = LAYOUTS[i]
  const b = LAYOUTS[i + 1]
  return {
    ax: a.ax + (b.ax - a.ax) * e,
    ay: a.ay + (b.ay - a.ay) * e,
    bx: a.bx + (b.bx - a.bx) * e,
    by: a.by + (b.by - a.by) * e,
  }
}

export const Backdrop: React.FC<BackdropProps> = ({
  frame: frameProp,
  glow = 1,
  progress = 0,
  children,
}) => {
  const localFrame = useCurrentFrame()
  const frame = frameProp ?? localFrame

  // Two blooms, offset in phase so the field never pulses as one lump.
  const breathA = 0.5 + 0.5 * Math.sin(frame / 62)
  const breathB = 0.5 + 0.5 * Math.sin(frame / 47 + 2.1)

  const l = layoutAt(progress)

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, overflow: 'hidden' }}>
      {/* Base vertical gradient — lifts the middle of the frame off pure black. */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(175deg, ${COLORS.bg} 0%, ${COLORS.bgAlt} 55%, ${COLORS.bg} 100%)`,
        }}
      />

      {/* Fine grid — invisible as a texture, but it stops the dark reading flat. */}
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(rgba(148,163,184,0.055) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(148,163,184,0.055) 1px, transparent 1px)`,
          backgroundSize: '120px 120px',
          maskImage: 'radial-gradient(ellipse 75% 65% at 50% 45%, black 20%, transparent 78%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 75% 65% at 50% 45%, black 20%, transparent 78%)',
        }}
      />

      {/* Primary violet bloom. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 58% 52% at ${l.ax}% ${l.ay}%, ${COLORS.violetBright}, transparent 66%)`,
          opacity: glow * (0.2 + 0.1 * breathA),
          filter: 'blur(20px)',
        }}
      />

      {/* Secondary, cooler bloom for depth. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 44% 40% at ${l.bx}% ${l.by}%, ${COLORS.violet}, transparent 70%)`,
          opacity: glow * (0.14 + 0.08 * breathB),
          filter: 'blur(28px)',
        }}
      />

      {/* Vignette — pulls the eye to centre, standard on premium product film. */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 78% 72% at 50% 48%, transparent 42%, rgba(5,8,14,0.72) 100%)',
        }}
      />

      {children}
    </AbsoluteFill>
  )
}
