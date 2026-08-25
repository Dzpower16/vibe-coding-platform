/**
 * SmileFlow promo video — design tokens.
 *
 * The canvas is a fixed 1920x1080 (or 1080x1920), so every size here is an
 * absolute pixel value at 16:9 reference scale. Scenes read these instead of
 * hard-coding hex/px so the 9:16 variant and any future rebrand stay in sync.
 */

export const COLORS = {
  /** Deep near-black — the primary ground. */
  bg: '#090D16',
  /** Slightly lifted slate, for panels and the vertical gradient's far end. */
  bgAlt: '#0F172A',
  /** Card surface — sits just above bgAlt. */
  surface: '#131C2E',
  /** Hairline borders on cards and chips. */
  border: 'rgba(148, 163, 184, 0.16)',

  /** Electric violet — the primary accent. */
  violet: '#7C3AED',
  /** Vibrant mid violet, used for gradients and glows. */
  violetBright: '#9333EA',
  /** Light violet, for highlights and small accents on dark. */
  violetLight: '#A855F7',

  /** Clinical white — display type. */
  text: '#F8FAFC',
  /** Silver grey — body and secondary type. */
  muted: '#94A3B8',
  /** Dimmed grey for tertiary labels. */
  dim: '#64748B',

  /** Success green, reserved for confirmations (SMS reply, signed note). */
  success: '#34D399',
  /** Google review gold, reserved for the star row. */
  gold: '#FBBF24',
} as const

/** Type ramp. Display sizes are tightly tracked, Apple-style. */
export const TYPE = {
  hero: { size: 104, weight: 700, tracking: -0.042, lineHeight: 1.06 },
  headline: { size: 76, weight: 700, tracking: -0.035, lineHeight: 1.1 },
  title: { size: 46, weight: 600, tracking: -0.025, lineHeight: 1.18 },
  subtitle: { size: 38, weight: 400, tracking: -0.018, lineHeight: 1.35 },
  body: { size: 26, weight: 400, tracking: -0.01, lineHeight: 1.45 },
  label: { size: 21, weight: 500, tracking: 0, lineHeight: 1.3 },
  eyebrow: { size: 19, weight: 600, tracking: 0.16, lineHeight: 1 },
  micro: { size: 17, weight: 500, tracking: 0.01, lineHeight: 1.3 },
} as const

export const FONT_FAMILY = 'Inter, system-ui, -apple-system, sans-serif'

/**
 * Turn a TYPE entry into inline styles. `tracking` is expressed in em so it
 * scales with the size, which is how the ramp stays optically consistent.
 */
export function typeStyle(t: (typeof TYPE)[keyof typeof TYPE]): React.CSSProperties {
  return {
    fontFamily: FONT_FAMILY,
    fontSize: t.size,
    fontWeight: t.weight,
    letterSpacing: `${t.tracking}em`,
    lineHeight: t.lineHeight,
  }
}

/** Scene boundaries in frames at 30fps. Single source of truth for the cut. */
export const FPS = 30
export const SCENES = {
  manifesto: { from: 0, duration: 300 }, // 0–10s
  scribe: { from: 300, duration: 360 }, // 10–22s
  waitlist: { from: 660, duration: 360 }, // 22–34s
  reputation: { from: 1020, duration: 360 }, // 34–46s
  outro: { from: 1380, duration: 420 }, // 46–60s
} as const

export const TOTAL_FRAMES = 1800
