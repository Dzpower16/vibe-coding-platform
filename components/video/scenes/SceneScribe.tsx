import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { COLORS, FONT_FAMILY, TYPE, typeStyle } from '../theme'
import { enter, hashNoise, ramp, springAt, slowPush, SNAPPY, POP } from '../motion'
import { WordReveal, Eyebrow } from '../ui/Type'
import { Card, Chip, CheckMark } from '../ui/Card'
import { useLayout } from '../useLayout'

/** One SOAP row: letter badge, label, and a line that types itself in. */
const SoapRow: React.FC<{
  letter: string
  label: string
  text: string
  delay: number
  typeFrames: number
}> = ({ letter, label, text, delay, typeFrames }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const local = frame - delay

  // Characters land at a steady rate — reads as machine transcription, not a fade.
  const chars = Math.floor(ramp(local, [0, typeFrames], [0, text.length]))
  const shown = text.slice(0, chars)
  const done = chars >= text.length
  const badge = springAt({ frame, fps, delay, config: SNAPPY })

  return (
    <div
      style={{
        display: 'flex',
        gap: 20,
        alignItems: 'flex-start',
        ...enter(frame, fps, { delay, y: 16, blur: 8, fade: 12 }),
      }}
    >
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 13,
          background: done
            ? `linear-gradient(145deg, ${COLORS.violetLight}, ${COLORS.violet})`
            : 'rgba(147,51,234,0.16)',
          border: `1px solid ${done ? 'transparent' : 'rgba(168,85,247,0.4)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONT_FAMILY,
          fontSize: 22,
          fontWeight: 700,
          color: done ? '#FFFFFF' : COLORS.violetLight,
          flexShrink: 0,
          transform: `scale(${0.7 + badge * 0.3})`,
        }}
      >
        {letter}
      </div>
      <div style={{ flex: 1, paddingTop: 2 }}>
        <div
          style={{
            fontFamily: FONT_FAMILY,
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: '0.13em',
            textTransform: 'uppercase',
            color: COLORS.dim,
            marginBottom: 7,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: FONT_FAMILY,
            fontSize: 19,
            fontWeight: 400,
            lineHeight: 1.5,
            color: COLORS.muted,
            minHeight: 58,
          }}
        >
          {shown}
          {!done && local > 0 && (
            <span
              style={{
                display: 'inline-block',
                width: 2,
                height: 19,
                marginLeft: 2,
                verticalAlign: -3,
                background: COLORS.violetLight,
                // Square-wave blink derived from the frame — deterministic.
                opacity: Math.floor(frame / 8) % 2 === 0 ? 1 : 0,
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

/** Violet voice waveform. Bars are a pure function of frame + index. */
const Waveform: React.FC<{ active: boolean; delay: number; bars?: number }> = ({
  active,
  delay,
  bars = 46,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const appear = springAt({ frame, fps, delay, config: SNAPPY })

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        height: 92,
        opacity: appear,
      }}
    >
      {new Array(bars).fill(0).map((_, i) => {
        const seedA = hashNoise(i, 3)
        const seedB = hashNoise(i, 11)
        // Two detuned sines per bar so neighbours never march in lockstep.
        const wave =
          0.5 +
          0.5 *
            Math.sin(frame / (5 + seedA * 5) + i * (0.55 + seedB * 0.5)) *
            Math.sin(frame / 23 + i * 0.13)
        // Envelope keeps the middle of the bank taller — reads as a voice, not a bar chart.
        const envelope = Math.sin((i / (bars - 1)) * Math.PI) ** 0.65
        // Idle keeps a shallow arc rather than a flat row: uniform stubs read
        // as a dotted loading line, a settled waveform reads as "mic is off".
        const h = active ? 8 + wave * envelope * 78 : 4 + envelope * 8
        return (
          <div
            key={i}
            style={{
              width: 5,
              height: Math.max(5, h),
              borderRadius: 3,
              background:
                i % 3 === 0
                  ? `linear-gradient(180deg, ${COLORS.violetLight}, ${COLORS.violet})`
                  : `linear-gradient(180deg, ${COLORS.violetBright}, rgba(124,58,237,0.55))`,
              opacity: active ? 0.95 : 0.35,
            }}
          />
        )
      })}
    </div>
  )
}

/**
 * Sequence 2 — Le Scribe Clinique IA & Radios (10–22s).
 *
 * The dictation drives the shot: the waveform runs on the left while the SOAP
 * note writes itself on the right, section by section, and the radiograph
 * finding lands last as the payoff.
 */
export const SceneScribe: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const layout = useLayout()
  const dictating = frame > 62 && frame < 250
  const radioIn = springAt({ frame, fps, delay: 268, config: POP })
  const confidence = ramp(frame, [286, 322], [0, 0.85])
  const toothChip = springAt({ frame, fps, delay: 196, config: POP })

  return (
    <AbsoluteFill
      style={{
        flexDirection: layout.direction,
        alignItems: 'center',
        justifyContent: 'center',
        padding: `0 ${layout.gutter}px`,
        gap: layout.gap,
        transform: `scale(${slowPush(frame, durationInFrames, 0.028)})`,
      }}
    >
      {/* Left — the claim and the live dictation. */}
      <div
        style={{
          flex: layout.portrait ? 'none' : 1,
          width: layout.portrait ? '100%' : undefined,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Eyebrow delay={0}>Scribe clinique IA</Eyebrow>
        <div style={{ height: 30 }} />
        <WordReveal
          text="30 secondes de dictée. Zéro paperasse."
          variant="headline"
          delay={14}
          stagger={4}
          scale={layout.headlineScale}
          accentWords={['zéro', 'paperasse.']}
          style={{ maxWidth: layout.portrait ? '100%' : 720 }}
        />

        <div style={{ height: 56 }} />

        <div style={{ ...enter(frame, fps, { delay: 58, y: 18, blur: 8 }) }}>
          <div
            style={{
              fontFamily: FONT_FAMILY,
              fontSize: 17,
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: dictating ? COLORS.violetLight : COLORS.dim,
              marginBottom: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 11,
            }}
          >
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: '50%',
                background: dictating ? '#F43F5E' : COLORS.dim,
                opacity: dictating ? 0.6 + 0.4 * Math.sin(frame / 6) : 0.4,
              }}
            />
            {dictating ? 'Dictée en cours' : 'Dictée terminée'}
          </div>
          <Waveform active={dictating} delay={58} />
        </div>

        {/* The tooth the model picked out of the dictation. */}
        <div
          style={{
            marginTop: 44,
            display: 'flex',
            gap: 14,
            opacity: toothChip,
            transform: `translateY(${(1 - toothChip) * 14}px)`,
          }}
        >
          <Chip tone="violet">◎ Dent 46 détectée</Chip>
          <Chip tone="neutral">Quadrant inf. droit</Chip>
        </div>
      </div>

      {/* Right — the note writing itself. */}
      <div
        style={{
          width: layout.panelWidth,
          maxWidth: '100%',
          ...enter(frame, fps, { delay: 88, y: 34, blur: 14, scale: 0.97 }),
        }}
      >
        <Card focus padding={38}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: 22,
              marginBottom: 26,
              borderBottom: `1px solid ${COLORS.border}`,
            }}
          >
            <div>
              <div
                style={{
                  ...typeStyle(TYPE.label),
                  color: COLORS.text,
                  fontWeight: 600,
                  fontSize: 23,
                }}
              >
                Note clinique — SOAP
              </div>
              <div
                style={{
                  fontFamily: FONT_FAMILY,
                  fontSize: 16,
                  color: COLORS.dim,
                  marginTop: 5,
                }}
              >
                Générée automatiquement · Brouillon
              </div>
            </div>
            <Chip tone="violet" style={{ fontSize: 17, padding: '8px 16px' }}>
              IA
            </Chip>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 17 }}>
            <SoapRow
              letter="S"
              label="Subjectif"
              text="Sensibilité au froid, quadrant inférieur droit, depuis deux semaines."
              delay={104}
              typeFrames={34}
            />
            <SoapRow
              letter="O"
              label="Objectif"
              text="Dent 46 : restauration défectueuse, marge ouverte en distal."
              delay={146}
              typeFrames={32}
            />
            <SoapRow
              letter="A"
              label="Analyse"
              text="Reprise de carie sous restauration. Pronostic favorable."
              delay={186}
              typeFrames={30}
            />
            <SoapRow
              letter="P"
              label="Plan"
              text="Dépose, curetage, couronne céramique. Suivi à trois semaines."
              delay={224}
              typeFrames={32}
            />
          </div>

          {/* The radiograph finding — the beat's payoff, last in. */}
          <div
            style={{
              marginTop: 28,
              padding: '18px 22px',
              borderRadius: 17,
              background: 'rgba(147,51,234,0.11)',
              border: '1px solid rgba(168,85,247,0.32)',
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              opacity: radioIn,
              transform: `scale(${0.94 + radioIn * 0.06})`,
            }}
          >
            <CheckMark size={32} progress={ramp(frame, [280, 300])} color={COLORS.violetLight} />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: FONT_FAMILY,
                  fontSize: 19,
                  fontWeight: 600,
                  color: COLORS.text,
                }}
              >
                Observation radio incluse : Prothèse
              </div>
              {/* Confidence meter — fills to 85%. */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 9 }}>
                <div
                  style={{
                    flex: 1,
                    height: 6,
                    borderRadius: 3,
                    background: 'rgba(148,163,184,0.18)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${confidence * 100}%`,
                      height: '100%',
                      borderRadius: 3,
                      background: `linear-gradient(90deg, ${COLORS.violet}, ${COLORS.violetLight})`,
                    }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: FONT_FAMILY,
                    fontSize: 18,
                    fontWeight: 600,
                    color: COLORS.violetLight,
                    width: 54,
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {Math.round(confidence * 100)} %
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AbsoluteFill>
  )
}
