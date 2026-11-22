import React from 'react'
import { Composition } from 'remotion'
import { SmileFlowPromoVideo } from '../components/video/SmileFlowPromoVideo'
import { SmileFlowBrandFilm } from '../components/video/SmileFlowBrandFilm'
import { FPS, TOTAL_FRAMES } from '../components/video/theme'
import { BRAND_FPS, BRAND_TOTAL_FRAMES } from '../components/video/brand/lightTheme'
import { AdScribe, AD_SCRIBE_FPS, AD_SCRIBE_FRAMES } from '../components/video/ads/AdScribe'
import { AdWaitlist, AD_WAITLIST_FPS, AD_WAITLIST_FRAMES } from '../components/video/ads/AdWaitlist'
import { AdAvis, AD_AVIS_FPS, AD_AVIS_FRAMES } from '../components/video/ads/AdAvis'
import { AdRecap, AD_RECAP_FPS, AD_RECAP_FRAMES } from '../components/video/ads/AdRecap'

/**
 * Remotion's composition registry.
 *
 * Both cuts run the exact same component — the scenes read the canvas through
 * `useLayout()` and re-flow (side-by-side → stacked, display type scaled down)
 * rather than the vertical being a letterboxed crop of the 16:9 master.
 */
export const RemotionRoot: React.FC = () => (
  <>
    {/* Meta Ads — 9:16 Reels/Stories, one per feature. */}
    <Composition
      id="AdScribe"
      component={AdScribe}
      durationInFrames={AD_SCRIBE_FRAMES}
      fps={AD_SCRIBE_FPS}
      width={1080}
      height={1920}
    />
    <Composition
      id="AdWaitlist"
      component={AdWaitlist}
      durationInFrames={AD_WAITLIST_FRAMES}
      fps={AD_WAITLIST_FPS}
      width={1080}
      height={1920}
    />
    <Composition
      id="AdAvis"
      component={AdAvis}
      durationInFrames={AD_AVIS_FRAMES}
      fps={AD_AVIS_FPS}
      width={1080}
      height={1920}
    />
    <Composition
      id="AdRecap"
      component={AdRecap}
      durationInFrames={AD_RECAP_FRAMES}
      fps={AD_RECAP_FPS}
      width={1080}
      height={1920}
    />

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
