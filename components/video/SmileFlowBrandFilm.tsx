import React from 'react'
import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import './fonts'
import { LIGHT, BRAND_SCENES, BRAND_TOTAL_FRAMES } from './brand/lightTheme'
import { sceneFade } from './motion'
import { LightStudio } from './brand/LightStudio'
import { SceneScribeLight } from './brand/SceneScribeLight'
import { SceneWaitlistLight } from './brand/SceneWaitlistLight'
import { SceneReputationLight } from './brand/SceneReputationLight'
import { SceneOutroLight } from './brand/SceneOutroLight'

const OVERLAP = 15

const Shell: React.FC<{
  duration: number
  first?: boolean
  last?: boolean
  children: React.ReactNode
}> = ({ duration, first = false, last = false, children }) => {
  const frame = useCurrentFrame()
  const opacity = sceneFade(frame, duration, first ? 0 : OVERLAP, last ? 0 : OVERLAP)
  const outScale = last ? 1 : 1 - Math.max(0, (frame - (duration - OVERLAP)) / OVERLAP) * 0.018
  return <AbsoluteFill style={{ opacity, transform: `scale(${outScale})` }}>{children}</AbsoluteFill>
}

/**
 * SmileFlow — brand film (1680 frames @ 30fps, 56s).
 *
 * Opens on the studio's own 3D logo sting, played verbatim with its audio: it
 * builds, lands the mark around 6s, and decays to silence by 10s, so the cut
 * into the content needs no audio fade of its own.
 *
 * Everything after it is rebuilt in that sting's room — near-white cyclorama,
 * white glass cards, violet as the single saturated element — so the film
 * reads as one continuous piece rather than a 3D intro bolted onto a deck.
 */
export const SmileFlowBrandFilm: React.FC = () => {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()

  return (
    <AbsoluteFill style={{ backgroundColor: LIGHT.bg }}>
      <LightStudio frame={frame} progress={frame / durationInFrames} />

      {/* The supplied brand sting. OffthreadVideo carries its audio into the
          render, and the clip is 1280x720 in the same 16:9 as the canvas, so
          it covers rather than pillarboxes. */}
      <Sequence from={BRAND_SCENES.sting.from} durationInFrames={BRAND_SCENES.sting.duration + OVERLAP}>
        <Shell duration={BRAND_SCENES.sting.duration + OVERLAP} first>
          <AbsoluteFill>
            <OffthreadVideo
              src={staticFile('brand/smileflow-logo-sting.mp4')}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </AbsoluteFill>
        </Shell>
      </Sequence>

      <Sequence from={BRAND_SCENES.scribe.from} durationInFrames={BRAND_SCENES.scribe.duration + OVERLAP}>
        <Shell duration={BRAND_SCENES.scribe.duration + OVERLAP}>
          <SceneScribeLight durationInFrames={BRAND_SCENES.scribe.duration + OVERLAP} />
        </Shell>
      </Sequence>

      <Sequence
        from={BRAND_SCENES.waitlist.from}
        durationInFrames={BRAND_SCENES.waitlist.duration + OVERLAP}
      >
        <Shell duration={BRAND_SCENES.waitlist.duration + OVERLAP}>
          <SceneWaitlistLight durationInFrames={BRAND_SCENES.waitlist.duration + OVERLAP} />
        </Shell>
      </Sequence>

      <Sequence
        from={BRAND_SCENES.reputation.from}
        durationInFrames={BRAND_SCENES.reputation.duration + OVERLAP}
      >
        <Shell duration={BRAND_SCENES.reputation.duration + OVERLAP}>
          <SceneReputationLight durationInFrames={BRAND_SCENES.reputation.duration + OVERLAP} />
        </Shell>
      </Sequence>

      <Sequence from={BRAND_SCENES.outro.from} durationInFrames={BRAND_SCENES.outro.duration}>
        <Shell duration={BRAND_SCENES.outro.duration} last>
          <SceneOutroLight durationInFrames={BRAND_SCENES.outro.duration} />
        </Shell>
      </Sequence>
    </AbsoluteFill>
  )
}

export { BRAND_TOTAL_FRAMES }
