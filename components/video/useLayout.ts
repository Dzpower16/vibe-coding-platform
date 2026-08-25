import { useVideoConfig } from 'remotion'

/**
 * Layout facts derived from the canvas the composition is being rendered at,
 * so the same scene components serve both the 16:9 master and the 9:16 cut
 * instead of the vertical being a letterboxed crop of the horizontal.
 */
export function useLayout() {
  const { width, height } = useVideoConfig()
  const portrait = height > width

  return {
    portrait,
    /** Scenes lay out side-by-side in landscape, stacked in portrait. */
    direction: (portrait ? 'column' : 'row') as 'column' | 'row',
    /** Outer gutter — tighter in portrait, where width is the scarce axis. */
    gutter: portrait ? 64 : 116,
    /** Gap between a scene's major blocks. */
    gap: portrait ? 48 : 70,
    /**
     * Display type has to come down in portrait or a 76px headline eats half
     * the frame before it wraps.
     */
    headlineScale: portrait ? 0.72 : 1,
    heroScale: portrait ? 0.62 : 1,
    /** Width for the primary UI mock. */
    panelWidth: portrait ? 952 : 856,
  }
}
