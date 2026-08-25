import React from 'react'
import { useCurrentFrame, useVideoConfig } from 'remotion'
import { COLORS, TYPE, typeStyle } from '../theme'
import { enter, EnterOptions } from '../motion'

/**
 * A headline that assembles word by word — each word carries its own
 * blur-to-sharp reveal, offset by `stagger` frames. This is the single most
 * recognisable Apple-keynote text move, and it also hands the shot its rhythm.
 */
export const WordReveal: React.FC<{
  text: string
  variant?: keyof typeof TYPE
  delay?: number
  stagger?: number
  color?: string
  /** Words listed here render in violet — used to carry the key term. */
  accentWords?: string[]
  /** Multiplies the ramp's font size, so the 9:16 cut can bring type down. */
  scale?: number
  style?: React.CSSProperties
  options?: EnterOptions
}> = ({
  text,
  variant = 'headline',
  delay = 0,
  stagger = 3.5,
  color = COLORS.text,
  accentWords = [],
  scale = 1,
  style,
  options,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const words = text.split(' ')
  const accent = new Set(accentWords.map((w) => w.toLowerCase()))
  const base = typeStyle(TYPE[variant])

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: style?.textAlign === 'center' ? 'center' : 'flex-start',
        columnGap: '0.28em',
        rowGap: '0.08em',
        ...base,
        fontSize: (base.fontSize as number) * scale,
        color,
        ...style,
      }}
    >
      {words.map((word, i) => {
        const clean = word.replace(/[.,!?—:]/g, '').toLowerCase()
        return (
          <span
            key={`${word}-${i}`}
            style={{
              display: 'inline-block',
              color: accent.has(clean) ? COLORS.violetLight : undefined,
              ...enter(frame, fps, { delay: delay + i * stagger, y: 22, blur: 12, ...options }),
            }}
          >
            {word}
          </span>
        )
      })}
    </div>
  )
}

/** Small tracked-out uppercase label that names the feature. */
export const Eyebrow: React.FC<{
  children: React.ReactNode
  delay?: number
  color?: string
  style?: React.CSSProperties
}> = ({ children, delay = 0, color = COLORS.violetLight, style }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return (
    <div
      style={{
        ...typeStyle(TYPE.eyebrow),
        textTransform: 'uppercase',
        color,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        ...enter(frame, fps, { delay, y: 14, blur: 8 }),
        ...style,
      }}
    >
      <span
        style={{
          width: 30,
          height: 2,
          borderRadius: 2,
          background: `linear-gradient(90deg, ${COLORS.violet}, ${COLORS.violetLight})`,
        }}
      />
      {children}
    </div>
  )
}

/** Body / subtitle copy with the house reveal. */
export const Line: React.FC<{
  children: React.ReactNode
  variant?: keyof typeof TYPE
  delay?: number
  color?: string
  scale?: number
  style?: React.CSSProperties
  options?: EnterOptions
}> = ({
  children,
  variant = 'subtitle',
  delay = 0,
  color = COLORS.muted,
  scale = 1,
  style,
  options,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const base = typeStyle(TYPE[variant])
  return (
    <div
      style={{
        ...base,
        fontSize: (base.fontSize as number) * scale,
        color,
        ...enter(frame, fps, { delay, y: 18, blur: 10, ...options }),
        ...style,
      }}
    >
      {children}
    </div>
  )
}
