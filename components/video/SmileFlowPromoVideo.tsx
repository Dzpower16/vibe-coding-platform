import React from 'react'
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from 'remotion'
import './fonts'
import { COLORS, SCENES, TOTAL_FRAMES } from './theme'
import { sceneFade } from './motion'
import { Backdrop } from './ui/Backdrop'
import { SceneManifesto } from './scenes/SceneManifesto'
import { SceneScribe } from './scenes/SceneScribe'
import { SceneWaitlist } from './scenes/SceneWaitlist'
import { SceneReputation } from './scenes/SceneReputation'
import { SceneOutro } from './scenes/SceneOutro'

/**
 * How many frames adjacent scenes overlap. Each scene is extended by this
 * amount past its slot so the outgoing and incoming content are on screen
 * together and genuinely cross-dissolve, with the brief's frame numbers
 * sitting at the midpoint of each transition.
 */
const OVERLAP = 15

/**
 * Wraps a scene's content in the shared cross-dissolve. `useCurrentFrame` is
 * scene-local inside a Sequence, so each scene fades on its own clock.
 */
const SceneShell: React.FC<{
  duration: number
  first?: boolean
  last?: boolean
  children: React.ReactNode
}> = ({ duration, first = false, last = false, children }) => {
  const frame = useCurrentFrame()
  const opacity = sceneFade(frame, duration, first ? 26 : OVERLAP, last ? 0 : OVERLAP)
  // A hair of scale on the way out keeps the dissolve from reading as a
  // dip-to-black; the outgoing shot recedes as the next one arrives.
  const outScale = last ? 1 : 1 - Math.max(0, (frame - (duration - OVERLAP)) / OVERLAP) * 0.02

  return (
    <AbsoluteFill style={{ opacity, transform: `scale(${outScale})` }}>{children}</AbsoluteFill>
  )
}

/**
 * SmileFlow — 60-second product film (1800 frames @ 30fps).
 *
 * The dark ground and its violet blooms live at the top level and run
 * uninterrupted for the full minute; only the scene content swaps. That is
 * what makes five separate beats read as one continuous piece of film rather
 * than a slideshow of backgrounds.
 */
export const SmileFlowPromoVideo: React.FC = () => {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <Backdrop frame={frame} progress={frame / durationInFrames} />

      <Sequence from={SCENES.manifesto.from} durationInFrames={SCENES.manifesto.duration + OVERLAP}>
        <SceneShell duration={SCENES.manifesto.duration + OVERLAP} first>
          <SceneManifesto durationInFrames={SCENES.manifesto.duration + OVERLAP} />
        </SceneShell>
      </Sequence>

      <Sequence from={SCENES.scribe.from} durationInFrames={SCENES.scribe.duration + OVERLAP}>
        <SceneShell duration={SCENES.scribe.duration + OVERLAP}>
          <SceneScribe durationInFrames={SCENES.scribe.duration + OVERLAP} />
        </SceneShell>
      </Sequence>

      <Sequence from={SCENES.waitlist.from} durationInFrames={SCENES.waitlist.duration + OVERLAP}>
        <SceneShell duration={SCENES.waitlist.duration + OVERLAP}>
          <SceneWaitlist durationInFrames={SCENES.waitlist.duration + OVERLAP} />
        </SceneShell>
      </Sequence>

      <Sequence
        from={SCENES.reputation.from}
        durationInFrames={SCENES.reputation.duration + OVERLAP}
      >
        <SceneShell duration={SCENES.reputation.duration + OVERLAP}>
          <SceneReputation durationInFrames={SCENES.reputation.duration + OVERLAP} />
        </SceneShell>
      </Sequence>

      <Sequence from={SCENES.outro.from} durationInFrames={SCENES.outro.duration}>
        <SceneShell duration={SCENES.outro.duration} last>
          <SceneOutro durationInFrames={SCENES.outro.duration} />
        </SceneShell>
      </Sequence>
    </AbsoluteFill>
  )
}

export { TOTAL_FRAMES }
