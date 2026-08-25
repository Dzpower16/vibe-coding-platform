/**
 * SmileFlow promo video — motion primitives.
 *
 * Everything here is a pure function of the current frame, so the render is
 * deterministic (Remotion renders frames out of order and in parallel — any
 * Math.random/Date.now would tear the video apart).
 *
 * The house feel is Apple-ish: long-tail, heavily damped springs that settle
 * without overshoot, paired with a blur-to-sharp reveal. Nothing bounces.
 */

import { interpolate, spring } from 'remotion'

/** Heavily damped — settles smoothly, never overshoots. The default here. */
export const SMOOTH = { damping: 200, mass: 0.9, stiffness: 110 } as const
/** Slightly quicker settle, for small elements (chips, badges, stars). */
export const SNAPPY = { damping: 200, mass: 0.55, stiffness: 150 } as const
/** The one config allowed a hint of overshoot — reserved for confirmations. */
export const POP = { damping: 14, mass: 0.6, stiffness: 190 } as const

interface SpringArgs {
  frame: number
  fps: number
  delay?: number
  config?: { damping: number; mass: number; stiffness: number }
}

/** A 0→1 spring that starts at `delay` frames into the scene. */
export function springAt({ frame, fps, delay = 0, config = SMOOTH }: SpringArgs) {
  return spring({ frame: frame - delay, fps, config, durationInFrames: undefined })
}

export interface EnterOptions {
  /** Frames to wait before this element starts revealing. */
  delay?: number
  /** How far the element rises into place, in px. */
  y?: number
  /** Peak blur of the reveal, in px. Apple leans on this heavily. */
  blur?: number
  /** Frames the opacity/blur ramp takes. */
  fade?: number
  /** Scale to grow from. 1 disables the scale component. */
  scale?: number
  config?: { damping: number; mass: number; stiffness: number }
}

/**
 * The house reveal: fade + rise + blur-to-sharp, driven by one damped spring.
 * Returns inline styles ready to spread onto a div.
 */
export function enter(
  frame: number,
  fps: number,
  { delay = 0, y = 26, blur = 14, fade = 18, scale = 1, config = SMOOTH }: EnterOptions = {},
): React.CSSProperties {
  const s = springAt({ frame, fps, delay, config })
  const local = frame - delay
  const opacity = interpolate(local, [0, fade], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const blurPx = interpolate(local, [0, fade], [blur, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const translate = (1 - s) * y
  const scaleNow = scale === 1 ? 1 : scale + (1 - scale) * s

  const transforms: string[] = []
  if (y !== 0) transforms.push(`translateY(${translate.toFixed(3)}px)`)
  if (scale !== 1) transforms.push(`scale(${scaleNow.toFixed(4)})`)

  return {
    opacity,
    ...(transforms.length ? { transform: transforms.join(' ') } : {}),
    ...(blurPx > 0.05 ? { filter: `blur(${blurPx.toFixed(2)}px)` } : {}),
  }
}

/** Clamped linear ramp — the workhorse for opacity and simple tweens. */
export function ramp(
  frame: number,
  inputRange: readonly [number, number],
  outputRange: readonly [number, number] = [0, 1],
) {
  return interpolate(frame, inputRange as unknown as number[], outputRange as unknown as number[], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

/**
 * Fade a scene's contents in at the head and out at the tail, so cuts between
 * sequences never hard-pop. `total` is the scene's own duration.
 */
export function sceneFade(frame: number, total: number, inFrames = 20, outFrames = 20) {
  // A zero-length ramp would hand `interpolate` a non-monotonic input range and
  // throw, so each side is only applied when it actually has a duration. The
  // final scene passes outFrames = 0 to hold on its last frame.
  const fadeIn = inFrames > 0 ? ramp(frame, [0, inFrames]) : 1
  const fadeOut = outFrames > 0 ? ramp(frame, [total - outFrames, total], [1, 0]) : 1
  return Math.min(fadeIn, fadeOut)
}

/** Stable per-index pseudo-random in [0,1). Deterministic — safe for Remotion. */
export function hashNoise(index: number, seed = 1): number {
  const x = Math.sin(index * 127.1 + seed * 311.7) * 43758.5453
  return x - Math.floor(x)
}

/**
 * A slow continuous push-in on a scene's contents. Apple never lets a shot sit
 * perfectly still — but the drift has to be small enough to read as intent.
 */
export function slowPush(frame: number, total: number, amount = 0.035) {
  return 1 + ramp(frame, [0, total], [0, amount])
}

/** Count a number up on a damped spring, then hold. */
export function countUp(frame: number, fps: number, to: number, delay = 0, config = SMOOTH) {
  const s = springAt({ frame, fps, delay, config })
  return Math.round(to * s)
}
