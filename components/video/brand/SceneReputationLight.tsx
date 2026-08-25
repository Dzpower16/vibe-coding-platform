import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { LIGHT, FONT } from './lightTheme'
import { enter, ramp, springAt, slowPush, SNAPPY, POP } from '../motion'
import { LightWords, LightEyebrow, LightLine } from './LightType'
import { GlassCard, LightChip, LightCheck } from './LightStudio'

/** Five stars filling one after another. */
const Stars: React.FC<{ delay: number; size?: number; stagger?: number }> = ({
  delay,
  size = 30,
  stagger = 5,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return (
    <div style={{ display: 'flex', gap: 6 }}>
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
              fill={LIGHT.gold}
            />
          </svg>
        )
      })}
    </div>
  )
}

const FileRow: React.FC<{ label: string; value: string; delay: number; accent?: boolean }> = ({
  label,
  value,
  delay,
  accent = false,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 0',
        borderBottom: `1px solid ${LIGHT.border}`,
        ...enter(frame, fps, { delay, y: 11, blur: 6, fade: 11 }),
      }}
    >
      <span style={{ fontFamily: FONT, fontSize: 17, color: LIGHT.dim }}>{label}</span>
      <span
        style={{
          fontFamily: FONT,
          fontSize: 18,
          fontWeight: accent ? 600 : 500,
          color: accent ? LIGHT.success : LIGHT.ink,
        }}
      >
        {value}
      </span>
    </div>
  )
}

/**
 * Réputation Google & dossiers — the follow-up runs itself.
 *
 * The thank-you goes out after the visit, the review lands, the rating moves.
 * The patient file sits alongside as the quieter half of the same promise.
 */
export const SceneReputationLight: React.FC<{ durationInFrames: number }> = ({
  durationInFrames,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const smsIn = springAt({ frame, fps, delay: 80, config: SNAPPY })
  const reviewIn = springAt({ frame, fps, delay: 136, config: POP })
  const rating = ramp(frame, [180, 224], [4.6, 4.9])
  const count = Math.round(ramp(frame, [180, 234], [98, 127]))

  return (
    <AbsoluteFill
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 112px',
        gap: 66,
        transform: `scale(${slowPush(frame, durationInFrames, 0.024)})`,
      }}
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <LightEyebrow delay={0}>Réputation &amp; suivi patient</LightEyebrow>
        <div style={{ height: 28 }} />
        <LightWords
          text="Votre clinique au sommet de Google Maps."
          variant="headline"
          delay={12}
          stagger={4}
          accentWords={['sommet']}
          style={{ maxWidth: 680 }}
        />
        <div style={{ height: 30 }} />
        <LightLine delay={86} variant="body" style={{ maxWidth: 580 }}>
          Après chaque soin, le patient reçoit un mot de remerciement — et une invitation à laisser
          son avis. Sans que personne n&apos;y pense.
        </LightLine>

        <div
          style={{
            marginTop: 46,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 26,
            ...enter(frame, fps, { delay: 180, y: 20, blur: 10 }),
          }}
        >
          <div
            style={{
              fontFamily: FONT,
              fontSize: 92,
              fontWeight: 700,
              letterSpacing: '-0.045em',
              lineHeight: 1,
              color: LIGHT.ink,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {rating.toFixed(1).replace('.', ',')}
          </div>
          <div style={{ paddingBottom: 10 }}>
            <Stars delay={184} size={28} />
            <div
              style={{
                fontFamily: FONT,
                fontSize: 20,
                color: LIGHT.muted,
                marginTop: 10,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {count} avis Google
            </div>
          </div>
        </div>
      </div>

      <div style={{ width: 790, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ opacity: smsIn, transform: `translateX(${(1 - smsIn) * 40}px)` }}>
          <GlassCard padding={24}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 13,
                  background: `linear-gradient(145deg, ${LIGHT.violetLight}, ${LIGHT.violet})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 19,
                  flexShrink: 0,
                }}
              >
                ✉
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FONT, fontSize: 18, fontWeight: 600, color: LIGHT.ink }}>
                  Merci de votre visite, Marie !
                </div>
                <div style={{ fontFamily: FONT, fontSize: 16, color: LIGHT.muted, marginTop: 3 }}>
                  Un instant pour nous laisser un avis ? Ça aide beaucoup notre clinique.
                </div>
              </div>
              <LightChip tone="violet" style={{ fontSize: 15, padding: '7px 14px' }}>
                Auto
              </LightChip>
            </div>
          </GlassCard>
        </div>

        <div
          style={{
            opacity: reviewIn,
            transform: `translateX(${(1 - reviewIn) * 40}px) scale(${0.97 + reviewIn * 0.03})`,
          }}
        >
          <GlassCard padding={24} focus>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  border: `1px solid ${LIGHT.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: FONT,
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#4285F4',
                  flexShrink: 0,
                }}
              >
                G
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontFamily: FONT, fontSize: 18, fontWeight: 600, color: LIGHT.ink }}>
                    Nouvel avis Google
                  </div>
                  <span style={{ fontFamily: FONT, fontSize: 15, color: LIGHT.dim }}>
                    à l&apos;instant
                  </span>
                </div>
                <div style={{ marginTop: 10, marginBottom: 10 }}>
                  <Stars delay={148} size={25} />
                </div>
                <div
                  style={{
                    fontFamily: FONT,
                    fontSize: 17,
                    lineHeight: 1.5,
                    color: LIGHT.muted,
                    fontStyle: 'italic',
                  }}
                >
                  « Rendez-vous obtenu la journée même, équipe super attentionnée. Je recommande
                  sans hésiter. »
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        <div style={{ ...enter(frame, fps, { delay: 218, y: 28, blur: 12 }) }}>
          <GlassCard padding={24}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 13, paddingBottom: 14 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  background: 'rgba(124,58,237,0.10)',
                  border: '1px solid rgba(124,58,237,0.28)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: FONT,
                  fontSize: 15,
                  fontWeight: 700,
                  color: LIGHT.violet,
                }}
              >
                MT
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FONT, fontSize: 19, fontWeight: 600, color: LIGHT.ink }}>
                  Dossier — Marie Tremblay
                </div>
                <div style={{ fontFamily: FONT, fontSize: 15, color: LIGHT.dim }}>
                  Historique complet · Synchronisé
                </div>
              </div>
              <LightCheck size={25} progress={ramp(frame, [238, 258])} color={LIGHT.violet} />
            </div>
            <FileRow label="Dernière visite" value="Aujourd'hui · 14 h 30" delay={232} />
            <FileRow label="Traitement" value="Couronne céramique — 46" delay={244} />
            <FileRow label="Assurance" value="Croix Bleue · 80 % couvert" delay={256} accent />
          </GlassCard>
        </div>
      </div>
    </AbsoluteFill>
  )
}
