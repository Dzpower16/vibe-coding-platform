import React from 'react'
import { COLORS } from '../theme'

/**
 * The glass panel every UI mock sits on: lifted surface, hairline border, a
 * soft violet rim-light at the top edge, and a deep drop shadow that separates
 * it from the backdrop without looking like a 2010s box-shadow.
 */
export const Card: React.FC<{
  children?: React.ReactNode
  style?: React.CSSProperties
  padding?: number
  radius?: number
  /** Adds a violet outer glow — use on the element the beat is about. */
  focus?: boolean
}> = ({ children, style, padding = 34, radius = 26, focus = false }) => (
  <div
    style={{
      position: 'relative',
      padding,
      borderRadius: radius,
      background: `linear-gradient(160deg, rgba(30,41,59,0.92) 0%, ${COLORS.surface} 46%, rgba(11,16,27,0.96) 100%)`,
      border: `1px solid ${COLORS.border}`,
      boxShadow: focus
        ? `0 30px 80px rgba(3,6,12,0.7), 0 0 0 1px rgba(168,85,247,0.28), 0 0 70px rgba(147,51,234,0.30)`
        : '0 26px 70px rgba(3,6,12,0.62)',
      overflow: 'hidden',
      ...style,
    }}
  >
    {/* Top rim-light — the detail that makes a dark card read as glass. */}
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: '9%',
        right: '9%',
        height: 1,
        background: `linear-gradient(90deg, transparent, rgba(168,85,247,0.55), transparent)`,
      }}
    />
    {children}
  </div>
)

/** Small pill used for metadata, compatibility names, and detections. */
export const Chip: React.FC<{
  children: React.ReactNode
  tone?: 'violet' | 'neutral' | 'success'
  style?: React.CSSProperties
}> = ({ children, tone = 'neutral', style }) => {
  const tones = {
    violet: {
      bg: 'rgba(147,51,234,0.15)',
      border: 'rgba(168,85,247,0.42)',
      color: COLORS.violetLight,
    },
    neutral: {
      bg: 'rgba(148,163,184,0.09)',
      border: COLORS.border,
      color: COLORS.muted,
    },
    success: {
      bg: 'rgba(52,211,153,0.13)',
      border: 'rgba(52,211,153,0.4)',
      color: COLORS.success,
    },
  }[tone]

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 20px',
        borderRadius: 999,
        background: tones.bg,
        border: `1px solid ${tones.border}`,
        color: tones.color,
        fontFamily: 'Inter, sans-serif',
        fontSize: 20,
        fontWeight: 500,
        letterSpacing: '-0.005em',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** Circular check mark used for every "done" confirmation in the film. */
export const CheckMark: React.FC<{ size?: number; progress?: number; color?: string }> = ({
  size = 34,
  progress = 1,
  color = COLORS.success,
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
    }}
  >
    <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none">
      <path
        d="M4 12.5L9.5 18L20 6.5"
        stroke="#06231A"
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
