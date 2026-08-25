import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { LIGHT, FONT } from './lightTheme'
import { enter, hashNoise, ramp, springAt, slowPush, SNAPPY, POP } from '../motion'
import { LightWords, LightEyebrow } from './LightType'
import { GlassCard, LightChip, LightCheck } from './LightStudio'

/** One SOAP row whose body types itself in as the model dictates it. */
const Row: React.FC<{
  letter: string
  label: string
  text: string
  delay: number
  typeFrames: number
}> = ({ letter, label, text, delay, typeFrames }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const local = frame - delay
  const chars = Math.floor(ramp(local, [0, typeFrames], [0, text.length]))
  const done = chars >= text.length
  const badge = springAt({ frame, fps, delay, config: SNAPPY })

  return (
    <div
      style={{
        display: 'flex',
        gap: 18,
        alignItems: 'flex-start',
        ...enter(frame, fps, { delay, y: 14, blur: 7, fade: 12 }),
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 13,
          background: done
            ? `linear-gradient(145deg, ${LIGHT.violetLight}, ${LIGHT.violet})`
            : 'rgba(124,58,237,0.10)',
          border: done ? 'none' : '1px solid rgba(124,58,237,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONT,
          fontSize: 21,
          fontWeight: 700,
          color: done ? '#FFF' : LIGHT.violet,
          flexShrink: 0,
          transform: `scale(${0.72 + badge * 0.28})`,
          boxShadow: done ? '0 6px 16px rgba(124,58,237,0.28)' : 'none',
        }}
      >
        {letter}
      </div>
      <div style={{ flex: 1, paddingTop: 1 }}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: '0.13em',
            textTransform: 'uppercase',
            color: LIGHT.dim,
            marginBottom: 6,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 19,
            lineHeight: 1.5,
            color: LIGHT.muted,
            minHeight: 56,
          }}
        >
          {text.slice(0, chars)}
          {!done && local > 0 && (
            <span
              style={{
                display: 'inline-block',
                width: 2,
                height: 18,
                marginLeft: 2,
                verticalAlign: -3,
                background: LIGHT.violet,
                opacity: Math.floor(frame / 8) % 2 === 0 ? 1 : 0,
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

/** Violet voice waveform — a pure function of frame and bar index. */
const Wave: React.FC<{ active: boolean; delay: number; bars?: number }> = ({
  active,
  delay,
  bars = 44,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const appear = springAt({ frame, fps, delay, config: SNAPPY })
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 88, opacity: appear }}>
      {new Array(bars).fill(0).map((_, i) => {
        const a = hashNoise(i, 3)
        const b = hashNoise(i, 11)
        const w =
          0.5 +
          0.5 * Math.sin(frame / (5 + a * 5) + i * (0.55 + b * 0.5)) * Math.sin(frame / 23 + i * 0.13)
        const env = Math.sin((i / (bars - 1)) * Math.PI) ** 0.65
        const h = active ? 8 + w * env * 72 : 4 + env * 8
        return (
          <div
            key={i}
            style={{
              width: 5,
              height: Math.max(4, h),
              borderRadius: 3,
              background: `linear-gradient(180deg, ${LIGHT.violetLight}, ${LIGHT.violet})`,
              opacity: active ? 0.92 : 0.3,
            }}
          />
        )
      })}
    </div>
  )
}

/**
 * Le Scribe clinique IA — the dictation writes the note.
 *
 * The waveform runs on the left while the SOAP note fills itself in on the
 * right, section by section; the radiograph finding lands last as the payoff.
 */
export const SceneScribeLight: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const dictating = frame > 58 && frame < 246
  const radioIn = springAt({ frame, fps, delay: 264, config: POP })
  const confidence = ramp(frame, [282, 318], [0, 0.85])
  const chips = springAt({ frame, fps, delay: 192, config: POP })

  return (
    <AbsoluteFill
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 112px',
        gap: 66,
        transform: `scale(${slowPush(frame, durationInFrames, 0.026)})`,
      }}
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <LightEyebrow delay={0}>Scribe clinique IA</LightEyebrow>
        <div style={{ height: 28 }} />
        <LightWords
          text="30 secondes de dictée. Zéro paperasse."
          variant="headline"
          delay={12}
          stagger={4}
          accentWords={['zéro', 'paperasse.']}
          style={{ maxWidth: 700 }}
        />

        <div style={{ height: 52 }} />

        <div style={{ ...enter(frame, fps, { delay: 54, y: 16, blur: 8 }) }}>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: dictating ? LIGHT.violet : LIGHT.dim,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: '50%',
                background: dictating ? '#E11D48' : LIGHT.dim,
                opacity: dictating ? 0.55 + 0.45 * Math.sin(frame / 6) : 0.4,
              }}
            />
            {dictating ? 'Dictée en cours' : 'Dictée terminée'}
          </div>
          <Wave active={dictating} delay={54} />
        </div>

        <div
          style={{
            marginTop: 40,
            display: 'flex',
            gap: 13,
            opacity: chips,
            transform: `translateY(${(1 - chips) * 14}px)`,
          }}
        >
          <LightChip tone="violet">◎ Dent 46 détectée</LightChip>
          <LightChip tone="neutral">Quadrant inf. droit</LightChip>
        </div>
      </div>

      <div style={{ width: 840, ...enter(frame, fps, { delay: 84, y: 32, blur: 14, scale: 0.97 }) }}>
        <GlassCard focus padding={36}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: 20,
              marginBottom: 24,
              borderBottom: `1px solid ${LIGHT.border}`,
            }}
          >
            <div>
              <div style={{ fontFamily: FONT, fontSize: 23, fontWeight: 600, color: LIGHT.ink }}>
                Note clinique — SOAP
              </div>
              <div style={{ fontFamily: FONT, fontSize: 16, color: LIGHT.dim, marginTop: 4 }}>
                Générée automatiquement · Brouillon
              </div>
            </div>
            <LightChip tone="violet" style={{ fontSize: 17, padding: '8px 16px' }}>
              IA
            </LightChip>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Row
              letter="S"
              label="Subjectif"
              text="Sensibilité au froid, quadrant inférieur droit, depuis deux semaines."
              delay={100}
              typeFrames={34}
            />
            <Row
              letter="O"
              label="Objectif"
              text="Dent 46 : restauration défectueuse, marge ouverte en distal."
              delay={142}
              typeFrames={32}
            />
            <Row
              letter="A"
              label="Analyse"
              text="Reprise de carie sous restauration. Pronostic favorable."
              delay={182}
              typeFrames={30}
            />
            <Row
              letter="P"
              label="Plan"
              text="Dépose, curetage, couronne céramique. Suivi à trois semaines."
              delay={220}
              typeFrames={32}
            />
          </div>

          <div
            style={{
              marginTop: 26,
              padding: '17px 21px',
              borderRadius: 17,
              background: LIGHT.violetWash,
              border: '1px solid rgba(124,58,237,0.22)',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              opacity: radioIn,
              transform: `scale(${0.95 + radioIn * 0.05})`,
            }}
          >
            <LightCheck size={30} progress={ramp(frame, [276, 296])} color={LIGHT.violet} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FONT, fontSize: 19, fontWeight: 600, color: LIGHT.ink }}>
                Observation radio incluse : Prothèse
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                <div
                  style={{
                    flex: 1,
                    height: 6,
                    borderRadius: 3,
                    background: 'rgba(36,20,66,0.10)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${confidence * 100}%`,
                      height: '100%',
                      borderRadius: 3,
                      background: `linear-gradient(90deg, ${LIGHT.violet}, ${LIGHT.violetLight})`,
                    }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: FONT,
                    fontSize: 18,
                    fontWeight: 600,
                    color: LIGHT.violet,
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
        </GlassCard>
      </div>
    </AbsoluteFill>
  )
}
