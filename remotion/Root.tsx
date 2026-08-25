import React from 'react'
import { Composition } from 'remotion'
import { SmileFlowPromoVideo } from '../components/video/SmileFlowPromoVideo'
import { SmileFlowBrandFilm } from '../components/video/SmileFlowBrandFilm'
import { FPS, TOTAL_FRAMES } from '../components/video/theme'
import { BRAND_FPS, BRAND_TOTAL_FRAMES } from '../components/video/brand/lightTheme'

/**
 * Remotion's composition registry.
 *
 * Both cuts run the exact same component — the scenes read the canvas through
 * `useLayout()` and re-flow (side-by-side → stacked, display type scaled down)
 * rather than the vertical being a letterboxed crop of the 16:9 master.
 */
export const RemotionRoot: React.FC = () => (
  <>
    {/* Brand film — opens on the studio's own 3D logo sting (with its audio),
        then continues in that sting's light studio. */}
    <Composition
      id="SmileFlowBrandFilm"
      component={SmileFlowBrandFilm}
      durationInFrames={BRAND_TOTAL_FRAMES}
      fps={BRAND_FPS}
      width={1920}
      height={1080}
    />

    <Composition
      id="SmileFlowPromo"
      component={SmileFlowPromoVideo}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={1920}
      height={1080}
    />

    <Composition
      id="SmileFlowPromoVertical"
      component={SmileFlowPromoVideo}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={1080}
      height={1920}
    />
  </>
)
