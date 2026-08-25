import React from 'react'
import { Composition } from 'remotion'
import { SmileFlowPromoVideo } from '../components/video/SmileFlowPromoVideo'
import { FPS, TOTAL_FRAMES } from '../components/video/theme'

/**
 * Remotion's composition registry.
 *
 * Both cuts run the exact same component — the scenes read the canvas through
 * `useLayout()` and re-flow (side-by-side → stacked, display type scaled down)
 * rather than the vertical being a letterboxed crop of the 16:9 master.
 */
export const RemotionRoot: React.FC = () => (
  <>
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
