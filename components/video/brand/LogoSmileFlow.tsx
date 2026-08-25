import React from 'react'
import { LIGHT, FONT } from './lightTheme'

/**
 * The real SmileFlow mark: a filled dot sitting above an open smile arc.
 *
 * Rebuilt as vector rather than embedding the supplied raster, so it stays
 * crisp at any size and the arc can stroke itself on — `draw` runs the smile
 * from its left terminal to its right, which is the move the brand's own 3D
 * sting performs.
 */
export const SmileMark: React.FC<{
  size?: number
  /** 0→1 strokes the smile on; the dot fades with the first third. */
  draw?: number
  color?: string
  /** Adds the glassy top-light of the brand's 3D render. */
  glass?: boolean
  style?: React.CSSProperties
}> = ({ size = 120, draw = 1, color = LIGHT.violet, glass = true, style }) => {
  const id = React.useId().replace(/:/g, '')
  const dotIn = Math.min(1, draw / 0.35)

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      style={{ display: 'block', overflow: 'visible', ...style }}
    >
      <defs>
        <linearGradient id={`g-${id}`} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor={LIGHT.violetLight} />
          <stop offset="55%" stopColor={color} />
          <stop offset="100%" stopColor="#5B21B6" />
        </linearGradient>
      </defs>

      {/* The smile — one open arc with round terminals. */}
      <path
        d="M 8 48 Q 50 128 92 48"
        stroke={glass ? `url(#g-${id})` : color}
        strokeWidth={15}
        strokeLinecap="round"
        fill="none"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - draw}
      />

      {/* The dot, up and left of the arc's centre. Its diameter runs a little
          over twice the arc's stroke weight, matching the supplied logo. */}
      <circle
        cx={36}
        cy={17}
        r={15.5}
        fill={glass ? `url(#g-${id})` : color}
        opacity={dotIn}
        transform={`translate(36 17) scale(${0.55 + dotIn * 0.45}) translate(-36 -17)`}
      />

      {/* Specular highlight — the detail that reads as glass rather than flat. */}
      {glass && <circle cx={31.5} cy={11} r={5} fill="#FFFFFF" opacity={dotIn * 0.5} />}
    </svg>
  )
}

/** Mark + wordmark, locked up horizontally as the brand uses it. */
export const SmileFlowLockup: React.FC<{
  /** Height of the mark in px; the wordmark scales from it. */
  size?: number
  draw?: number
  /** 0→1 reveals the wordmark. */
  wordmark?: number
  color?: string
  glass?: boolean
  style?: React.CSSProperties
}> = ({ size = 96, draw = 1, wordmark = 1, color = LIGHT.violet, glass = true, style }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.26, ...style }}>
    <SmileMark size={size} draw={draw} color={color} glass={glass} />
    <span
      style={{
        fontFamily: FONT,
        fontSize: size * 0.82,
        fontWeight: 600,
        letterSpacing: '-0.035em',
        color,
        opacity: wordmark,
        // Wipes in from the mark outwards rather than simply fading.
        clipPath: `inset(0 ${(1 - wordmark) * 100}% 0 0)`,
        whiteSpace: 'nowrap',
      }}
    >
      SmileFlow
    </span>
  </div>
)
