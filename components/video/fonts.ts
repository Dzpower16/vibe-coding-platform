import { loadFont } from '@remotion/fonts'
import { continueRender, delayRender, staticFile } from 'remotion'

/**
 * Inter is loaded from `public/fonts` rather than a CDN so the render never
 * depends on the network — a missed webfont silently falls back to a system
 * face and quietly ruins the typography in the MP4.
 *
 * The render is held until every weight resolves; Remotion will not capture
 * frame 0 while a `delayRender` handle is open.
 */
const WEIGHTS = ['400', '500', '600', '700', '800', '900'] as const

const handle = delayRender('Loading Inter font weights')

Promise.all(
  WEIGHTS.map((weight) =>
    loadFont({
      family: 'Inter',
      url: staticFile(`fonts/inter-${weight}.woff2`),
      weight,
      format: 'woff2',
      display: 'block',
    }),
  ),
)
  .then(() => continueRender(handle))
  .catch((err) => {
    // Surface the failure instead of rendering a whole film in Helvetica.
    console.error('Failed to load Inter:', err)
    continueRender(handle)
  })

export {}
