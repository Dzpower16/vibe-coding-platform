'use client'

import { useSyncExternalStore } from 'react'
import { ecouterChargementIA, etatChargementIA, type EtatChargementIA } from '@/lib/mediapipe/holistic'

const ATTENTE: EtatChargementIA = { etape: 'attente' }
const mo = (octets: number) => (octets / 1_000_000).toLocaleString('fr-CA', { maximumFractionDigits: 1 })

/** État du chargement de la détection (modèle IA), pour tout composant client. */
export function useChargementIA(): EtatChargementIA {
  return useSyncExternalStore(ecouterChargementIA, etatChargementIA, () => ATTENTE)
}

/**
 * Superposition affichée sur l'aperçu caméra pendant le chargement.
 * Visuel d'abord : barre de progression, pourcentage, taille et message clair.
 */
export function ChargementIA() {
  const etat = useChargementIA()

  let titre = 'Ouverture de la caméra…'
  let detail: string | null = null
  let pourcent: number | null = null

  if (etat.etape === 'telechargement') {
    pourcent = Math.min(100, Math.round((etat.recu / etat.total) * 100))
    titre = `Téléchargement : ${pourcent} %`
    detail = `${mo(etat.recu)} / ${mo(etat.total)} Mo — une seule fois, ensuite c’est instantané`
  } else if (etat.etape === 'preparation') {
    titre = 'Préparation de la détection des mains…'
    detail = 'Quelques secondes'
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/75 p-4 text-center text-white">
      <p role="status" aria-live="polite" className="text-lg font-semibold">
        <span aria-hidden>{etat.etape === 'telechargement' ? '⬇️ ' : '⏳ '}</span>
        {titre}
      </p>
      <div
        className="h-3 w-full max-w-xs overflow-hidden rounded-full bg-white/25"
        role="progressbar"
        aria-label="Chargement de la détection des mains"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pourcent ?? undefined}
      >
        <div
          className={`h-full rounded-full bg-white transition-[width] duration-200 ${pourcent === null ? 'w-1/3 animate-pulse' : ''}`}
          style={pourcent === null ? undefined : { width: `${pourcent}%` }}
        />
      </div>
      {detail && <p className="max-w-xs text-sm text-white/85">{detail}</p>}
    </div>
  )
}
