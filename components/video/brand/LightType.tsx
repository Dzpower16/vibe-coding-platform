import React from 'react'
import { useCurrentFrame, useVideoConfig } from 'remotion'
import { LIGHT, LIGHT_TYPE, lightType } from './lightTheme'
import { enter, EnterOptions } from '../motion'

/** Headline assembled word by word, each on its own blur-to-sharp reveal. */
export const LightWords: React.FC<{
  text: string
  variant?: keyof typeof LIGHT_TYPE
  delay?: number
  stagger?: number
  color?: string
  accentWords?: string[]
  scale?: number
  style?: React.CSSProperties
  options?: EnterOptions
}> = ({
  text,
  variant = 'headline',
  delay = 0,
  stagger = 3.5,
  color = LIGHT.ink,
  accentWords = [],
  scale = 1,
  style,
  options,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const accent = new Set(accentWords.map((w) => w.toLowerCase()))
  const base = lightType(LIGHT_TYPE[variant])

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: style?.textAlign === 'center' ? 'center' : 'flex-start',
        columnGap: '0.27em',
        rowGap: '0.06em',
        ...base,
        fontSize: (base.fontSize as number) * scale,
        color,
        ...style,
      }}
    >
      {text.split(' ').map((word, i) => (
        <span
          key={`${word}-${i}`}
          style={{
            display: 'inline-block',
            color: accent.has(word.replace(/[.,!?—:]/g, '').toLowerCase())
              ? LIGHT.violet
              : undefined,
            ...enter(frame, fps, { delay: delay + i * stagger, y: 20, blur: 11, ...options }),
          }}
        >
          {word}
        </span>
      ))}
    </div>
  )
}

/** Tracked-out uppercase label naming the feature. */
export const LightEyebrow: React.FC<{
  children: React.ReactNode
  delay?: number
  style?: React.CSSProperties
}> = ({ children, delay = 0, style }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return (
    <div
      style={{
        ...lightType(LIGHT_TYPE.eyebrow),
        textTransform: 'uppercase',
        color: LIGHT.violet,
        display: 'flex',
        alignItems: 'center',
        gap: 13,
        ...enter(frame, fps, { delay, y: 12, blur: 7 }),
        ...style,
      }}
    >
      <span
        style={{
          width: 28,
          height: 2,
          borderRadius: 2,
          background: `linear-gradient(90deg, ${LIGHT.violet}, ${LIGHT.violetLight})`,
        }}
      />
      {children}
    </div>
  )
}

/** Body / subtitle copy. */
export const LightLine: React.FC<{
  children: React.ReactNode
  variant?: keyof typeof LIGHT_TYPE
  delay?: number
  color?: string
  scale?: number
  style?: React.CSSProperties
  options?: EnterOptions
}> = ({
  children,
  variant = 'subtitle',
  delay = 0,
  color = LIGHT.muted,
  scale = 1,
  style,
  options,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const base = lightType(LIGHT_TYPE[variant])
  return (
    <div
      style={{
        ...base,
        fontSize: (base.fontSize as number) * scale,
        color,
        ...enter(frame, fps, { delay, y: 16, blur: 9, ...options }),
        ...style,
      }}
    >
      {children}
    </div>
  )
}
