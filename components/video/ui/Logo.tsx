import React from 'react'
import { COLORS, FONT_FAMILY } from '../theme'

/**
 * The SmileFlow mark: a rounded violet tile carrying a smile arc drawn as a
 * stroked path, so it can draw itself on when a scene wants that. The arc
 * doubles as the "flow" idea — one continuous line, no hard corners.
 */
export const LogoMark: React.FC<{
  size?: number
  /** 0→1 draws the smile stroke on. 1 = fully drawn. */
  draw?: number
  style?: React.CSSProperties
}> = ({ size = 96, draw = 1, style }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.29,
      background: `linear-gradient(145deg, ${COLORS.violetLight} 0%, ${COLORS.violetBright} 45%, ${COLORS.violet} 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: `0 18px 46px rgba(124,58,237,0.42), inset 0 1px 0 rgba(255,255,255,0.3)`,
      flexShrink: 0,
      ...style,
    }}
  >
    <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 48 48" fill="none">
      {/* The smile — a single arc, drawn on by pathLength. */}
      <path
        d="M11 26C11 26 15.5 35 24 35C32.5 35 37 26 37 26"
        stroke="#FFFFFF"
        strokeWidth={4.6}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - draw}
      />
      {/* Two eyes, scaled in with the draw so the face lands as one unit. */}
      <circle cx={17} cy={17} r={2.9} fill="#FFFFFF" opacity={draw} />
      <circle cx={31} cy={17} r={2.9} fill="#FFFFFF" opacity={draw} />
    </svg>
  </div>
)

/** Mark + wordmark, locked up horizontally. */
export const LogoLockup: React.FC<{
  size?: number
  draw?: number
  showWordmark?: boolean
  style?: React.CSSProperties
}> = ({ size = 96, draw = 1, showWordmark = true, style }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.3, ...style }}>
    <LogoMark size={size} draw={draw} />
    {showWordmark && (
      <span
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: size * 0.62,
          fontWeight: 600,
          letterSpacing: '-0.035em',
          color: COLORS.text,
        }}
      >
        SmileFlow
      </span>
    )}
  </div>
)
