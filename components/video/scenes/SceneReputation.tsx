import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { COLORS, FONT_FAMILY } from '../theme'
import { enter, ramp, springAt, slowPush, SNAPPY, POP } from '../motion'
import { WordReveal, Eyebrow, Line } from '../ui/Type'
import { Card, Chip, CheckMark } from '../ui/Card'
import { useLayout } from '../useLayout'

/** Five stars that fill one after another, each on its own little pop. */
const Stars: React.FC<{ delay: number; size?: number; stagger?: number }> = ({
  delay,
  size = 34,
  stagger = 6,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return (
    <div style={{ display: 'flex', gap: 7 }}>
      {[0, 1, 2, 3, 4].map((i) => {
        const s = springAt({ frame, fps, delay: delay + i * stagger, config: POP })
        return (
          <svg
            key={i}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            style={{ transform: `scale(${0.4 + s * 0.6})`, opacity: s }}
          >
            <path
              d="M12 2.4l2.95 5.98 6.6.96-4.775 4.654 1.127 6.573L12 17.47l-5.902 3.103 1.127-6.573L2.45 9.34l6.6-.96L12 2.4z"
              fill={COLORS.gold}
            />
          </svg>
        )
      })}
    </div>
  )
}

/** One row of the patient file. */
const FileRow: React.FC<{
  label: string
  value: string
  delay: number
  accent?: boolean
}> = ({ label, value, delay, accent = false }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '13px 0',
        borderBottom: `1px solid ${COLORS.border}`,
        ...enter(frame, fps, { delay, y: 12, blur: 6, fade: 12 }),
      }}
    >
      <span style={{ fontFamily: FONT_FAMILY, fontSize: 17, color: COLORS.dim }}>{label}</span>
      <span
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: 18,
          fontWeight: accent ? 600 : 500,
          color: accent ? COLORS.success : COLORS.text,
        }}
      >
        {value}
      </span>
    </div>
  )
}

/**
 * Sequence 4 — Réputation Google & Dossiers Patients (34–46s).
 *
 * The follow-up runs itself: the thank-you goes out after the visit, the review
 * lands, the rating moves. The patient file sits alongside as the quieter half
 * of the same promise — everything about the patient in one place.
 */
export const SceneReputation: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const layout = useLayout()
  const smsIn = springAt({ frame, fps, delay: 86, config: SNAPPY })
  const reviewIn = springAt({ frame, fps, delay: 148, config: POP })

  // The rating ticks up as the new review lands.
  const rating = ramp(frame, [196, 240], [4.6, 4.9])
  const reviewCount = Math.round(ramp(frame, [196, 250], [98, 127]))

  return (
    <AbsoluteFill
      style={{
        flexDirection: layout.direction,
        alignItems: 'center',
        justifyContent: 'center',
        padding: `0 ${layout.gutter}px`,
        gap: layout.gap,
        transform: `scale(${slowPush(frame, durationInFrames, 0.026)})`,
      }}
    >
      {/* Left — the claim and the number it moves. */}
      <div
        style={{
          flex: layout.portrait ? 'none' : 1,
          width: layout.portrait ? '100%' : undefined,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Eyebrow delay={0}>Réputation &amp; suivi patient</Eyebrow>
        <div style={{ height: 30 }} />
        <WordReveal
          text="Votre clinique au sommet de Google Maps."
          variant="headline"
          delay={14}
          stagger={4}
          scale={layout.headlineScale}
          accentWords={['sommet']}
          style={{ maxWidth: layout.portrait ? '100%' : 690 }}
        />
        <div style={{ height: 34 }} />
        <Line delay={92} variant="body" style={{ maxWidth: 590 }}>
          Après chaque soin, le patient reçoit un mot de remerciement — et une invitation à laisser
          son avis. Sans que personne n&apos;y pense.
        </Line>

        {/* The rating, moving. */}
        <div
          style={{
            marginTop: 52,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 28,
            ...enter(frame, fps, { delay: 196, y: 22, blur: 10 }),
          }}
        >
          <div>
            <div
              style={{
                fontFamily: FONT_FAMILY,
                fontSize: 96,
                fontWeight: 700,
                letterSpacing: '-0.045em',
                lineHeight: 1,
                color: COLORS.text,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {rating.toFixed(1).replace('.', ',')}
            </div>
          </div>
          <div style={{ paddingBottom: 12 }}>
            <Stars delay={200} size={30} stagger={5} />
            <div
              style={{
                fontFamily: FONT_FAMILY,
                fontSize: 20,
                color: COLORS.muted,
                marginTop: 11,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {reviewCount} avis Google
            </div>
          </div>
        </div>
      </div>

      {/* Right — the two artefacts, stacked. */}
      <div
        style={{
          width: layout.portrait ? '100%' : 800,
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
        }}
      >
        {/* Thank-you SMS. */}
        <div
          style={{
            opacity: smsIn,
            transform: `translateX(${(1 - smsIn) * 44}px)`,
          }}
        >
          <Card padding={26}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 13,
                  background: `linear-gradient(145deg, ${COLORS.violetLight}, ${COLORS.violet})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  flexShrink: 0,
                }}
              >
                ✉
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: FONT_FAMILY,
                    fontSize: 18,
                    fontWeight: 600,
                    color: COLORS.text,
                  }}
                >
                  Merci de votre visite, Marie !
                </div>
                <div
                  style={{
                    fontFamily: FONT_FAMILY,
                    fontSize: 16,
                    color: COLORS.muted,
                    marginTop: 4,
                  }}
                >
                  Un instant pour nous laisser un avis ? Ça aide beaucoup notre clinique.
                </div>
              </div>
              <Chip tone="violet" style={{ fontSize: 15, padding: '7px 14px' }}>
                Auto
              </Chip>
            </div>
          </Card>
        </div>

        {/* Google review notification. */}
        <div
          style={{
            opacity: reviewIn,
            transform: `translateX(${(1 - reviewIn) * 44}px) scale(${0.96 + reviewIn * 0.04})`,
          }}
        >
          <Card padding={26} focus>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 15 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: FONT_FAMILY,
                  fontSize: 23,
                  fontWeight: 700,
                  color: '#4285F4',
                  flexShrink: 0,
                }}
              >
                G
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONT_FAMILY,
                      fontSize: 18,
                      fontWeight: 600,
                      color: COLORS.text,
                    }}
                  >
                    Nouvel avis Google
                  </div>
                  <span style={{ fontFamily: FONT_FAMILY, fontSize: 15, color: COLORS.dim }}>
                    à l&apos;instant
                  </span>
                </div>
                <div style={{ marginTop: 11, marginBottom: 11 }}>
                  <Stars delay={162} size={26} stagger={5} />
                </div>
                <div
                  style={{
                    fontFamily: FONT_FAMILY,
                    fontSize: 17,
                    lineHeight: 1.5,
                    color: COLORS.muted,
                    fontStyle: 'italic',
                  }}
                >
                  « Rendez-vous obtenu la journée même, équipe super attentionnée. Je recommande
                  sans hésiter. »
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Patient file. */}
        <div style={{ ...enter(frame, fps, { delay: 236, y: 30, blur: 12 }) }}>
          <Card padding={26}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                paddingBottom: 16,
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  background: 'rgba(147,51,234,0.2)',
                  border: '1px solid rgba(168,85,247,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: FONT_FAMILY,
                  fontSize: 15,
                  fontWeight: 700,
                  color: COLORS.violetLight,
                }}
              >
                MT
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: FONT_FAMILY,
                    fontSize: 19,
                    fontWeight: 600,
                    color: COLORS.text,
                  }}
                >
                  Dossier — Marie Tremblay
                </div>
                <div style={{ fontFamily: FONT_FAMILY, fontSize: 15, color: COLORS.dim }}>
                  Historique complet · Synchronisé
                </div>
              </div>
              <CheckMark size={26} progress={ramp(frame, [258, 278])} color={COLORS.violetLight} />
            </div>
            <FileRow label="Dernière visite" value="Aujourd'hui · 14 h 30" delay={252} />
            <FileRow label="Traitement" value="Couronne céramique — 46" delay={264} />
            <FileRow label="Assurance" value="Croix Bleue · 80 % couvert" delay={276} accent />
          </Card>
        </div>
      </div>
    </AbsoluteFill>
  )
}
