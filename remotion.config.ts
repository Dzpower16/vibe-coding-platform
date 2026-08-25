import { Config } from '@remotion/cli/config'

/**
 * CLI-only configuration (the bundler does not read this file).
 *
 * The film is a dark UI piece with large flat fields and fine hairline
 * borders, so it is captured as PNG rather than JPEG — JPEG chroma
 * subsampling visibly bruises violet-on-near-black gradients.
 */
Config.setVideoImageFormat('png')
Config.setPixelFormat('yuv420p')
Config.setCodec('h264')
Config.setCrf(17)
Config.setOverwriteOutput(true)
