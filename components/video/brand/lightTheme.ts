/**
 * Light "studio" palette — matched to the brand's own 3D logo sting.
 *
 * The supplied sting renders a glass violet mark on a soft grey seamless
 * backdrop, so the film that follows it lives in the same room: near-white
 * ground, white cards floating on soft shadows, and violet used sparingly as
 * the one saturated element in frame.
 */

export const LIGHT = {
  /** Seamless studio ground — never pure white, or the cards vanish into it. */
  bg: '#EFEFF3',
  /** The lighter sweep near the top of the backdrop. */
  bgHigh: '#F7F7FA',
  /** The floor, slightly cooler and darker than the wall. */
  bgFloor: '#E4E4EA',
  /** Card surface. */
  surface: '#FFFFFF',
  /** Hairline borders. */
  border: 'rgba(36, 20, 66, 0.09)',

  /** Brand violet — taken from the logo. */
  violet: '#7C3AED',
  violetBright: '#9333EA',
  violetLight: '#A855F7',
  /** Very light violet wash for tinted panels. */
  violetWash: 'rgba(124, 58, 237, 0.07)',

  /** Deep violet-black for display type — warmer than a neutral black. */
  ink: '#241442',
  /** Body copy. */
  muted: '#5B5470',
  /** Tertiary labels. */
  dim: '#918AA6',

  success: '#0F9D6E',
  gold: '#F5A623',
} as const

/** Type ramp for the light cut — a touch heavier than on dark, for contrast. */
export const LIGHT_TYPE = {
  hero: { size: 100, weight: 700, tracking: -0.042, lineHeight: 1.07 },
  headline: { size: 72, weight: 700, tracking: -0.035, lineHeight: 1.1 },
  title: { size: 44, weight: 600, tracking: -0.025, lineHeight: 1.2 },
  subtitle: { size: 36, weight: 400, tracking: -0.016, lineHeight: 1.36 },
  body: { size: 25, weight: 400, tracking: -0.008, lineHeight: 1.5 },
  label: { size: 20, weight: 500, tracking: 0, lineHeight: 1.3 },
  eyebrow: { size: 18, weight: 600, tracking: 0.16, lineHeight: 1 },
} as const

export const FONT = 'Inter, system-ui, -apple-system, sans-serif'

export function lightType(t: (typeof LIGHT_TYPE)[keyof typeof LIGHT_TYPE]): React.CSSProperties {
  return {
    fontFamily: FONT,
    fontSize: t.size,
    fontWeight: t.weight,
    letterSpacing: `${t.tracking}em`,
    lineHeight: t.lineHeight,
  }
}

/** Scene boundaries for the brand film, in frames at 30fps. */
export const BRAND_FPS = 30
export const BRAND_SCENES = {
  /** The supplied 3D logo sting, played verbatim with its own audio. */
  sting: { from: 0, duration: 300 }, // 0–10s
  scribe: { from: 300, duration: 360 }, // 10–22s
  waitlist: { from: 660, duration: 360 }, // 22–34s
  reputation: { from: 1020, duration: 330 }, // 34–45s
  outro: { from: 1350, duration: 330 }, // 45–56s
} as const

export const BRAND_TOTAL_FRAMES = 1680
