import React from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { LIGHT, FONT } from './lightTheme'

/**
 * The seamless studio the brand sting is shot in, rebuilt in CSS: a soft grey
 * cyclorama with a low floor seam, two diagonal window streaks that drift, and
 * a violet bloom that keeps the near-white from reading as blank paper.
 */
export const LightStudio: React.FC<{
  frame?: number
  /** 0→1 across the film; drifts the light so the ground never sits still. */
  progress?: number
  children?: React.ReactNode
}> = ({ frame: frameProp, progress = 0, children }) => {
  const local = useCurrentFrame()
  const frame = frameProp ?? local

  const drift = Math.sin(frame / 150) * 3
  const bloomX = 34 + progress * 32

  return (
    <AbsoluteFill style={{ backgroundColor: LIGHT.bg, overflow: 'hidden' }}>
      {/* Cyclorama: wall above, slightly cooler floor below, soft seam between. */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg,
            ${LIGHT.bgHigh} 0%,
            ${LIGHT.bg} 46%,
            ${LIGHT.bg} 68%,
            ${LIGHT.bgFloor} 100%)`,
        }}
      />
      {/* The floor seam — a very soft horizon, low in frame. */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '76%',
          height: 180,
          background: `linear-gradient(180deg, rgba(36,20,66,0.045) 0%, transparent 70%)`,
          filter: 'blur(22px)',
        }}
      />

      {/* Window streaks — the diagonal highlights in the reference render. */}
      <div
        style={{
          position: 'absolute',
          top: '-30%',
          left: `${44 + drift}%`,
          width: 420,
          height: '150%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)',
          transform: 'rotate(24deg)',
          filter: 'blur(38px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '-30%',
          left: `${62 + drift * 1.6}%`,
          width: 190,
          height: '150%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)',
          transform: 'rotate(24deg)',
          filter: 'blur(26px)',
        }}
      />

      {/* Violet bloom — the one saturated thing in an otherwise neutral room. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 52% 46% at ${bloomX}% 58%, rgba(147,51,234,0.16), transparent 68%)`,
          filter: 'blur(20px)',
        }}
      />

      {/* Edge falloff keeps attention centred. */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 82% 78% at 50% 48%, transparent 46%, rgba(36,20,66,0.10) 100%)',
        }}
      />

      {children}
    </AbsoluteFill>
  )
}

/** White glass panel that floats on the studio floor. */
export const GlassCard: React.FC<{
  children?: React.ReactNode
  style?: React.CSSProperties
  padding?: number
  radius?: number
  /** Adds a violet rim and a wider bloom — use on the beat's focal element. */
  focus?: boolean
}> = ({ children, style, padding = 34, radius = 26, focus = false }) => (
  <div
    style={{
      position: 'relative',
      padding,
      borderRadius: radius,
      background: 'linear-gradient(160deg, #FFFFFF 0%, #FDFCFF 55%, #F7F5FC 100%)',
      border: `1px solid ${focus ? 'rgba(124,58,237,0.22)' : LIGHT.border}`,
      boxShadow: focus
        ? '0 34px 70px rgba(36,20,66,0.13), 0 4px 14px rgba(36,20,66,0.06), 0 0 60px rgba(147,51,234,0.14)'
        : '0 26px 56px rgba(36,20,66,0.10), 0 3px 10px rgba(36,20,66,0.05)',
      overflow: 'hidden',
      ...style,
    }}
  >
    {/* Top rim-light, the same trick the dark cut uses, inverted for white. */}
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: '8%',
        right: '8%',
        height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.35), transparent)',
      }}
    />
    {children}
  </div>
)

/** Pill used for metadata and compatibility names. */
export const LightChip: React.FC<{
  children: React.ReactNode
  tone?: 'violet' | 'neutral' | 'success'
  style?: React.CSSProperties
}> = ({ children, tone = 'neutral', style }) => {
  const t = {
    violet: { bg: 'rgba(124,58,237,0.09)', bd: 'rgba(124,58,237,0.28)', fg: LIGHT.violet },
    neutral: { bg: 'rgba(36,20,66,0.045)', bd: LIGHT.border, fg: LIGHT.muted },
    success: { bg: 'rgba(15,157,110,0.10)', bd: 'rgba(15,157,110,0.3)', fg: LIGHT.success },
  }[tone]
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 9,
        padding: '11px 21px',
        borderRadius: 999,
        background: t.bg,
        border: `1px solid ${t.bd}`,
        color: t.fg,
        fontFamily: FONT,
        fontSize: 20,
        fontWeight: 500,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** Circular check used for every confirmation in the light cut. */
export const LightCheck: React.FC<{ size?: number; progress?: number; color?: string }> = ({
  size = 32,
  progress = 1,
  color = LIGHT.success,
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      boxShadow: `0 4px 12px ${color}44`,
    }}
  >
    <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none">
      <path
        d="M4 12.5L9.5 18L20 6.5"
        stroke="#FFFFFF"
        strokeWidth={3.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - progress}
      />
    </svg>
  </div>
)
